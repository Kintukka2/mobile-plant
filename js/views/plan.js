/* ==========================================================================
   Sprout — the plan
   --------------------------------------------------------------------------
   Trace your home over a floorplan, mark which walls are windows, tell me
   which way is north, and drop your plants into it. Every room drawn here is
   an ordinary room in the greenhouse with a shape attached; its light and
   aspect are derived by Plan.sync() rather than asked for.

   Two views of the same rooms: Plan, a top-down editor on a grid, and Home,
   an isometric cut-away with floors shaded by their light. Both pan and
   zoom. The view itself is stateless between visits except for the plan
   data in Store — where you were zoomed to is not part of your home.

   Route:  /plan
   ========================================================================== */

window.ViewPlan = (function () {

  const P = 24;                       // px per grid cell in Plan view
  const A = 22, B = 11;               // isometric half-widths per cell
  const WALL = Plan.WALL, WINDOW = Plan.WINDOW, OPENING = Plan.OPENING;
  const GW = Plan.GW, GH = Plan.GH;

  /* Editor state, kept across renders of this view but never saved. */
  let mode = 'plan';                  // 'plan' | 'home'
  let sel = null;                     // { type: 'room'|'plant', id }
  let tool = 'select';                // 'select' | 'add' | 'backdrop'
  let drawing = null;                 // { pts: [], forRoomId } while tracing corners
  let drag = null;
  let ghostEl = null;
  const ui = { open: { 1: undefined, 2: undefined, 3: undefined, 4: undefined }, hideInner: false };
  const views = { plan: { k: 1, cx: 0, cy: 0 }, home: { k: 1, cx: 0, cy: 0 } };
  let baseVB = null;
  const pointers = new Map();
  let pinch = null;

  let canvas = null, panel = null, root = null;

  /* ---------- Small helpers ---------- */
  const snap = function (v) { return Math.round(v * 2) / 2; };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmtM(v) { return (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + ' m'; }
  function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function iso(x, y, z) { return [(x - y) * A, (x + y) * B - (z || 0)]; }
  function unIso(sx, sy) { return { x: (sx / A + sy / B) / 2, y: (sy / B - sx / A) / 2 }; }
  function wallPx() { return (2.4 / (plan().cell || 0.5)) * 15; }
  function plan() { return Store.get().plan; }
  function rooms() { return Store.get().rooms; }
  function drawn() { return Plan.shaped(); }
  function room(id) { return Store.getRoom(id); }
  function plantsOnPlan() { return Store.activePlants().filter(function (p) { return p.pos && Plan.roomAt(p.pos.x, p.pos.y); }); }
  function rect(x, y, w, h) { return [{ x: x, y: y }, { x: x + w, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }]; }
  function saveShape() { Store.save(); Plan.sync(); }
  function lightLabel(rank) { return rank === null ? '' : LOOKUPS.LIGHT[Plan.keyOf(rank)].label; }
  const LIGHT_PILL = { 0: '', 1: 'mint', 2: 'mint', 3: 'sun', 4: 'sun' };
  function lightPill(rank) {
    if (rank === null) return UI.pill('Light not set', 'grey');
    return UI.pill(lightLabel(rank), LIGHT_PILL[rank] || 'grey');
  }
  const VERDICT_PILL = { ideal: 'mint', ok: 'sun', poor: 'terra', bad: 'terra' };
  function verdictPill(v) { return v ? UI.pill(v.label, VERDICT_PILL[v.verdict]) : UI.pill('Light unknown', 'grey'); }
  const HEAT = { ideal: 'rgba(63,190,139,0.42)', ok: 'rgba(200,169,107,0.30)', poor: 'rgba(208,138,98,0.12)', bad: 'rgba(208,138,98,0.06)' };
  const RING = { ideal: 'var(--emerald-glow)', ok: 'var(--gold)', poor: 'var(--terra)', bad: 'var(--terra)' };
  function selectedSpecies() {
    if (!sel || sel.type !== 'plant') return null;
    const p = Store.getPlant(sel.id); return p ? Store.species(p) : null;
  }

  /* ---------- Pan and zoom ---------- */
  function curView() { return views[mode]; }
  /* The plan's resting view is the drawn rooms, framed, not the whole grid.
     A home traced in one corner of a 30x24 grid sat small and off-centre,
     and the reader had to pinch it into view every visit. The frame is taken
     once per visit and on Centre, not on every draw: taken on every draw it
     would follow a room being dragged, and the room would look pinned while
     the rest of the plan slid the other way. */
  let fitBox = null;
  function fitOf() {
    const list = drawn();
    if (!list.length) return { x: 0, y: 0, w: GW * P, h: GH * P };
    const all = []; list.forEach(function (r) { r.shape.pts.forEach(function (p) { all.push(p); }); });
    const b = Plan.bbox(all), pad = 2, minW = 12, minH = 9;
    let x0 = b.x0 - pad, y0 = b.y0 - pad, x1 = b.x1 + pad, y1 = b.y1 + pad;
    if (x1 - x0 < minW) { const m = (x0 + x1) / 2; x0 = m - minW / 2; x1 = m + minW / 2; }
    if (y1 - y0 < minH) { const m = (y0 + y1) / 2; y0 = m - minH / 2; y1 = m + minH / 2; }
    return { x: x0 * P, y: y0 * P, w: (x1 - x0) * P, h: (y1 - y0) * P };
  }
  function sameBox(a, b) { return !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h; }
  function centreView() { const v = curView(); v.k = 1; v.cx = 0; v.cy = 0; if (mode === 'plan') fitBox = fitOf(); }
  function viewChanged() {
    const v = curView();
    if (v.k !== 1 || v.cx !== 0 || v.cy !== 0) return true;
    return mode === 'plan' && !sameBox(fitBox, fitOf());
  }
  function applyView(x, y, w, h) {
    baseVB = { x: x, y: y, w: w, h: h };
    const v = curView(), w2 = w / v.k, h2 = h / v.k;
    canvas.setAttribute('viewBox', (x + (w - w2) / 2 + v.cx) + ' ' + (y + (h - h2) / 2 + v.cy) + ' ' + w2 + ' ' + h2);
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  function svgPoint(evt) {
    const pt = canvas.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
    const m = canvas.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    const q = pt.matrixTransform(m.inverse()); return { x: q.x, y: q.y };
  }
  function toPlan(evt) { const q = svgPoint(evt); return mode === 'plan' ? { x: q.x / P, y: q.y / P } : unIso(q.x, q.y); }
  function zoomAt(clientX, clientY, k2) {
    const v = curView(); k2 = clamp(k2, 0.5, 6);
    const before = svgPoint({ clientX: clientX, clientY: clientY });
    const vb = canvas.viewBox.baseVal, fx = (before.x - vb.x) / vb.width, fy = (before.y - vb.y) / vb.height;
    const w2 = baseVB.w / k2, h2 = baseVB.h / k2;
    v.k = k2; v.cx = (before.x - fx * w2) - baseVB.x - (baseVB.w - w2) / 2; v.cy = (before.y - fy * h2) - baseVB.y - (baseVB.h - h2) / 2;
    applyView(baseVB.x, baseVB.y, baseVB.w, baseVB.h); syncOverlays();
  }
  function panBy(dxPx, dyPx) {
    const v = curView(), rc = canvas.getBoundingClientRect(), vb = canvas.viewBox.baseVal;
    const upp = Math.max(vb.width / rc.width, vb.height / rc.height);
    v.cx -= dxPx * upp; v.cy -= dyPx * upp;
    applyView(baseVB.x, baseVB.y, baseVB.w, baseVB.h); syncOverlays();
  }

  /* ======================================================================
     Canvas — Plan
     ====================================================================== */

  function edgeColour(e) {
    if (e.kind === OPENING) return 'var(--emerald-glow)';
    const r = Plan.skyRank(e); if (r === null) return 'var(--ink-4)';
    return r >= 3 ? 'var(--gold)' : 'var(--plan-pane-dim)';
  }

  function drawPlan() {
    if (!fitBox) fitBox = fitOf();
    applyView(fitBox.x, fitBox.y, fitBox.w, fitBox.h);
    const pl = plan();
    let h = '';
    if (pl.backdrop && pl.backdrop.src) {
      const b = pl.backdrop;
      h += '<image href="' + UI.attr(b.src) + '" x="' + b.x + '" y="' + b.y + '" width="' + (GW * P * b.scale) + '" opacity="' + b.opacity + '" preserveAspectRatio="xMinYMin meet" style="pointer-events:none"></image>';
    }
    h += '<g>';
    for (let i = 0; i <= GW; i++) h += '<line x1="' + (i * P) + '" y1="0" x2="' + (i * P) + '" y2="' + (GH * P) + '" stroke="var(' + (i % 2 ? '--plan-grid' : '--plan-grid-2') + ')"/>';
    for (let j = 0; j <= GH; j++) h += '<line x1="0" y1="' + (j * P) + '" x2="' + (GW * P) + '" y2="' + (j * P) + '" stroke="var(' + (j % 2 ? '--plan-grid' : '--plan-grid-2') + ')"/>';
    h += '</g>';

    drawn().forEach(function (r) {
      const rank = Plan.roomRank(r), fill = rank === null ? 'var(--plan-floor-x)' : 'var(--plan-floor-' + rank + ')';
      const on = sel && sel.type === 'room' && sel.id === r.id, sh = r.shape;
      h += '<g><polygon points="' + sh.pts.map(function (p) { return (p.x * P) + ',' + (p.y * P); }).join(' ') + '" data-room-body="' + UI.attr(r.id) + '" style="fill:' + fill + ';stroke:' + (on ? 'var(--emerald-glow)' : 'var(--plan-wall-edge)') + ';stroke-width:' + (on ? 2.5 : 2) + ';stroke-linejoin:round' + (sh.outdoor ? ';stroke-dasharray:6 4' : '') + '"/>';
      Plan.edges(sh).forEach(function (e) {
        const nb = Plan.across(r, e), lit = e.kind === WINDOW || e.kind === OPENING || (sh.outdoor && !nb);
        if (!lit) return;
        const t0 = 0.12, t1 = 0.88, col = (sh.outdoor && e.kind !== OPENING) ? 'var(--gold)' : edgeColour(e);
        h += '<line x1="' + ((e.a.x + e.dx * t0) * P) + '" y1="' + ((e.a.y + e.dy * t0) * P) + '" x2="' + ((e.a.x + e.dx * t1) * P) + '" y2="' + ((e.a.y + e.dy * t1) * P) + '" stroke="' + col + '" stroke-width="' + (e.kind === OPENING ? 3 : 5) + '" ' + (e.kind === OPENING ? 'stroke-dasharray="3 4" ' : '') + (sh.outdoor && e.kind !== OPENING ? 'opacity="0.55" ' : '') + 'stroke-linecap="round" style="pointer-events:none"/>';
      });
      h += '</g>';
    });

    const hs = selectedSpecies();
    if (hs) Plan.heatCells(hs).forEach(function (c) { h += '<rect x="' + (c.x * P) + '" y="' + (c.y * P) + '" width="' + P + '" height="' + P + '" style="fill:' + HEAT[c.v] + ';pointer-events:none"/>'; });

    drawn().forEach(function (r) {
      const rank = Plan.roomRank(r), c = Plan.centroid(r.shape.pts), cx = c.x * P, cy = c.y * P;
      h += '<text class="plan-name" x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle">' + UI.esc(r.name) + '</text>';
      h += '<text class="plan-tiny" x="' + cx + '" y="' + (cy + 11) + '" text-anchor="middle">' + UI.esc(lightLabel(rank)) + (r.shape.outdoor ? (rank === null ? 'outdoors' : ' · outdoors') : '') + '</text>';
    });

    const selRoom = sel && sel.type === 'room' ? room(sel.id) : null;
    if (selRoom && selRoom.shape) {
      Plan.edges(selRoom.shape).forEach(function (e) {
        const bx = (e.mid.x + e.nx * 0.7) * P, by = (e.mid.y + e.ny * 0.7) * P;
        const fill = e.kind === WINDOW ? 'var(--gold)' : e.kind === OPENING ? 'var(--emerald-glow)' : 'var(--bg-2)';
        h += '<g data-edge="' + e.i + '" style="cursor:pointer"><circle cx="' + bx + '" cy="' + by + '" r="9" style="fill:' + fill + ';stroke:var(--hair-3)"/><text class="plan-badge" x="' + bx + '" y="' + (by + 3) + '" text-anchor="middle" style="fill:' + (e.kind ? 'var(--bg-1)' : 'var(--ink)') + '">' + (e.i + 1) + '</text></g>';
        h += '<circle cx="' + (e.mid.x * P) + '" cy="' + (e.mid.y * P) + '" r="5" data-midpoint="' + e.i + '" style="fill:var(--bg-1);stroke:var(--emerald-glow);stroke-width:1.5;cursor:copy"/>';
      });
      selRoom.shape.pts.forEach(function (p, i) {
        h += '<rect x="' + (p.x * P - 6) + '" y="' + (p.y * P - 6) + '" width="12" height="12" rx="2" data-vertex="' + i + '" style="fill:var(--emerald-glow);stroke:var(--bg-1);stroke-width:2;cursor:move"/>';
      });
    }

    plantsOnPlan().forEach(function (p) { h += plantMark(p, p.pos.x * P, p.pos.y * P, 1); });

    if (drawing && drawing.pts.length) {
      const d = drawing.pts;
      h += '<polyline points="' + d.map(function (p) { return (p.x * P) + ',' + (p.y * P); }).join(' ') + '" style="fill:var(--mint-wash);stroke:var(--emerald-glow);stroke-width:1.5;stroke-dasharray:4 4;pointer-events:none"/>';
      d.forEach(function (p, i) { h += '<circle cx="' + (p.x * P) + '" cy="' + (p.y * P) + '" r="' + (i === 0 ? 7 : 4) + '" style="fill:' + (i === 0 ? 'var(--bg-1)' : 'var(--emerald-glow)') + ';stroke:var(--emerald-glow);stroke-width:2;pointer-events:none"/>'; });
    }
    if (drag && drag.kind === 'draw' && drag.rect) {
      const q = drag.rect;
      h += '<rect x="' + (q.x * P) + '" y="' + (q.y * P) + '" width="' + (q.w * P) + '" height="' + (q.h * P) + '" style="fill:var(--mint-wash);stroke:var(--emerald-glow);stroke-dasharray:4 4;stroke-width:1.5;pointer-events:none"/>';
    }
    canvas.innerHTML = h;
  }

  function compassRose(cx, cy, r, face) {
    const pl = plan(), known = Plan.known(), th = pl.north || 0;
    let h = '<g transform="translate(' + cx + ' ' + cy + ')" data-open-compass="1" style="cursor:pointer">' +
      '<circle r="' + (r + 6) + '" style="fill:transparent"/>' +
      '<circle r="' + r + '" style="fill:' + (face || 'var(--bg-2)') + ';stroke:' + (known ? 'var(--hair-3)' : 'var(--gold)') + '"/>';
    if (known) {
      h += '<g transform="rotate(' + th + ')"><polygon points="0,' + (-r + 5) + ' 4,0 -4,0" style="fill:var(--terra)"/><polygon points="0,' + (r - 5) + ' 4,0 -4,0" style="fill:var(--ink-4)"/>' +
        '<text class="plan-n" y="' + (-r - 4) + '" text-anchor="middle">N</text></g>';
    } else {
      h += '<text class="plan-n" y="3" text-anchor="middle" style="fill:var(--gold-lit)">N?</text>';
    }
    return h + '</g>';
  }

  function plantMark(p, sx, sy, scale) {
    const sp = Store.species(p), r0 = Plan.roomAt(p.pos.x, p.pos.y);
    const v = Plan.verdict(sp, r0 ? Plan.pointRank(r0, p.pos.x, p.pos.y) : null);
    const ring = v ? RING[v.verdict] : 'var(--hair-3)';
    const on = sel && sel.type === 'plant' && sel.id === p.id, r = 10 * scale;
    const letter = Store.displayName(p).charAt(0).toUpperCase();
    let h = '<g data-plant="' + UI.attr(p.id) + '" style="cursor:grab">' +
      '<ellipse cx="' + sx + '" cy="' + (sy + r * 0.9) + '" rx="' + (r * 1.1) + '" ry="' + (r * 0.45) + '" style="fill:rgba(0,0,0,0.22)"/>' +
      '<circle cx="' + sx + '" cy="' + sy + '" r="' + r + '" style="fill:var(--plan-pot);stroke:' + ring + ';stroke-width:' + (on ? 2.6 : 1.6) + '"/>' +
      '<text class="plan-letter" x="' + sx + '" y="' + (sy + 4 * scale) + '" text-anchor="middle" style="font-size:' + (11 * scale) + 'px">' + UI.esc(letter) + '</text>';
    if (v && (v.verdict === 'bad' || v.verdict === 'poor')) h += '<circle cx="' + (sx + r * 0.8) + '" cy="' + (sy - r * 0.8) + '" r="' + (3.2 * scale) + '" style="fill:var(--terra)"/>';
    return h + '</g>';
  }

  /* ======================================================================
     Canvas — Home (isometric)
     ====================================================================== */

  function drawHome() {
    const Z = wallPx(), list = drawn();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function consider(x, y, z) { const p = iso(x, y, z); minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    if (!list.length) { consider(0, 0, 0); consider(GW, 0, 0); consider(0, GH, 0); consider(GW, GH, 0); }
    list.forEach(function (r) { r.shape.pts.forEach(function (p) { consider(p.x, p.y, 0); consider(p.x, p.y, Z); }); });
    let sunAt = null;
    if (Plan.known() && list.length) {
      const all = []; list.forEach(function (r) { r.shape.pts.forEach(function (p) { all.push(p); }); });
      const b = Plan.bbox(all), bearing = Store.hemisphere() === 'south' ? 0 : 180, ang = (bearing + plan().north) * Math.PI / 180;
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rad = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.6 + 2;
      sunAt = { x: cx + Math.sin(ang) * rad, y: cy - Math.cos(ang) * rad };
      consider(sunAt.x, sunAt.y, Z * 0.9); consider(sunAt.x, sunAt.y, -30);
    }
    const pad = 40;
    applyView(minX - pad, minY - pad - 24, maxX - minX + pad * 2, maxY - minY + pad * 2 + 24);

    let h = '';
    if (!list.length) {
      canvas.innerHTML = '<polygon points="' + pts([iso(0, 0, 0), iso(GW, 0, 0), iso(GW, GH, 0), iso(0, GH, 0)]) + '" style="fill:var(--plan-floor-x);stroke:var(--plan-wall-edge)"/>';
      return;
    }
    const ordered = list.slice().sort(function (a, b) { const ca = Plan.centroid(a.shape.pts), cb = Plan.centroid(b.shape.pts); return (ca.x + ca.y) - (cb.x + cb.y); });
    const hs = selectedSpecies(), zp = Z * 0.2;
    function isBack(e) { return (e.nx + e.ny) < 0; }
    function paneFor(e) { const r = Plan.skyRank(e); return r !== null && r >= 3 ? 'var(--plan-pane)' : 'var(--plan-pane-dim)'; }

    ordered.forEach(function (r) {
      const sh = r.shape, rank = Plan.roomRank(r), fill = rank === null ? 'var(--plan-floor-x)' : 'var(--plan-floor-' + rank + ')';
      const on = sel && sel.type === 'room' && sel.id === r.id;
      h += '<g><polygon data-room-body="' + UI.attr(r.id) + '" points="' + pts(sh.pts.map(function (p) { return iso(p.x, p.y, 0); })) + '" style="fill:' + fill + ';stroke:' + (on ? 'var(--emerald-glow)' : 'var(--plan-wall-edge)') + ';stroke-width:' + (on ? 2 : 1) + '"/>';
      if (hs) Plan.heatCells(hs).filter(function (c) { return c.room === r; }).forEach(function (c) {
        h += '<polygon points="' + pts([iso(c.x, c.y, 0), iso(c.x + 1, c.y, 0), iso(c.x + 1, c.y + 1, 0), iso(c.x, c.y + 1, 0)]) + '" style="fill:' + HEAT[c.v] + ';pointer-events:none"/>';
      });
      if (!sh.outdoor) {
        Plan.edges(sh).filter(function (e) { return isBack(e) && e.kind !== OPENING && !(ui.hideInner && Plan.across(r, e)); })
          .sort(function (p, q) { return (p.mid.x + p.mid.y) - (q.mid.x + q.mid.y); })
          .forEach(function (e) {
            h += '<polygon points="' + pts([iso(e.a.x, e.a.y, 0), iso(e.b.x, e.b.y, 0), iso(e.b.x, e.b.y, Z), iso(e.a.x, e.a.y, Z)]) + '" style="fill:' + (Math.abs(e.nx) > Math.abs(e.ny) ? 'var(--plan-wall-a)' : 'var(--plan-wall-b)') + ';stroke:var(--plan-wall-edge);stroke-width:1;pointer-events:none"/>';
            if (e.kind === WINDOW) {
              const p0 = { x: e.a.x + e.dx * 0.25, y: e.a.y + e.dy * 0.25 }, p1 = { x: e.a.x + e.dx * 0.75, y: e.a.y + e.dy * 0.75 };
              h += '<polygon points="' + pts([iso(p0.x, p0.y, Z * 0.35), iso(p1.x, p1.y, Z * 0.35), iso(p1.x, p1.y, Z * 0.85), iso(p0.x, p0.y, Z * 0.85)]) + '" style="fill:' + paneFor(e) + ';opacity:0.92;pointer-events:none"/>';
            }
          });
      }
      const c0 = Plan.centroid(sh.pts), c = iso(c0.x, c0.y, 0);
      h += '<text class="plan-name" x="' + c[0] + '" y="' + (c[1] - 1) + '" text-anchor="middle">' + UI.esc(r.name) + '</text>' +
        '<text class="plan-tiny" x="' + c[0] + '" y="' + (c[1] + 11) + '" text-anchor="middle">' + UI.esc(lightLabel(rank)) + '</text></g>';
    });
    plantsOnPlan().slice().sort(function (a, b) { return (a.pos.x + a.pos.y) - (b.pos.x + b.pos.y); }).forEach(function (p) { const q = iso(p.pos.x, p.pos.y, 0); h += plantMark(p, q[0], q[1] - 6, 1.05); });
    ordered.forEach(function (r) {
      const sh = r.shape;
      Plan.edges(sh).filter(function (e) { return sh.outdoor || !isBack(e) || e.kind === OPENING; }).forEach(function (e) {
        if (ui.hideInner && Plan.across(r, e)) {
          h += '<line x1="' + iso(e.a.x, e.a.y, 0)[0] + '" y1="' + iso(e.a.x, e.a.y, 0)[1] + '" x2="' + iso(e.b.x, e.b.y, 0)[0] + '" y2="' + iso(e.b.x, e.b.y, 0)[1] + '" stroke="var(--plan-wall-edge)" stroke-width="1.5" style="pointer-events:none"/>';
          return;
        }
        const zz = e.kind === OPENING ? zp * 0.35 : zp;
        h += '<polygon points="' + pts([iso(e.a.x, e.a.y, 0), iso(e.b.x, e.b.y, 0), iso(e.b.x, e.b.y, zz), iso(e.a.x, e.a.y, zz)]) + '" style="fill:var(--plan-parapet);stroke:var(--plan-wall-edge);stroke-width:1;pointer-events:none' + (sh.outdoor ? ';stroke-dasharray:3 3' : '') + '"/>';
        if (e.kind === WINDOW && !isBack(e)) {
          const sr = Plan.skyRank(e), col = sr !== null && sr >= 3 ? 'var(--gold)' : 'var(--plan-pane-dim)';
          const p0 = iso(e.a.x + e.dx * 0.25, e.a.y + e.dy * 0.25, zp), p1 = iso(e.a.x + e.dx * 0.75, e.a.y + e.dy * 0.75, zp);
          h += '<line x1="' + p0[0] + '" y1="' + p0[1] + '" x2="' + p1[0] + '" y2="' + p1[1] + '" stroke="' + col + '" stroke-width="4" stroke-linecap="round" style="pointer-events:none"/>';
        }
      });
    });
    if (sunAt) {
      const q = iso(sunAt.x, sunAt.y, Z * 0.9);
      h += '<g style="pointer-events:none"><circle cx="' + q[0] + '" cy="' + q[1] + '" r="9" style="fill:var(--gold);opacity:0.9"/><text class="plan-tiny" x="' + q[0] + '" y="' + (q[1] + 22) + '" text-anchor="middle">midday sun</text></g>';
    }
    canvas.innerHTML = h;
  }

  /* ======================================================================
     Panel
     ====================================================================== */

  function drawPanel() {
    if (sel && sel.type === 'room') { const r = room(sel.id); if (r && r.shape) return panelRoom(r); sel = null; }
    if (sel && sel.type === 'plant') { const p = Store.getPlant(sel.id); if (p && p.pos) return panelPlant(p); sel = null; }
    panelHome();
  }

  /* Every step folds, and every step starts folded: the plan opens as a
     plan, with four headings under it, not a page of instructions. Opening
     one is remembered for the visit, not saved — a fold is a way of clearing
     the page, not a setting. Two exceptions open a step by themselves:
     loading a floorplan image opens Step 1, and Step 2 will not fold while a
     room is being drawn, because the Finish and Undo buttons live inside it. */
  function stepOpen(n) {
    if (n === 2 && drawing) return true;
    return ui.open[n] === true;
  }

  function step(n, title, done) {
    return '<div class="section-head plan-toggle" data-toggle="' + n + '"><h2 class="section-title"><span class="plan-step">Step ' + n + '</span>' + UI.esc(title) + '</h2>' +
      '<span class="row" style="gap:8px">' + (done ? UI.pill('Done', 'mint') : '') + '<span class="plan-chev' + (stepOpen(n) ? ' is-open' : '') + '"></span></span></div>';
  }

  function panelHome() {
    const pl = plan(), list = rooms(), undrawn = list.filter(function (r) { return !r.shape; });
    let h = '';

    /* Step 1 — the floorplan image. */
    h += '<div class="section plan-sec">' + step(1, 'Build your floorplan', pl.done);
    if (stepOpen(1)) {
      h += '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
        (pl.backdrop ? '' : '<button class="btn btn-ghost btn-sm" id="pl-bd-load">Load a floorplan image</button>') +
        '<label class="plan-check"><input type="checkbox" id="pl-done"' + (pl.done ? ' checked' : '') + '> Done with the floorplan</label></div>';
      if (pl.backdrop) {
        h += '<div class="grid-2"><label class="field" style="margin:0"><span class="label">Opacity</span><input class="input" id="pl-bd-op" type="range" min="0.1" max="1" step="0.05" value="' + pl.backdrop.opacity + '"></label>' +
          '<label class="field" style="margin:0"><span class="label">Size</span><input class="input" id="pl-bd-sc" type="range" min="0.3" max="2.5" step="0.02" value="' + pl.backdrop.scale + '"></label></div>' +
          '<div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm' + (tool === 'backdrop' ? ' is-on' : '') + '" id="pl-tool-bd">' + (tool === 'backdrop' ? 'Dragging the image' : 'Move the image') + '</button><button class="btn btn-blood btn-sm" id="pl-bd-remove">Remove backdrop</button></div>' +
          '<p class="hint">Line the image up under the grid and trace each room over it in Step 2. Tick done once every room is drawn and I\'ll drop the image — it never leaves this phone either way.</p>';
      } else {
        h += '<p class="hint">Upload an image of your floorplan. Then use <b>Add a room</b> to trace over it and create each room. Set the dimensions, add windows and you\'re ready to go. Tick the checkbox when you are done.</p>' +
          '<p class="hint" style="margin-top:8px">Or skip this step and draw rooms freehand.</p>';
      }
    }
    h += '</div>';

    /* Step 2 — rooms. */
    h += '<div class="section plan-sec">' + step(2, 'Manage rooms', list.length > 0 && !undrawn.length);
    if (!stepOpen(2)) {
      /* folded */
    } else if (drawing) {
      h += '<p class="hint" style="margin:0 0 10px">Tap each corner in turn. Tap the first corner again to close the room, or drag instead to draw a plain box.</p>' +
        '<div class="row"><button class="btn btn-sm" id="pl-draw-finish"' + (drawing.pts.length < 3 ? ' disabled' : '') + '>Finish room</button>' +
        '<button class="btn btn-ghost btn-sm" id="pl-draw-undo"' + (!drawing.pts.length ? ' disabled' : '') + '>Undo corner</button>' +
        '<button class="btn btn-ghost btn-sm" id="pl-draw-cancel">Cancel</button></div>';
    } else {
      h += '<button class="btn btn-sm' + (tool === 'add' ? ' is-on' : '') + '" id="pl-tool-add">' + UI.icon('plus') + 'Add a room</button>' +
        '<p class="hint" style="margin-top:8px">' + (mode !== 'plan' ? 'Switch to Plan to draw.' : 'Drag for a box, or tap corners for any shape.') + '</p>';
      if (list.length) {
        h += '<div class="stack" style="gap:6px;margin-top:10px">' + list.map(function (r) {
          if (r.shape) return '<button class="plan-row" data-sel-room="' + UI.attr(r.id) + '"><span class="plan-row-nm">' + UI.roomMark(r, 'mono-sm') + UI.esc(r.name) + (r.shape.outdoor ? ' <small>outdoors</small>' : '') + '</span>' + lightPill(Plan.roomRank(r)) + '</button>';
          return '<button class="plan-row is-undrawn" data-draw-room="' + UI.attr(r.id) + '"><span class="plan-row-nm">' + UI.roomMark(r, 'mono-sm') + UI.esc(r.name) + '</span>' + UI.pill('Draw it', 'grey', 'plus') + '</button>';
        }).join('') + '</div>';
        if (undrawn.length) h += '<p class="hint">' + (undrawn.length === 1 ? 'One room was described rather than drawn. ' : undrawn.length + ' rooms were described rather than drawn. ') + 'Tap one to trace it and I\'ll read its light from the plan instead.</p>';
      } else {
        h += '<p class="hint">Nothing drawn yet. Rooms snap to the grid; open one afterwards to name it, mark its windows and type its real size.</p>';
      }
    }
    h += '</div>';

    /* Step 3 — north. */
    const known = Plan.known();
    h += '<div class="section plan-sec">' + step(3, 'Which way is north?', known);
    if (stepOpen(3)) h += '<div class="row" style="justify-content:space-between">' +
        '<span class="row" style="gap:10px"><svg class="plan-mini-rose" viewBox="-30 -30 60 60" data-open-compass="1" aria-hidden="true">' + compassRose(0, 0, 22, 'var(--bg-4)') + '</svg>' +
          (known ? UI.pill('North set · ' + Math.round(pl.north) + '°', 'mint') : UI.pill(pl.northConfirmed ? 'Hemisphere needed' : 'Not set yet', 'sun')) + '</span>' +
        '<button class="btn btn-sm' + (known ? ' btn-ghost' : '') + '" id="pl-open-compass">' + (known ? 'Change' : 'Set north') + '</button></div>' +
      (known ? '' : '<p class="hint">I shade each room by its light only once north is confirmed. Tapping the compass on the plan opens the same dial.</p>');
    h += '</div>';

    /* Step 4 — plants. */
    const plants = Store.activePlants();
    const loose = plants.filter(function (p) { return !(p.pos && Plan.roomAt(p.pos.x, p.pos.y)); });
    h += '<div class="section plan-sec">' + step(4, 'Add plants', plants.length > 0 && !loose.length);
    if (!stepOpen(4)) {
      /* folded */
    } else if (!plants.length) {
      h += '<p class="hint">No plants yet. Add one in the greenhouse and it will appear here to place.</p>';
    } else if (loose.length) {
      h += '<div class="plan-tray">' + loose.map(function (p) {
        const r0 = p.roomId ? Store.getRoom(p.roomId) : null;
        return '<div class="plan-sp" data-plant-tray="' + UI.attr(p.id) + '"><span class="plan-sp-mono">' + UI.esc(Store.displayName(p).charAt(0).toUpperCase()) + '</span><span class="plan-sp-nm">' + UI.esc(Store.displayName(p)) + (r0 ? '<small>' + UI.esc(r0.name) + '</small>' : '') + '</span></div>';
      }).join('') + '</div><p class="hint">Drag a plant into your home to see the best place for it.</p>';
    } else {
      h += '<p class="hint">Every plant is on the plan. Tap one to see how it is doing there.</p>';
    }
    h += '</div>';
    panel.innerHTML = h;
  }

  const KIND_LABEL = ['Wall', 'Window', 'Opening'];
  const CHEV = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>';

  function roomDims(r) {
    const b = Plan.bbox(r.shape.pts), cell = plan().cell || 0.5;
    return { w: (b.x1 - b.x0) * cell, h: (b.y1 - b.y0) * cell, cw: b.x1 - b.x0, ch: b.y1 - b.y0 };
  }

  function panelRoom(r) {
    const sh = r.shape, d = roomDims(r), sun = Plan.sunReach(r), pl = plan();
    const here = plantsOnPlan().filter(function (p) { return Plan.roomAt(p.pos.x, p.pos.y) === r; });
    /* The heading is the name. A "Room" title over a Name field said the same
       thing twice; the field now sits where the title was, in the title's
       own type, with a dotted rule under it as the only sign it can be
       typed into. */
    let h = '<div class="section plan-sec"><div class="section-head"><h2 class="section-title plan-title-edit"><button class="plan-back" id="pl-back" aria-label="Back">' + CHEV + '</button>' +
      '<input class="plan-title-input" id="pl-room-name" value="' + UI.attr(r.name) + '" placeholder="Room name" aria-label="Room name" maxlength="30" autocomplete="off"></h2>' +
      '<label class="plan-check" style="flex:0 0 auto;margin-left:12px"><input type="checkbox" id="pl-room-outdoor"' + (sh.outdoor ? ' checked' : '') + '> Outdoors?</label></div>';
    if (sh.outdoor) h += '<p class="hint" style="margin:0 0 12px">Every side with nothing built beyond it is open to the sky, so there is no need to mark windows here.</p>';
    /* Sizes left this panel for the ruler on the stage: one measured room
       scales the whole plan, so asking for a width and depth on every room
       implied each one needed typing. */
    h += '<span class="label" style="display:flex;align-items:center;gap:8px;margin-bottom:2px">Wall / Window / Opening <button class="plan-help" id="pl-walls-help" aria-label="What do these mean?">?</button></span>' +
      '<p class="hint" style="margin:0 0 10px">Tap to cycle through the options.</p><div class="grid-2">' +
      Plan.edges(sh).map(function (e) {
        const nb = Plan.across(r, e), a = Plan.aspectOf(e), sr = Plan.skyRank(e);
        let sub;
        if (e.kind === WINDOW) sub = a ? LOOKUPS.ASPECT_NAMES[a] + ' · ' + LOOKUPS.LIGHT[Plan.keyOf(sr)].short.toLowerCase() : 'window';
        else if (e.kind === OPENING) sub = nb ? 'open to ' + nb.name : 'opening · nothing beyond';
        else if (sh.outdoor && !nb) sub = a ? 'sky · ' + LOOKUPS.ASPECT_NAMES[a].toLowerCase() : 'open to the sky';
        else sub = nb ? 'shared with ' + nb.name : fmtM(e.len * (pl.cell || 0.5));
        return '<button class="chip plan-wall' + (e.kind === WINDOW ? ' is-on' : e.kind === OPENING ? ' is-open' : '') + '" data-wall="' + e.i + '"><span>' + (e.i + 1) + ' · ' + KIND_LABEL[e.kind] + '</span><small>' + UI.esc(sub) + '</small></button>';
      }).join('') + '</div>' +
      (Plan.known() ? '' : '<p class="hint">Set north and I can say which way each wall faces.</p>');
    if (sun) h += '<p class="hint">Midday sun reaches about ' + fmtM(Math.min(sun.winter, d.h)) + ' into this room in midwinter, and ' + (sun.summer < 0.2 ? 'barely past the sill' : 'about ' + fmtM(sun.summer)) + ' in midsummer.</p>';
    h += '</div>';
    if (here.length) {
      h += '<div class="section plan-sec"><div class="section-head"><h2 class="section-title">In here</h2></div><div class="stack" style="gap:6px">' + here.map(function (p) {
        return '<button class="plan-row" data-sel-plant="' + UI.attr(p.id) + '"><span class="plan-row-nm">' + UI.esc(Store.displayName(p)) + '</span>' + verdictPill(Plan.verdict(Store.species(p), Plan.pointRank(r, p.pos.x, p.pos.y))) + '</button>';
      }).join('') + '</div></div>';
    }
    h += '<div class="section plan-sec"><div class="stack" style="gap:10px">' +
      '<button class="btn btn-ghost btn-sm" id="pl-room-more" style="align-self:flex-start">' + UI.icon('sliders') + 'Icon, humidity, notes</button>' +
      '<div class="row"><button class="btn btn-sm" id="pl-done-sel">Done</button>' +
      '<button class="btn btn-blood btn-sm" id="pl-room-delete">Remove room</button></div></div></div>';
    panel.innerHTML = h;
  }

  function panelPlant(p) {
    const sp = Store.species(p), r0 = Plan.roomAt(p.pos.x, p.pos.y);
    const rank = r0 ? Plan.pointRank(r0, p.pos.x, p.pos.y) : null, v = Plan.verdict(sp, rank);
    let h = '<div class="section plan-sec"><div class="section-head"><h2 class="section-title"><button class="plan-back" id="pl-back" aria-label="Back">' + CHEV + '</button>Plant</h2></div>' +
      '<div class="plan-reading">' + UI.esc(Store.displayName(p)) + '</div>' +
      '<p class="hint" style="margin-top:4px">' + (sp ? UI.esc(sp.common) + ' · ' : '') + (r0 ? 'in the ' + UI.esc(r0.name) : 'not in a room') + '</p>' +
      '<div class="row" style="margin-top:10px">' + lightPill(rank) + verdictPill(v) + '</div>';
    if (sp && sp.light) {
      h += '<p class="hint">Wants ' + UI.esc(LOOKUPS.LIGHT[sp.light.ideal].label.toLowerCase()) +
        ((sp.light.tolerates || []).length ? '; copes with ' + sp.light.tolerates.map(function (k) { return LOOKUPS.LIGHT[k].label.toLowerCase(); }).join(' and ') : '') + '.</p>';
    }
    if (r0 && rank !== null) {
      let near = null, via = null;
      (Plan.sources(r0) || []).forEach(function (s) { const dd = Plan.distToEdge(s.e, p.pos.x, p.pos.y) * (plan().cell || 0.5); if (near === null || dd < near) { near = dd; via = s; } });
      if (via) h += '<p class="hint">About ' + fmtM(near) + ' from the nearest light' + (via.borrowed ? ', borrowed through the opening to the ' + UI.esc(via.borrowed.name) : '') + '.</p>';
    }
    if (Plan.known()) h += '<p class="hint"><span class="plan-swatch" style="background:' + HEAT.ideal + '"></span> perfect &nbsp; <span class="plan-swatch" style="background:' + HEAT.ok + '"></span> fine &nbsp;— shaded on the plan while this plant is selected.</p>';
    h += '</div>';
    if (v && v.verdict !== 'ideal' && Plan.known()) {
      const s = Plan.suggest(sp, p.pos);
      const sv = s ? Plan.verdict(sp, s.rank) : null;
      const better = s && sv && (sv.verdict === 'ideal' || (v.verdict !== 'ok' && sv.verdict === 'ok'));
      if (better) {
        const where = !s.edge ? '' : s.edge.kind === OPENING ? ', by the opening' : ', by the ' + LOOKUPS.ASPECT_NAMES[Plan.aspectOf(s.edge)].toLowerCase() + (s.room.shape.outdoor ? ' side' : ' window');
        h += '<div class="section plan-sec"><div class="section-head"><h2 class="section-title">A better spot</h2></div>' +
          '<p class="hint" style="margin:0 0 10px">' + (s.room === r0 ? 'Closer to the light in here' + UI.esc(where) + '.' : 'Happier in the ' + UI.esc(s.room.name) + UI.esc(where) + '.') + '</p>' +
          '<button class="btn btn-sm" id="pl-move-plant" data-x="' + s.spot.x + '" data-y="' + s.spot.y + '">Move it there</button></div>';
      } else if (v.verdict === 'bad' || v.verdict === 'poor') {
        h += '<div class="section plan-sec"><div class="section-head"><h2 class="section-title">A better spot</h2></div><p class="hint" style="margin:0">Nowhere on this plan suits it yet. A room with a window facing the light it wants would.</p></div>';
      }
    }
    h += '<div class="section plan-sec"><div class="row"><button class="btn btn-sm" id="pl-done-sel">Done</button>' +
      '<button class="btn btn-ghost btn-sm" id="pl-open-plant">Open plant</button>' +
      '<button class="btn btn-ghost btn-sm" id="pl-unplace">Take off the plan</button></div></div>';
    panel.innerHTML = h;
  }

  /* ======================================================================
     Sheets
     ====================================================================== */

  function compassDial() {
    return '<svg id="pl-dial" class="plan-dial" viewBox="-50 -50 100 100"><circle r="46" style="fill:var(--bg-3);stroke:var(--hair-2)"/>' +
      '<g transform="rotate(' + (plan().north || 0) + ')"><line x1="0" y1="34" x2="0" y2="-34" style="stroke:var(--hair-3);stroke-width:1.5"/>' +
      '<polygon points="0,-40 6,-22 -6,-22" style="fill:var(--terra)"/><text y="-34" text-anchor="middle" style="font-family:var(--sans);font-size:9px;fill:var(--ink);letter-spacing:0.1em">N</text><circle r="4" style="fill:var(--ink-3)"/></g></svg>';
  }

  function openCompass() {
    const pl = plan(), guess = Store.hemisphereIsGuess();
    const body =
      '<p class="hint" style="margin:0 0 14px">Turn the dial until N points the way north is in your home, as you look at the plan. A phone compass held flat against the plan is the quickest way to check.</p>' +
      '<div class="row" style="gap:14px;flex-wrap:nowrap;align-items:center">' + compassDial() +
        '<div class="stack" style="flex:1"><div class="plan-reading" id="pl-north-reading">' + Math.round(pl.north || 0) + '°</div>' +
        '<p class="hint" style="margin:0">Drag the dial. It settles in five-degree steps.</p></div></div>' +
      (guess
        ? '<div style="margin-top:16px"><span class="label">Which side of the equator are you on?</span>' +
          '<p class="hint" style="margin:0 0 8px">It decides which way your bright windows face, so I need it before I can read them.</p>' +
          '<div class="row-wrap"><button class="chip" data-pl-hemi="north">Northern hemisphere</button><button class="chip" data-pl-hemi="south">Southern hemisphere</button></div></div>'
        : '<p class="hint" style="margin-top:14px">' + (Store.hemisphere() === 'south' ? 'I\'m reading your windows for the southern hemisphere, so north-facing is your bright side.' : 'I\'m reading your windows for the northern hemisphere, so south-facing is your bright side.') + '</p>') +
      '<div class="row" style="gap:8px;margin-top:18px">' +
        (pl.northConfirmed ? '<button class="btn btn-ghost" data-act="pl-north-clear" style="flex:1">I\'m not sure</button>' : '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>') +
        '<button class="btn" data-act="pl-north-confirm" style="flex:1">' + (pl.northConfirmed ? 'Keep this' : 'Confirm north') + '</button>' +
      '</div>';
    UI.openSheet('Which way is north?', body, function (sheet) {
      const dial = sheet.querySelector('#pl-dial');
      dial.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        try { dial.setPointerCapture(e.pointerId); } catch (err) { }
        const rc = dial.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
        function angle(ev) { return (Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI + 360) % 360; }
        function move(ev) {
          const n = Math.round(angle(ev) / 5) * 5 % 360;
          Store.get().plan.north = n;
          dial.querySelector('g').setAttribute('transform', 'rotate(' + n + ')');
          const rd = sheet.querySelector('#pl-north-reading'); if (rd) rd.textContent = n + '°';
          if (plan().northConfirmed) { Plan.sync(); drawCanvas(); }
        }
        function up() { dial.removeEventListener('pointermove', move); dial.removeEventListener('pointerup', up); Store.save(); }
        dial.addEventListener('pointermove', move); dial.addEventListener('pointerup', up);
      });
      /* Bound to the buttons, not the sheet plate. The plate outlives every
         sheet, so a delegate added there stacked up one copy per opening and
         a hemisphere chip ended up reopening the dial as many times as it had
         ever been shown. The buttons are rebuilt each time, so these go with
         them. */
      sheet.querySelectorAll('[data-pl-hemi]').forEach(function (b) {
        b.addEventListener('click', function () { Store.updateProfile({ hemisphere: b.getAttribute('data-pl-hemi') }); UI.closeSheet(); setTimeout(openCompass, 230); });
      });
      const ok = sheet.querySelector('[data-act="pl-north-confirm"]');
      if (ok) ok.addEventListener('click', function () { Store.updatePlan({ northConfirmed: true }); UI.closeSheet(); UI.toast('North confirmed', 'leaf'); redraw(); });
      const clr = sheet.querySelector('[data-act="pl-north-clear"]');
      if (clr) clr.addEventListener('click', function () { Store.updatePlan({ northConfirmed: false }); UI.closeSheet(); redraw(); });
    });
  }

  /* The best free cell in one room for one species: the same heatmap the
     shading uses, so a plant dropped here lands where the room would have
     been shaded greenest, never somewhere the reader could see disagrees
     with the colour. Ties go to the cell nearest the middle, and a cell
     another plant already stands on is passed over so two never stack.
     While north is unknown there is no verdict, and the middle will do. */
  const VERDICT_ORDER = { ideal: 0, ok: 1, poor: 2, bad: 3 };
  function bestSpotIn(r, sp) {
    const c = Plan.centroid(r.shape.pts), b = Plan.bbox(r.shape.pts);
    const taken = plantsOnPlan().map(function (p) { return Math.floor(p.pos.x) + ',' + Math.floor(p.pos.y); });
    const heat = {};
    Plan.heatCells(sp).forEach(function (h) { if (h.room === r) heat[h.x + ',' + h.y] = VERDICT_ORDER[h.v]; });
    let best = null;
    for (let cx = Math.floor(b.x0); cx < Math.ceil(b.x1); cx++) {
      for (let cy = Math.floor(b.y0); cy < Math.ceil(b.y1); cy++) {
        const x = cx + 0.5, y = cy + 0.5, key = cx + ',' + cy;
        if (!Plan.pointIn(r.shape.pts, x, y) || taken.indexOf(key) !== -1) continue;
        const score = heat[key] !== undefined ? heat[key] : 1, d = Math.hypot(x - c.x, y - c.y);
        if (!best || score < best.score || (score === best.score && d < best.d)) best = { x: x, y: y, score: score, d: d };
      }
    }
    return best ? { x: best.x, y: best.y } : { x: Math.round(c.x * 4) / 4, y: Math.round(c.y * 4) / 4 };
  }

  function placeIn(p, r) {
    const spot = bestSpotIn(r, Store.species(p)), moved = p.roomId !== r.id;
    Store.updatePlant(p.id, { roomId: r.id, pos: spot });
    UI.toast((moved ? 'Moved to ' : 'Placed in ') + r.name, 'leaf');
    redraw();
  }

  /* Every plant not already standing in this room, nearest first: the ones
     with no place on the plan yet, then the ones in other rooms. Tapping one
     drops it at its best spot here without a drag — the tray in Step 4 is a
     long scroll away from a room the reader is looking at. */
  function quickAdd(r) {
    const here = plantsOnPlan().filter(function (p) { return Plan.roomAt(p.pos.x, p.pos.y) === r; });
    const rest = Store.activePlants().filter(function (p) { return here.indexOf(p) === -1; });
    const loose = rest.filter(function (p) { return !(p.pos && Plan.roomAt(p.pos.x, p.pos.y)); });
    const elsewhere = rest.filter(function (p) { return loose.indexOf(p) === -1; });
    function row(p) {
      const r0 = p.roomId ? Store.getRoom(p.roomId) : null, sp = Store.species(p), at = bestSpotIn(r, sp);
      const v = Plan.verdict(sp, Plan.pointRank(r, at.x, at.y));
      return '<button class="plan-row" data-quick-plant="' + UI.attr(p.id) + '"><span class="plan-row-nm">' + UI.esc(Store.displayName(p)) +
        (r0 && r0 !== r ? ' <small>' + UI.esc(r0.name) + '</small>' : '') + '</span>' + (v ? verdictPill(v) : '') + '</button>';
    }
    let body = '';
    if (!rest.length) {
      body += '<p class="hint" style="margin:0">' + (Store.activePlants().length ? 'Every plant you have is already in here.' : 'No plants yet. Add one below and I\'ll put it in this room.') + '</p>';
    } else {
      if (loose.length) body += '<span class="label">Not on the plan yet</span><div class="stack" style="gap:6px;margin-bottom:14px">' + loose.map(row).join('') + '</div>';
      if (elsewhere.length) body += '<span class="label">In another room</span><div class="stack" style="gap:6px">' + elsewhere.map(row).join('') + '</div>';
      body += '<p class="hint">Tap one and I\'ll stand it where the light in this room suits it best. You can drag it from there.</p>';
    }
    body += '<div class="row" style="gap:8px;margin-top:18px"><button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Close</button><button class="btn" data-act="pl-quick-new" style="flex:1">New plant here</button></div>';
    UI.openSheet('Add to ' + r.name, body, function (sheet) {
      sheet.querySelectorAll('[data-quick-plant]').forEach(function (b) {
        b.addEventListener('click', function () { const p = Store.getPlant(b.getAttribute('data-quick-plant')); UI.closeSheet(); if (p) placeIn(p, r); });
      });
      const nw = sheet.querySelector('[data-act="pl-quick-new"]');
      if (nw) nw.addEventListener('click', function () { UI.closeSheet(); setTimeout(function () { ViewGreenhouse.addPlantSheet(r.id); }, 230); });
    });
  }

  /* One measured room sizes the plan. Every room is drawn on the same grid,
     so a single real width or depth fixes the metres per cell, and every
     other room's size follows from how many cells it covers. The sheet shows
     those estimates as the reader types, which is the check that the number
     went in right: a bedroom reading eleven metres wide means a slip. */
  function setScale(r, axis, v) {
    const d = roomDims(r), cells = axis === 'w' ? d.cw : d.ch;
    if (!isFinite(v) || v <= 0 || cells <= 0) return false;
    Store.updatePlan({ cell: Math.round((v / cells) * 1000) / 1000, scaleFrom: r.id });
    return true;
  }

  function openDims(prefId) {
    const list = drawn();
    if (!list.length) { UI.toast('Draw a room first and I\'ll size the plan from it', 'warn'); return; }
    let cur = room(prefId) || room(plan().scaleFrom) || list[0];
    function tenth(v) { return Math.round(v * 10) / 10; }
    function estimates() {
      const rest = list.filter(function (r) { return r !== cur; });
      if (!rest.length) return '<p class="hint" style="margin:0">Only this room so far. The ones you draw next will be sized from it.</p>';
      return rest.map(function (r) {
        const d = roomDims(r);
        return '<div class="row" style="justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--hair)"><span style="font-family:var(--serif);font-size:16px">' + UI.esc(r.name) + '</span><span class="section-note">' + fmtM(d.w) + ' × ' + fmtM(d.h) + '</span></div>';
      }).join('');
    }
    const d0 = roomDims(cur);
    const body =
      '<p class="hint" style="margin:0 0 14px">Measure one room and I\'ll scale the rest of the plan from it. Every room sits on the same grid, so one real size is enough.</p>' +
      '<label class="field" style="margin:0 0 12px"><span class="label">The room you measured</span><select class="input" id="pl-dim-room">' +
        list.map(function (r) { return '<option value="' + UI.attr(r.id) + '"' + (r === cur ? ' selected' : '') + '>' + UI.esc(r.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="grid-2"><label class="field" style="margin:0"><span class="label">Width</span><input class="input" id="pl-dim-w" type="number" step="0.1" min="0.5" inputmode="decimal" value="' + tenth(d0.w) + '"></label>' +
        '<label class="field" style="margin:0"><span class="label">Depth</span><input class="input" id="pl-dim-h" type="number" step="0.1" min="0.5" inputmode="decimal" value="' + tenth(d0.h) + '"></label></div>' +
      '<p class="hint">In metres, as written on your floorplan.</p>' +
      '<span class="label">The rest, estimated</span><div id="pl-dim-est">' + estimates() + '</div>' +
      '<div class="row" style="gap:8px;margin-top:18px"><button class="btn" data-act="sheet-cancel" style="flex:1">Done</button></div>';
    UI.openSheet('How big is it?', body, function (sheet) {
      const selEl = sheet.querySelector('#pl-dim-room'), wIn = sheet.querySelector('#pl-dim-w'), hIn = sheet.querySelector('#pl-dim-h'), est = sheet.querySelector('#pl-dim-est');
      selEl.addEventListener('change', function () {
        cur = room(selEl.value) || cur; const d = roomDims(cur);
        wIn.value = tenth(d.w); hIn.value = tenth(d.h); est.innerHTML = estimates();
      });
      function typed(axis, self, other) {
        if (!setScale(cur, axis, parseFloat(self.value))) return;
        const d = roomDims(cur); other.value = tenth(axis === 'w' ? d.h : d.w);
        est.innerHTML = estimates(); drawCanvas();
      }
      wIn.addEventListener('input', function () { typed('w', wIn, hIn); });
      hIn.addEventListener('input', function () { typed('h', hIn, wIn); });
    }, function () { redraw(); });
  }

  function wallsHelp() {
    function row(mark, title, body) {
      return '<div class="row" style="align-items:flex-start;gap:12px;margin-bottom:14px;flex-wrap:nowrap"><span class="plan-mark" style="' + mark + '"></span><div style="min-width:0">' +
        '<div style="font-family:var(--serif);font-size:17px">' + title + '</div><p class="hint" style="margin:3px 0 0">' + body + '</p></div></div>';
    }
    UI.openSheet('Wall, window or opening?',
      row('background:var(--plan-wall-edge)', 'Wall', 'Solid, floor to ceiling. No light comes through. This is what every side starts as.') +
      row('background:var(--gold)', 'Window', 'Glass to the outside, a door with glass in it, or a skylight over this side. The light it gives depends on which way it faces, which is why north matters.') +
      row('background:none;border:1.5px dashed var(--emerald-glow)', 'Opening', 'A doorway or a missing wall to the next room. The room borrows light through it from the room next door, one step dimmer, and only from that room\'s own windows — light crosses one doorway, it is not chained through the whole home.') +
      '<p class="hint" style="margin:0">Tap a side\'s number on the plan, or its row in the panel, to cycle through the three.</p>');
  }

  /* ======================================================================
     Draw everything
     ====================================================================== */

  function drawCanvas() { if (mode === 'plan') drawPlan(); else drawHome(); }

  function syncOverlays() {
    const list = drawn();
    const n = root.querySelector('#pl-notice');
    if (drawing) { n.textContent = drawing.pts.length ? 'Tap the next corner. Tap the first one again to close the room.' : 'Tap a corner to start tracing, or drag to draw a box.'; n.className = 'plan-notice'; n.hidden = false; }
    else if (!Plan.known() && list.length) { n.textContent = 'I\'ll shade the light in each room once north is confirmed. Tap the compass.'; n.className = 'plan-notice is-gold'; n.hidden = false; }
    else if (tool === 'backdrop') { n.textContent = 'Drag to move the floorplan under the grid.'; n.className = 'plan-notice'; n.hidden = false; }
    else n.hidden = true;
    root.querySelector('#pl-reshape').hidden = !(mode === 'plan' && sel && sel.type === 'room');
    root.querySelector('#pl-quick-add').hidden = !(mode === 'plan' && sel && sel.type === 'room' && !drawing);
    const wt = root.querySelector('#pl-walls-toggle');
    wt.hidden = mode !== 'home' || !list.length;
    wt.textContent = ui.hideInner ? 'Show inside walls' : 'Hide inside walls';
    wt.classList.toggle('is-on', !!ui.hideInner);
    root.querySelector('#pl-view-reset').hidden = !viewChanged();
    root.querySelector('#pl-tool-compass').innerHTML = compassRose(0, 0, 22, 'var(--bg-2)');
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-mode') === mode); });
  }

  function redraw() { if (!root || !document.body.contains(root)) return; Plan.sync(); drawCanvas(); drawPanel(); syncOverlays(); }

  /* ======================================================================
     The backdrop image
     ====================================================================== */

  /* The same shape as Photos.pick: an input made on the spot and clicked
     from inside the tap. The first version was a <label> around a hidden
     input, which iOS treats as a label around nothing — a display:none file
     input does not open the picker there. No `capture`, unlike a plant
     photo: a floorplan lives in the photo library or a PDF screenshot, not
     in front of the camera. */
  function pickBackdrop() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.style.position = 'fixed'; input.style.left = '-9999px'; input.style.opacity = '0';
    function cleanup() { if (input.parentNode) input.parentNode.removeChild(input); }
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) { cleanup(); return; }
      if (!/^image\//.test(file.type)) { UI.toast('That file is not an image', 'warn'); cleanup(); return; }
      const rd = new FileReader();
      rd.onload = function () {
        const img = new Image();
        img.onload = function () {
          /* Downscaled hard: it only has to be legible under a grid, and
             localStorage is the whole budget. If even that will not fit,
             keep the rooms and lose the picture. */
          const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          const ok = Store.updatePlan({ backdrop: { src: c.toDataURL('image/jpeg', 0.55), opacity: 0.45, scale: 1, x: 0, y: 0 }, done: false });
          cleanup();
          if (!ok) { Store.updatePlan({ backdrop: null }); return; }
          mode = 'plan'; tool = 'backdrop'; ui.open[1] = true; redraw();
          UI.toast('Line it up, then trace your rooms over it', 'leaf');
        };
        img.onerror = function () { cleanup(); UI.toast('I could not read that image', 'warn'); };
        img.src = rd.result;
      };
      rd.onerror = function () { cleanup(); UI.toast('I could not read that image', 'warn'); };
      rd.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
  }

  /* ======================================================================
     Rooms: create, reshape, edit
     ====================================================================== */

  function finishRoom(points) {
    if (Math.abs(Plan.area2(points)) < 1) { UI.toast('That shape is too thin to be a room', 'warn'); drawing = null; redraw(); return; }
    const shape = Plan.normalise({ pts: points.map(function (p) { return { x: p.x, y: p.y }; }), win: points.map(function () { return WALL; }), outdoor: false });
    let r;
    if (drawing && drawing.forRoomId && room(drawing.forRoomId)) {
      r = room(drawing.forRoomId); r.shape = shape; Store.save();
    } else {
      r = Store.addRoom({ name: 'Room ' + (rooms().length + 1), shape: shape });
    }
    Plan.sync();
    drawing = null; tool = 'select'; sel = { type: 'room', id: r.id };
    redraw();
    const inp = panel.querySelector('#pl-room-name'); if (inp) { inp.focus(); inp.select(); }
  }

  /* ======================================================================
     View contract
     ====================================================================== */

  function title() { return 'Your plan'; }
  function sub() {
    const n = drawn().length, p = plantsOnPlan().length;
    if (!n) return 'Trace your home, then drop plants in';
    return UI.plural(n, 'room') + ' drawn' + (p ? ' · ' + UI.plural(p, 'plant') + ' placed' : '');
  }

  function render() {
    return '<div class="plan">' +
      '<div class="plan-main">' +
        '<div class="tabs" style="margin-bottom:12px"><button class="tab-btn' + (mode === 'plan' ? ' is-on' : '') + '" data-mode="plan">Plan</button><button class="tab-btn' + (mode === 'home' ? ' is-on' : '') + '" data-mode="home">Home</button></div>' +
        '<div class="plan-stage" id="pl-stage">' +
          '<svg id="pl-canvas" xmlns="http://www.w3.org/2000/svg"></svg>' +
          '<div class="plan-notice" id="pl-notice" hidden></div>' +
          '<div class="plan-overlay" id="pl-reshape" hidden>Drag a square corner to reshape the room. Drag the small dot on a wall to add a corner.</div>' +
          '<div class="plan-tools">' +
            '<button class="plan-tool is-rose" data-open-compass="1" aria-label="Which way is north?"><svg id="pl-tool-compass" viewBox="-30 -30 60 60" aria-hidden="true"></svg></button>' +
            '<button class="plan-tool" data-open-dims="1" aria-label="Set the room sizes">' + UI.icon('ruler') + '</button>' +
          '</div>' +
          '<button class="plan-stage-btn is-bottom" id="pl-walls-toggle" hidden></button>' +
          '<button class="plan-stage-btn is-left" id="pl-view-reset" hidden>Centre</button>' +
          '<button class="plan-stage-btn is-left is-bottom" id="pl-quick-add" hidden>' + UI.icon('plus') + 'Add a plant</button>' +
        '</div>' +
      '</div>' +
      '<div class="plan-panel" id="pl-panel"></div>' +
    '</div>';
  }

  function mount(el) {
    root = el; canvas = root.querySelector('#pl-canvas'); panel = root.querySelector('#pl-panel');
    drag = null; pinch = null; pointers.clear();
    views.plan.k = 1; views.plan.cx = 0; views.plan.cy = 0; fitBox = null;
    drawCanvas(); drawPanel(); syncOverlays();

    root.addEventListener('click', function (e) {
      const m = e.target.closest('[data-mode]');
      if (m) { mode = m.getAttribute('data-mode'); if (mode === 'home') { tool = 'select'; drawing = null; } redraw(); return; }
      if (e.target.closest('#pl-walls-toggle')) { ui.hideInner = !ui.hideInner; drawCanvas(); syncOverlays(); return; }
      if (e.target.closest('#pl-view-reset')) { centreView(); drawCanvas(); syncOverlays(); return; }
      if (e.target.closest('.plan-tools [data-open-compass]')) { openCompass(); return; }
      if (e.target.closest('[data-open-dims]')) { openDims(sel && sel.type === 'room' ? sel.id : null); return; }
      if (e.target.closest('#pl-quick-add')) { if (sel && sel.type === 'room') quickAdd(room(sel.id)); return; }
    });

    /* ---- Canvas: wheel, pinch, pan, drag ---- */
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, curView().k * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });

    canvas.addEventListener('pointerdown', function (e) {
      const t = e.target, start = toPlan(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        if (drag && drag.kind === 'plant') { const p = Store.getPlant(drag.id); if (p) p.pos = { x: drag.ox, y: drag.oy }; }
        drag = null;
        const ab = Array.from(pointers.values()), a = ab[0], b = ab[1];
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, k0: curView().k };
        drawCanvas(); return;
      }
      if (pinch) return;
      const pl = t.closest('[data-plant]');
      if (pl) { const p = Store.getPlant(pl.getAttribute('data-plant')); drag = { kind: 'plant', id: p.id, ox: p.pos.x, oy: p.pos.y, sx: start.x, sy: start.y, moved: false }; return; }
      if (mode !== 'plan') { const rb = t.closest('[data-room-body]'); drag = { kind: 'pan', px: e.clientX, py: e.clientY, moved: false, roomId: rb ? rb.getAttribute('data-room-body') : null }; return; }
      const badge = t.closest('[data-edge]'); if (badge) { drag = { kind: 'edge', i: +badge.getAttribute('data-edge') }; return; }
      const vx = t.closest('[data-vertex]'); if (vx) { drag = { kind: 'vertex', id: sel.id, i: +vx.getAttribute('data-vertex') }; return; }
      const mp = t.closest('[data-midpoint]');
      if (mp) {
        const r = room(sel.id), i = +mp.getAttribute('data-midpoint'), ed = Plan.edges(r.shape)[i];
        r.shape.pts.splice(i + 1, 0, { x: snap(ed.mid.x), y: snap(ed.mid.y) }); r.shape.win.splice(i + 1, 0, r.shape.win[i]);
        drag = { kind: 'vertex', id: r.id, i: i + 1 }; drawCanvas(); return;
      }
      if (tool === 'backdrop' && plan().backdrop) { const s = svgPoint(e); drag = { kind: 'bd', sx: s.x, sy: s.y, ox: plan().backdrop.x, oy: plan().backdrop.y }; return; }
      const rb = t.closest('[data-room-body]');
      if (tool === 'add' && !(rb && !drawing)) { drag = { kind: 'draw', sx: snap(start.x), sy: snap(start.y), rect: null, moved: false }; return; }
      if (rb) { drag = { kind: 'room', id: rb.getAttribute('data-room-body'), sx: start.x, sy: start.y, ax: 0, ay: 0, moved: false }; return; }
      drag = { kind: 'pan', px: e.clientX, py: e.clientY, moved: false, roomId: null };
    });

    canvas.addEventListener('pointermove', function (e) {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const ab = Array.from(pointers.values()), a = ab[0], b = ab[1], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        zoomAt(mx, my, pinch.k0 * (d / pinch.d0)); panBy(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my; return;
      }
      if (!drag) return;
      if (drag.kind === 'pan') {
        const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (drag.moved) { panBy(dx, dy); drag.px = e.clientX; drag.py = e.clientY; }
        return;
      }
      const q = toPlan(e);
      if (drag.kind === 'plant') {
        const p = Store.getPlant(drag.id), nx = drag.ox + (q.x - drag.sx), ny = drag.oy + (q.y - drag.sy);
        if (Math.abs(nx - drag.ox) + Math.abs(ny - drag.oy) > 0.15) drag.moved = true;
        p.pos = { x: nx, y: ny }; drawCanvas();
      } else if (drag.kind === 'room') {
        const r = room(drag.id), dx = snap(q.x - drag.sx) - drag.ax, dy = snap(q.y - drag.sy) - drag.ay;
        if (dx || dy) {
          const b = Plan.bbox(r.shape.pts), ddx = clamp(dx, -b.x0, GW - b.x1), ddy = clamp(dy, -b.y0, GH - b.y1);
          Store.activePlants().forEach(function (p) { if (p.pos && Plan.pointIn(r.shape.pts, p.pos.x, p.pos.y)) { p.pos.x += ddx; p.pos.y += ddy; } });
          r.shape.pts.forEach(function (p) { p.x += ddx; p.y += ddy; }); drag.ax += ddx; drag.ay += ddy; drag.moved = true; drawCanvas();
        }
      } else if (drag.kind === 'vertex') {
        const r = room(drag.id); r.shape.pts[drag.i] = { x: clamp(snap(q.x), 0, GW), y: clamp(snap(q.y), 0, GH) }; drawCanvas();
      } else if (drag.kind === 'draw') {
        const x2 = clamp(snap(q.x), 0, GW), y2 = clamp(snap(q.y), 0, GH);
        if (Math.abs(x2 - drag.sx) >= 1 || Math.abs(y2 - drag.sy) >= 1) drag.moved = true;
        if (drag.moved) { drag.rect = { x: Math.min(drag.sx, x2), y: Math.min(drag.sy, y2), w: Math.abs(x2 - drag.sx), h: Math.abs(y2 - drag.sy) }; drawCanvas(); }
      } else if (drag.kind === 'bd') {
        const s = svgPoint(e); plan().backdrop.x = drag.ox + (s.x - drag.sx); plan().backdrop.y = drag.oy + (s.y - drag.sy); drawCanvas();
      }
    });

    canvas.addEventListener('pointerup', function (e) {
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; return; }
      if (!drag) return;
      const d = drag; drag = null;
      if (d.kind === 'pan') { if (!d.moved) { sel = d.roomId ? { type: 'room', id: d.roomId } : null; redraw(); } return; }
      if (d.kind === 'plant') {
        const p = Store.getPlant(d.id);
        if (d.moved) {
          const r0 = Plan.roomAt(p.pos.x, p.pos.y);
          if (!r0) { p.pos = { x: d.ox, y: d.oy }; UI.toast('Drop it inside a room', 'warn'); }
          else {
            const moved = p.roomId !== r0.id;
            Store.updatePlant(p.id, { roomId: r0.id, pos: { x: Math.round(p.pos.x * 4) / 4, y: Math.round(p.pos.y * 4) / 4 } });
            if (moved) UI.toast('Moved to ' + r0.name, 'leaf');
          }
        } else sel = { type: 'plant', id: p.id };
        redraw(); return;
      }
      if (d.kind === 'room') { if (!d.moved) sel = { type: 'room', id: d.id }; else saveShape(); redraw(); return; }
      if (d.kind === 'edge') { const r = room(sel.id); r.shape.win[d.i] = ((r.shape.win[d.i] || 0) + 1) % 3; saveShape(); redraw(); return; }
      if (d.kind === 'vertex') {
        const r = room(d.id), sh = r.shape, n = sh.pts.length;
        if (n > 3) {
          const p = sh.pts[d.i], prev = sh.pts[(d.i - 1 + n) % n], next = sh.pts[(d.i + 1) % n];
          if ((p.x === prev.x && p.y === prev.y) || (p.x === next.x && p.y === next.y)) { sh.pts.splice(d.i, 1); sh.win.splice(d.i, 1); UI.toast('Corner removed', 'leaf'); }
        }
        Plan.normalise(sh); saveShape(); redraw(); return;
      }
      if (d.kind === 'bd') { Store.save(); return; }
      if (d.kind === 'draw') {
        if (d.moved && d.rect && d.rect.w >= 1 && d.rect.h >= 1) { finishRoom(rect(d.rect.x, d.rect.y, d.rect.w, d.rect.h)); return; }
        if (!d.moved) {
          if (!drawing) drawing = { pts: [] };
          const p = { x: clamp(d.sx, 0, GW), y: clamp(d.sy, 0, GH) }, first = drawing.pts[0];
          if (first && drawing.pts.length >= 3 && Math.hypot(first.x - p.x, first.y - p.y) < 0.75) { finishRoom(drawing.pts); return; }
          if (!drawing.pts.some(function (q) { return q.x === p.x && q.y === p.y; })) drawing.pts.push(p);
        }
        redraw();
      }
    });
    canvas.addEventListener('pointercancel', function (e) { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; drag = null; redraw(); });

    /* ---- Tray: drag a plant onto the plan ---- */
    panel.addEventListener('pointerdown', function (e) {
      const el = e.target.closest('[data-plant-tray]'); if (!el) return;
      e.preventDefault();
      const id = el.getAttribute('data-plant-tray'), p = Store.getPlant(id); if (!p) return;
      ghostEl = document.createElement('div'); ghostEl.className = 'plan-ghost'; ghostEl.textContent = Store.displayName(p).charAt(0).toUpperCase();
      document.body.appendChild(ghostEl);
      function move(ev) { ghostEl.style.left = ev.clientX + 'px'; ghostEl.style.top = ev.clientY + 'px'; }
      move(e);
      function up(ev) {
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }
        const rc = canvas.getBoundingClientRect();
        if (ev.clientX < rc.left || ev.clientX > rc.right || ev.clientY < rc.top || ev.clientY > rc.bottom) return;
        const q = toPlan(ev), r0 = Plan.roomAt(q.x, q.y);
        if (!r0) { UI.toast(drawn().length ? 'Drop it inside a room' : 'Draw a room first', 'warn'); return; }
        Store.updatePlant(p.id, { roomId: r0.id, pos: { x: Math.round(q.x * 4) / 4, y: Math.round(q.y * 4) / 4 } });
        sel = { type: 'plant', id: p.id }; redraw();
      }
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });

    /* ---- Panel clicks ---- */
    panel.addEventListener('click', function (e) {
      const t = e.target;
      const tg = t.closest('[data-toggle]');
      if (tg) { const n = +tg.getAttribute('data-toggle'); ui.open[n] = !stepOpen(n); drawPanel(); return; }
      if (t.closest('#pl-tool-add')) { if (tool === 'add') { tool = 'select'; drawing = null; } else { tool = 'add'; drawing = { pts: [] }; mode = 'plan'; sel = null; } redraw(); return; }
      const dr = t.closest('[data-draw-room]');
      if (dr) { tool = 'add'; drawing = { pts: [], forRoomId: dr.getAttribute('data-draw-room') }; mode = 'plan'; sel = null; redraw(); UI.toast('Trace ' + room(dr.getAttribute('data-draw-room')).name + ' on the plan', 'leaf'); return; }
      if (t.closest('#pl-draw-finish')) { if (drawing && drawing.pts.length >= 3) finishRoom(drawing.pts); return; }
      if (t.closest('#pl-draw-undo')) { if (drawing) drawing.pts.pop(); redraw(); return; }
      if (t.closest('#pl-draw-cancel')) { drawing = null; tool = 'select'; redraw(); return; }
      if (t.closest('#pl-bd-load')) { pickBackdrop(); return; }
      if (t.closest('#pl-tool-bd')) { tool = tool === 'backdrop' ? 'select' : 'backdrop'; mode = 'plan'; redraw(); return; }
      if (t.closest('#pl-bd-remove')) { Store.updatePlan({ backdrop: null }); tool = 'select'; redraw(); UI.toast('Backdrop removed. Your rooms stay.', 'leaf'); return; }
      if (t.closest('#pl-open-compass') || t.closest('[data-open-compass]')) { openCompass(); return; }
      if (t.closest('#pl-back') || t.closest('#pl-done-sel')) { sel = null; redraw(); return; }
      if (t.closest('#pl-walls-help')) { wallsHelp(); return; }
      if (t.closest('#pl-room-more')) { const r = room(sel.id); if (r) ViewGreenhouse.roomSheet(r); return; }
      if (t.closest('#pl-room-delete')) {
        const r = room(sel.id); if (!r) return;
        UI.confirmSheet('Remove ' + r.name + '?', 'Its plants stay in your greenhouse, just not in a room any more.', 'Remove room', function () { Store.deleteRoom(r.id); sel = null; redraw(); UI.toast('Room removed', 'leaf'); }, true);
        return;
      }
      if (t.closest('#pl-open-plant')) { App.go('/plant/' + sel.id); return; }
      if (t.closest('#pl-unplace')) { Store.updatePlant(sel.id, { pos: null }); sel = null; redraw(); return; }
      const mv = t.closest('#pl-move-plant');
      if (mv) {
        const x = +mv.getAttribute('data-x'), y = +mv.getAttribute('data-y'), r0 = Plan.roomAt(x, y);
        Store.updatePlant(sel.id, { pos: { x: x, y: y }, roomId: r0 ? r0.id : Store.getPlant(sel.id).roomId });
        redraw(); UI.toast('Moved', 'leaf'); return;
      }
      const wall = t.closest('[data-wall]');
      if (wall) { const r = room(sel.id), i = +wall.getAttribute('data-wall'); r.shape.win[i] = ((r.shape.win[i] || 0) + 1) % 3; saveShape(); redraw(); return; }
      const sr = t.closest('[data-sel-room]'); if (sr) { sel = { type: 'room', id: sr.getAttribute('data-sel-room') }; redraw(); return; }
      const spl = t.closest('[data-sel-plant]'); if (spl) { sel = { type: 'plant', id: spl.getAttribute('data-sel-plant') }; redraw(); return; }
    });

    panel.addEventListener('input', function (e) {
      const t = e.target;
      if (t.id === 'pl-room-name') { const r = room(sel.id); r.name = t.value; Store.save(); drawCanvas(); return; }
      if (t.id === 'pl-bd-op') { plan().backdrop.opacity = +t.value; Store.save(); drawCanvas(); return; }
      if (t.id === 'pl-bd-sc') { plan().backdrop.scale = +t.value; Store.save(); drawCanvas(); return; }
    });

    panel.addEventListener('change', function (e) {
      const t = e.target;
      if (t.id === 'pl-done') {
        /* Ticking done drops the image: it has done its job, and it is the
           one thing here that costs real storage. */
        Store.updatePlan({ done: t.checked, backdrop: t.checked ? null : plan().backdrop });
        ui.open[1] = !t.checked; redraw(); return;
      }
      if (t.id === 'pl-room-outdoor') {
        const r = room(sel.id); r.shape.outdoor = t.checked;
        if (t.checked) r.shape.win = r.shape.win.map(function (v) { return v === WINDOW ? WALL : v; });
        saveShape(); redraw(); return;
      }
    });
  }

  /* Arrive with a room already selected — from its sheet or its page. */
  function focusRoom(id) { sel = { type: 'room', id: id }; mode = 'plan'; tool = 'select'; drawing = null; }

  return { title: title, sub: sub, back: true, render: render, mount: mount, stagger: false, focusRoom: focusRoom };
})();
