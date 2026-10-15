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
  /* A loaded floorplan starts this wide, whatever the grid measures. It was
     the grid's own width, so widening the grid would have stretched every
     backdrop already lined up under one. */
  const BD_W = 720;
  const A = 22, B = 11;               // isometric half-widths per cell
  const WALL = Plan.WALL, WINDOW = Plan.WINDOW, OPENING = Plan.OPENING;
  const GW = Plan.GW, GH = Plan.GH;
  /* The window onto the grid before anything is drawn, in cells, centred.
     Framing the whole grid instead would put the reader at the far end of a
     zoom-out with nowhere left to go. */
  const HOME_W = 20, HOME_H = 16;

  /* Editor state, kept across renders of this view but never saved. */
  let mode = 'plan';                  // 'plan' | 'home'
  let sel = null;                     // { type: 'room'|'plant', id }
  let tool = 'select';                // 'select' | 'add' | 'backdrop'
  let drawing = null;                 // { pts: [], forRoomId } while tracing corners
  let drag = null;
  let ghostEl = null;
  /* `step` is the step chosen on the dock, or null for "the first one not
     yet done". Kept for the visit; a fresh arrival starts from null. */
  const ui = { hideInner: false, full: false, step: null };
  const OPEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  /* A locked room keeps its shape, its place and its walls. It is stored on
     the room, so it outlives the visit, and it is honoured on the canvas
     whatever the panel looks like. */
  function isLocked(r) { return !!(r && r.locked); }
  const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const UNLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8"/></svg>';
  let lockToastAt = 0;
  function lockedNudge(r) {
    const t = Date.now(); if (t - lockToastAt < 2500) return; lockToastAt = t;
    UI.toast(r.name + ' is locked. Unlock to edit.', 'leaf');
  }
  let modesBound = false;
  /* Bound once for the life of the page rather than per mount: the view is
     rebuilt on every refresh, and a listener added there would stack up. */
  let escBound = false, resizeBound = false;
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
    if (!list.length) return homeBox();
    const all = []; list.forEach(function (r) { r.shape.pts.forEach(function (p) { all.push(p); }); });
    const b = Plan.bbox(all), pad = 2, minW = 12, minH = 9;
    let x0 = b.x0 - pad, y0 = b.y0 - pad, x1 = b.x1 + pad, y1 = b.y1 + pad;
    if (x1 - x0 < minW) { const m = (x0 + x1) / 2; x0 = m - minW / 2; x1 = m + minW / 2; }
    if (y1 - y0 < minH) { const m = (y0 + y1) / 2; y0 = m - minH / 2; y1 = m + minH / 2; }
    return { x: x0 * P, y: y0 * P, w: (x1 - x0) * P, h: (y1 - y0) * P };
  }
  function homeBox() {
    return { x: (GW - HOME_W) / 2 * P, y: (GH - HOME_H) / 2 * P, w: HOME_W * P, h: HOME_H * P };
  }
  function sameBox(a, b) { return !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h; }
  function centreView() { const v = curView(); v.k = 1; v.cx = 0; v.cy = 0; if (mode === 'plan') fitBox = fitOf(); }
  function viewChanged() {
    const v = curView();
    if (v.k !== 1 || v.cx !== 0 || v.cy !== 0) return true;
    /* No fitted frame yet means nothing has moved: mount() asks this before
       its first drawCanvas() has fitted one, and treating that as "moved"
       showed Centre on every arrival until the next redraw. */
    return mode === 'plan' && !!fitBox && !sameBox(fitBox, fitOf());
  }
  /* The box is grown to the stage's own shape before it is used, so
     xMidYMid meet has nothing left to letterbox. Without this a portrait
     stage fitted the box to its width and left empty bands top and bottom —
     which made full screen taller without showing any more grid, exactly
     the thing it was asked for. Growing rather than cropping: every cell
     the frame asked for is still in view, with more around it. */
  function applyView(x, y, w, h) {
    const rc = canvas.getBoundingClientRect();
    if (rc.width > 0 && rc.height > 0) {
      const want = rc.width / rc.height, have = w / h;
      if (have > want) { const h2 = w / want; y -= (h2 - h) / 2; h = h2; }
      else if (have < want) { const w2 = h * want; x -= (w2 - w) / 2; w = w2; }
    }
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
    /* Without north there is no telling a bright window from a dim one, but
       it is still a window: it wears the legend's gold, and a "?" on the
       plan says what it is waiting for, rather than a grey that matched
       nothing in the key. */
    const r = Plan.skyRank(e); if (r === null) return 'var(--gold)';
    return r >= 3 ? 'var(--gold)' : 'var(--plan-pane-dim)';
  }

  function drawPlan() {
    if (!fitBox) fitBox = fitOf();
    applyView(fitBox.x, fitBox.y, fitBox.w, fitBox.h);
    const pl = plan();
    let h = '';
    if (pl.backdrop && pl.backdrop.src) {
      const b = pl.backdrop;
      h += '<image href="' + UI.attr(b.src) + '" x="' + b.x + '" y="' + b.y + '" width="' + (BD_W * b.scale) + '" opacity="' + b.opacity + '" preserveAspectRatio="xMinYMin meet" style="pointer-events:none"></image>';
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
      const tiny = [lightLabel(rank), r.shape.outdoor ? 'outdoors' : '', isLocked(r) ? 'locked' : ''].filter(Boolean).join(' · ');
      h += '<text class="plan-tiny" x="' + cx + '" y="' + (cy + 11) + '" text-anchor="middle">' + UI.esc(tiny) + '</text>';
      /* The selected room's size lives on the plan, under its light, rather
         than in the panel restating what the plan already shows. */
      if (sel && sel.type === 'room' && sel.id === r.id) {
        const dm = roomDims(r);
        h += '<text class="plan-dims" x="' + cx + '" y="' + (cy + 24) + '" text-anchor="middle">' + UI.esc(fmtM(dm.w) + ' × ' + fmtM(dm.h)) + '</text>';
      }
    });

    if (!Plan.known()) drawn().forEach(function (r) {
      Plan.edges(r.shape).forEach(function (e) {
        if (e.kind !== WINDOW) return;
        /* A third of the way along and just inside, clear of the side's
           number outside and the add-a-corner dot at its middle. */
        const qx = (e.a.x + e.dx * 0.3 - e.nx * 0.6) * P, qy = (e.a.y + e.dy * 0.3 - e.ny * 0.6) * P;
        /* Drawn like the compass's "Set north" tag, since that is what it
           is waiting for: a gold hairline ring on the stage's own dark, a
           soft gold halo, and a serif question mark. */
        h += '<g data-win-help="1" class="plan-win-q" style="cursor:pointer">' +
          '<circle class="plan-win-q-halo" cx="' + qx + '" cy="' + qy + '" r="10.5"/>' +
          '<circle class="plan-win-q-ring" cx="' + qx + '" cy="' + qy + '" r="7.5"/>' +
          '<text class="plan-win-q-t" x="' + qx + '" y="' + (qy + 3.6) + '" text-anchor="middle">?</text></g>';
      });
    });

    const selRoom = sel && sel.type === 'room' ? room(sel.id) : null;
    if (selRoom && selRoom.shape && !isLocked(selRoom)) {
      Plan.edges(selRoom.shape).forEach(function (e) {
        const bx = (e.mid.x + e.nx * 0.7) * P, by = (e.mid.y + e.ny * 0.7) * P;
        const fill = e.kind === WINDOW ? 'var(--gold)' : e.kind === OPENING ? 'var(--emerald-glow)' : 'var(--bg-2)';
        h += '<g data-edge="' + e.i + '" style="cursor:pointer"><circle' + (wallTipOn() ? ' class="plan-edge-hint"' : '') + ' cx="' + bx + '" cy="' + by + '" r="9" style="fill:' + fill + ';stroke:var(--hair-3)"/><text class="plan-badge" x="' + bx + '" y="' + (by + 3) + '" text-anchor="middle" style="fill:' + (e.kind ? 'var(--bg-1)' : 'var(--ink)') + '">' + (e.i + 1) + '</text></g>';
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
    placeWallTip();
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
      /* No north yet, so the needle hunts for it: a gold needle swinging
         either side of the top, never settling, which is what a compass
         does before it has found anything. The swing is CSS, so reduced
         motion stills it and the gold alone still marks it as unset. */
      h += '<g class="plan-seek"><polygon points="0,' + (-r + 5) + ' 4,0 -4,0" style="fill:var(--gold)"/><polygon points="0,' + (r - 5) + ' 4,0 -4,0" style="fill:var(--ink-4)"/></g>' +
        '<circle r="2.2" style="fill:var(--gold-lit)"/>';
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
    if (!list.length) {
      const a = (GW - HOME_W) / 2, b = (GH - HOME_H) / 2;
      consider(a, b, 0); consider(a + HOME_W, b, 0); consider(a, b + HOME_H, 0); consider(a + HOME_W, b + HOME_H, 0);
    }
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
      const a = (GW - HOME_W) / 2, b2 = (GH - HOME_H) / 2;
      canvas.innerHTML = '<polygon points="' + pts([iso(a, b2, 0), iso(a + HOME_W, b2, 0), iso(a + HOME_W, b2 + HOME_H, 0), iso(a, b2 + HOME_H, 0)]) + '" style="fill:var(--plan-floor-x);stroke:var(--plan-wall-edge)"/>';
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

  /* The four steps used to fold, all of them under the plan at once, and
     with every one open the tray in step 4 sat a screen below the plan it
     is dragged onto. Now they are a dock on the stage and the panel shows
     one at a time, so whichever step is in hand sits right under the plan. */
  const STEP_TITLE = { 1: 'Load a floorplan', 2: 'Draw your rooms', 3: 'Which way is north?', 4: 'Add plants' };

  /* Whether each step is finished, read from the plan itself rather than
     stored, so a tick can never disagree with what is on the grid. */
  function stepDone(n) {
    const list = rooms(), plants = Store.activePlants();
    if (n === 1) return !!plan().done;
    if (n === 2) return list.length > 0 && !list.some(function (r) { return !r.shape; });
    if (n === 3) return Plan.known();
    return plants.length > 0 && plants.every(function (p) { return p.pos && Plan.roomAt(p.pos.x, p.pos.y); });
  }
  function firstOpenStep() { for (let n = 1; n <= 4; n++) if (!stepDone(n)) return n; return 4; }
  /* Drawing a room lives in step 2, whatever the dock says: the Finish and
     Undo buttons are there. */
  function curStep() { if (drawing) return 2; return ui.step || firstOpenStep(); }
  function goStep(n) { ui.step = Math.max(1, Math.min(4, n)); }

  function stepBody(n) {
    const pl = plan(), list = rooms(), undrawn = list.filter(function (r) { return !r.shape; });
    let h = '';
    if (n === 1) return stepOne();
    if (n === 2) {
      if (drawing) {
        h += '<p class="hint" style="margin:0 0 10px">Tap each corner in turn and tap the first again to close the room, or drag to draw a box.</p>' +
          '<div class="row"><button class="btn btn-sm" id="pl-draw-finish"' + (drawing.pts.length < 3 ? ' disabled' : '') + '>Finish room</button>' +
          '<button class="btn btn-ghost btn-sm" id="pl-draw-undo"' + (!drawing.pts.length ? ' disabled' : '') + '>Undo corner</button>' +
          '<button class="btn btn-ghost btn-sm" id="pl-draw-cancel">Cancel</button></div>';
      } else {
        if (pl.backdrop) {
          h += '<div class="plan-bd-done"><span>Finished tracing over the floorplan?</span><button class="btn btn-ghost btn-sm" id="pl-bd-finish">Remove the image</button></div>';
        }
        /* Step 2 has no button of its own. It had one, a hand's width from
           the stage's own Add a room, which was the same button twice; the
           stage's is the one lit instead, where the drawing happens. */
        h += '<p class="hint plan-step-lede">' + (mode !== 'plan' ? 'Switch to Plan to draw.' : 'Tap <b>' + (drawn().length ? 'Add a room' : 'trace one yourself') + '</b> on the plan, then drag for a box or tap corners for any shape.') + '</p>';
        if (list.length) {
          h += '<div class="stack" style="gap:6px;margin-top:10px">' + list.map(function (r) {
            if (r.shape) return '<button class="plan-row" data-sel-room="' + UI.attr(r.id) + '"><span class="plan-row-nm">' + UI.roomMark(r, 'mono-sm') + UI.esc(r.name) + (r.shape.outdoor ? ' <small>outdoors</small>' : '') + '</span>' + lightPill(Plan.roomRank(r)) + '</button>';
            return '<button class="plan-row is-undrawn" data-draw-room="' + UI.attr(r.id) + '"><span class="plan-row-nm">' + UI.roomMark(r, 'mono-sm') + UI.esc(r.name) + '</span>' + UI.pill('Draw it', 'grey', 'plus') + '</button>';
          }).join('') + '</div>';
          if (undrawn.length) h += '<p class="hint">' + (undrawn.length === 1 ? 'One room isn\'t' : undrawn.length + ' rooms aren\'t') + ' drawn yet: tap one to trace it and I\'ll read its light from the plan.</p>';
        } else {
          h += '<p class="hint">Nothing drawn yet. Rooms snap to the grid: tap one to name it and mark its windows, and set its real size with the ruler.</p>';
        }
      }
    } else if (n === 3) {
      const known = Plan.known();
      h += '<div class="row" style="justify-content:space-between">' +
          '<span class="row" style="gap:10px"><svg class="plan-mini-rose" viewBox="-30 -30 60 60" data-open-compass="1" aria-hidden="true">' + compassRose(0, 0, 22, 'var(--bg-4)') + '</svg>' +
            (known ? UI.pill('North set · ' + Math.round(pl.north) + '°', 'mint') : UI.pill(pl.northConfirmed ? 'Hemisphere needed' : 'Not set yet', 'sun')) + '</span>' +
          '<button class="btn btn-sm' + (known ? ' btn-ghost' : '') + '" id="pl-open-compass">' + (known ? 'Change' : 'Set north') + '</button></div>' +
        (known ? '' : '<p class="hint">I\'ll shade each room by its light once north and your hemisphere are set; the compass on the plan opens the same dial.</p>');
    } else {
      const plants = Store.activePlants();
      const loose = plants.filter(function (p) { return !(p.pos && Plan.roomAt(p.pos.x, p.pos.y)); });
      if (!plants.length) {
        /* A button rather than "add one in the greenhouse": the planner
           preview has no greenhouse to send anyone to, and in the app the
           walk there and back lost the step the reader was on. */
        /* With the light read, the plan has something to offer before it
           has a plant to place: species that would do well in the rooms
           just drawn. This is the reader with nothing yet, who drew a home
           first, and the plan is the reason the suggestion can be specific
           rather than a list of popular plants. App only: the planner
           preview has no species pages, so it keeps the plain line. */
        const picks = Plan.known() && window.ViewDiscover ? Schedule.roomMatches(4) : [];
        if (picks.length) {
          h += '<p class="hint plan-step-lede">Now I know the light in your rooms, these would do well here.</p>' +
            '<div class="stack" style="gap:6px;margin-top:10px">' + picks.map(function (x) {
              const rl = LOOKUPS.LIGHT[x.room.light];
              return '<button class="dx-opt" data-pl-species="' + UI.attr(x.sp.id) + '" style="margin:0">' +
                '<span class="dx-opt-thumb">' + UI.plantTile(Store.speciesPhoto(x.sp.id), x.sp.id, x.sp.common) + '</span>' +
                '<span style="min-width:0">' +
                  '<span class="dx-opt-t">' + UI.esc(x.sp.common) + '</span>' +
                  '<span class="dx-opt-d">Ideal for your ' + UI.esc(x.room.name) +
                    (rl ? ' (' + UI.esc(rl.label.toLowerCase()) + ')' : '') + '</span>' +
                '</span>' + UI.icon('chevron', 'muted') +
              '</button>';
            }).join('') + '</div>';
        } else {
          h += '<p class="hint">No plants yet. Add one and I\'ll show you where it should stand.</p>';
        }
      } else if (loose.length) {
        /* The instruction comes first: it is read before the chips it is
           about, and it sits nearer the plan they are dragged onto. */
        h += '<p class="hint plan-step-lede">Drag a plant into your home to see the best place for it.</p>';
        h += '<div class="plan-tray">' + loose.map(function (p) {
          const r0 = p.roomId ? Store.getRoom(p.roomId) : null;
          return '<div class="plan-sp" data-plant-tray="' + UI.attr(p.id) + '"><span class="plan-sp-mono">' + UI.esc(Store.displayName(p).charAt(0).toUpperCase()) + '</span><span class="plan-sp-nm">' + UI.esc(Store.displayName(p)) + (r0 ? '<small>' + UI.esc(r0.name) + '</small>' : '') + '</span></div>';
        }).join('') + '</div>';
      } else {
        h += '<p class="hint">Every plant is on the plan. Tap one to see how it is doing there.</p>';
      }
      h += '<button class="btn btn-sm btn-ghost" id="pl-add-plant" style="margin-top:12px">' + UI.icon('plus') +
        (plants.length ? 'Add another' : 'Add a plant') + '</button>';
    }
    return h;
  }

  /* Step 1: one choice, not a checkbox and four paragraphs. Without
     an image it is load one or skip; with one it is line it up and go and
     trace. Finishing with the image drops it, because that is the one
     thing here that costs real storage, so its button says "Remove the
     image": "Done" hid that the image goes. With an image loaded it is offered in step 2, where
     the tracing happens, rather than here before any room exists. */
  function stepOne() {
    const pl = plan();
    if (pl.backdrop) {
      return '<p class="hint plan-step-lede">Line the image up under the grid and trace each room over it; it stays on this device, and I\'ll remove it when you\'re done.</p>' +
        '<div class="grid-2"><label class="field" style="margin:0"><span class="label">Opacity</span><input class="input" id="pl-bd-op" type="range" min="0.1" max="1" step="0.05" value="' + pl.backdrop.opacity + '"></label>' +
        '<label class="field" style="margin:0"><span class="label">Size</span><input class="input" id="pl-bd-sc" type="range" min="0.3" max="2.5" step="0.02" value="' + pl.backdrop.scale + '"></label></div>' +
        '<div class="row plan-step-acts"><button class="btn btn-ghost btn-sm' + (tool === 'backdrop' ? ' is-on' : '') + '" id="pl-tool-bd">' + (tool === 'backdrop' ? 'Dragging the image' : 'Move the image') + '</button>' +
          '<button class="btn btn-ghost btn-sm" id="pl-bd-remove">Remove image</button></div>';
    }
    /* Two panels, no rule between them: what the step is on the left, the
       one thing to do about it on the right. */
    return '<div class="plan-step-pair">' +
        '<p class="hint">Trace over a picture of your floorplan, or skip this and draw your rooms freehand.</p>' +
        '<button class="btn btn-ghost btn-sm" id="pl-bd-load">' + UI.icon('upload') + 'Load a floorplan</button>' +
      '</div>';
  }

  /* One step at a time, chosen on the dock. A step that is not chosen
     costs no height under the stage. */
  function panelHome() {
    const n = curStep();
    panel.innerHTML = '<div class="section plan-sec plan-step-sec">' +
      '<div class="section-head"><h2 class="section-title"><span class="plan-step">Step ' + n + ' of 4</span>' + UI.esc(STEP_TITLE[n]) + '</h2>' +
        (stepDone(n) ? UI.pill('Done', 'mint') : '') + '</div>' +
      stepBody(n) +
      stepNav(n) +
    '</div>';
  }

  /* The same footer on every step, so moving between them is one habit:
     back on the left, on on the right, both as quiet text. Step 1's Next
     is also its skip: without an image, moving on is the decision that
     there will not be one, so it ticks the step as it goes. With an image
     it only moves, because tracing over it is what step 2 is for. */
  function stepNav(n) {
    if (drawing) return '';
    const prev = n > 1 ? n - 1 : null, next = n < 4 ? n + 1 : null;
    /* Step 1 has nothing behind it, so its left slot carries the
       walkthrough instead: the way back to the start of everything. Only
       once something is drawn; before that the plan's own invitation is
       offering it a hand's width above. */
    const tour = n === 1 && window.Tour && drawn().length;
    const chev = function (d) { return '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (d < 0 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5') + '"/></svg>'; };
    return '<nav class="plan-step-nav" aria-label="Steps">' +
      (prev ? '<button class="link-btn plan-step-prev" data-dock="' + prev + '">' + chev(-1) + '<span>Previous: ' + UI.esc(STEP_TITLE[prev]) + '</span></button>'
       : tour ? '<button class="link-btn plan-step-prev" data-tour="1"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5v9l7-4.5z"/></svg><span>Watch walkthrough again</span></button>' : '') +
      (next ? '<button class="link-btn plan-step-next" ' + (n === 1 ? 'id="pl-step1-next"' : 'data-dock="' + next + '"') + '><span>Next: ' + UI.esc(STEP_TITLE[next]) + '</span>' + chev(1) + '</button>' : '') +
    '</nav>';
  }

  function dockHtml() {
    const cur = sel ? null : curStep();
    let h = '';
    for (let n = 1; n <= 4; n++) {
      const done = stepDone(n), on = n === cur;
      h += '<button class="plan-dock-btn' + (done ? ' is-done' : '') + (on ? ' is-on' : '') + '" data-dock="' + n + '" aria-pressed="' + on + '" aria-label="Step ' + n + ', ' + UI.attr(STEP_TITLE[n]) + (done ? ', done' : '') + '">' +
        /* The chosen step keeps its number even when done, with the tick
           moved to a badge on its rim: a lit button with only a tick in it
           said "done" and hid "which step this is", the one thing a lit
           button is for. */
        (done && !on ? UI.icon('check') : '<span>' + n + '</span>' + (done ? '<i class="plan-dock-tick" aria-hidden="true">' + UI.icon('check') + '</i>' : '')) + '</button>';
    }
    return h;
  }

  const KIND_LABEL = ['Wall', 'Window', 'Opening'];
  const CHEV = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>';

  function roomDims(r) {
    const b = Plan.bbox(r.shape.pts), cell = plan().cell || 0.5;
    return { w: (b.x1 - b.x0) * cell, h: (b.y1 - b.y0) * cell, cw: b.x1 - b.x0, ch: b.y1 - b.y0 };
  }

  /* The heading row carries everything about the room itself: its name,
     the lock, and the sheet with icon, humidity and notes. The walls follow
     straight after. Its size and light are on the plan, so the panel does
     not say them again. Removing is a quiet link rather than a red button:
     it is rare and already asks first, so it need not be the loudest thing
     here. */
  function panelRoom(r) {
    const sh = r.shape, d = roomDims(r), sun = Plan.sunReach(r), pl = plan(), lk = isLocked(r);
    const here = plantsOnPlan().filter(function (p) { return Plan.roomAt(p.pos.x, p.pos.y) === r; });
    let h = '<div class="section plan-sec plan-room' + (lk ? ' is-locked' : '') + '">' +
      '<div class="plan-room-head">' +
        '<button class="plan-back" id="pl-back" aria-label="Back to the steps">' + CHEV + '</button>' +
        '<input class="plan-title-input" id="pl-room-name" value="' + UI.attr(r.name) + '" placeholder="Room name" aria-label="Room name" maxlength="40" autocomplete="off"' + (lk ? ' readonly' : '') + '>' +
        '<button class="plan-room-ico' + (lk ? ' is-on' : '') + '" id="pl-room-lock" aria-pressed="' + lk + '" aria-label="' + (lk ? 'Unlock this room' : 'Lock this room') + '">' + (lk ? LOCK_SVG : UNLOCK_SVG) + '</button>' +
        '<button class="plan-room-ico" id="pl-room-more" aria-label="Icon, humidity and notes">' + UI.icon('sliders') + '</button>' +
      '</div>';
    /* Right under the room's name, where the room's own actions are, and
       the full width of the panel: at the foot beside Done it read as an
       afterthought, and on the stage it was mistaken for Add a room. A
       locked room still takes plants, so the lock does not touch it. */
    h += '<button class="btn btn-sm btn-ghost btn-block plan-room-add" id="pl-quick-add">' + UI.icon('plus') + 'Add a plant</button>';
    if (lk) h += '<p class="plan-room-lockline">' + LOCK_SVG + '<span>Locked, so its shape, walls and name stay put. Tap the lock to change them.</span></p>';
    h += '<div class="plan-room-sub"><span class="label">Walls <button class="plan-help" id="pl-walls-help" aria-label="What do these mean?">?</button></span>' +
        '<label class="plan-check"><input type="checkbox" id="pl-room-outdoor"' + (sh.outdoor ? ' checked' : '') + (lk ? ' disabled' : '') + '> Outdoors</label></div>';
    /* What the four buttons are for, before the reader has to guess. Which
       way each one faces is step 3's business, so it is not raised here:
       asking for north mid-room only hurried people past the walls. */
    if (!lk) h += '<p class="hint plan-walls-lede">Tap each side to set it to a wall, a window, or an opening into the next room, like a hallway; the numbers match the plan.</p>';
    if (sh.outdoor) h += '<p class="hint" style="margin:0 0 10px">Open to the sky wherever nothing is built beyond.</p>';
    /* Each side is a three-way stepper, and says only what it is. The
       small print it used to carry repeated the plan (lengths), the label
       (a window called "window") or nothing useful ("nothing beyond"). */
    h += '<div class="grid-2">' + Plan.edges(sh).map(function (e) {
        const dis = lk ? ' disabled' : '', n = e.i + 1;
        return '<div class="chip plan-wall' + (e.kind === WINDOW ? ' is-on' : e.kind === OPENING ? ' is-open' : '') + (lk ? ' is-disabled' : '') + '" data-wall="' + e.i + '">' +
          '<button class="plan-wall-step" data-wall-step="-1" aria-label="Side ' + n + ': previous type"' + dis + '>' + CHEV + '</button>' +
          '<span class="plan-wall-t">' + n + ' · ' + KIND_LABEL[e.kind] + '</span>' +
          '<button class="plan-wall-step is-next" data-wall-step="1" aria-label="Side ' + n + ': next type"' + dis + '>' + CHEV + '</button>' +
        '</div>';
      }).join('') + '</div>';
    if (sun) h += '<p class="hint plan-room-sun">Midday sun reaches about ' + fmtM(Math.min(sun.winter, d.h)) + ' in midwinter, and ' + (sun.summer < 0.2 ? 'barely past the sill' : 'about ' + fmtM(sun.summer)) + ' in midsummer.</p>';
    h += '</div>';
    if (here.length) {
      h += '<div class="section plan-sec"><div class="section-head"><h2 class="section-title">In here</h2></div><div class="stack" style="gap:6px">' + here.map(function (p) {
        return '<button class="plan-row" data-sel-plant="' + UI.attr(p.id) + '"><span class="plan-row-nm">' + UI.esc(Store.displayName(p)) + '</span>' + verdictPill(Plan.verdict(Store.species(p), Plan.pointRank(r, p.pos.x, p.pos.y))) + '</button>';
      }).join('') + '</div></div>';
    }
    h += '<div class="plan-room-foot"><button class="btn btn-sm" id="pl-done-sel">Done</button>' +
      '<button class="link-btn plan-room-remove" id="pl-room-delete"' + (lk ? ' disabled' : '') + '>' + UI.icon('trash') + '<span>Remove room</span></button></div>';
    panel.innerHTML = h;
  }


  /* The plant panel. The name heads it, with a way out to the
     plant's own page beside it. Under that, the verdict, then three short
     facts laid out as a list rather than three sentences to read: the
     light here, the light it wants, and where that light comes from. A
     better spot, when there is one, is a single line with its button. */
  function panelPlant(p) {
    const sp = Store.species(p), r0 = Plan.roomAt(p.pos.x, p.pos.y);
    const rank = r0 ? Plan.pointRank(r0, p.pos.x, p.pos.y) : null, v = Plan.verdict(sp, rank);
    const name = Store.displayName(p), common = sp ? sp.common : '';
    const sub = [common && common !== name ? common : '', r0 ? 'in the ' + r0.name : 'not in a room'].filter(Boolean).join(' · ');
    let h = '<div class="section plan-sec plan-room plan-plant">' +
      '<div class="plan-room-head">' +
        '<button class="plan-back" id="pl-back" aria-label="Back to the steps">' + CHEV + '</button>' +
        '<div class="plan-plant-title"><div class="plan-plant-name">' + UI.esc(name) + '</div><div class="plan-plant-sub">' + UI.esc(sub) + '</div></div>' +
        '<button class="plan-room-ico" id="pl-open-plant" aria-label="Open ' + UI.attr(name) + '">' + OPEN_SVG + '</button>' +
      '</div>';
    const facts = [];
    facts.push(['Here', rank === null ? '<span class="plan-fact-quiet">Light unknown</span>' : lightPill(rank) + (v ? verdictPill(v) : '')]);
    if (sp && sp.light) {
      const tol = (sp.light.tolerates || []).map(function (k) { return LOOKUPS.LIGHT[k].label.toLowerCase(); });
      facts.push(['Wants', UI.esc(LOOKUPS.LIGHT[sp.light.ideal].label) + (tol.length ? '<span class="plan-fact-quiet"> · copes with ' + UI.esc(tol.join(' and ')) + '</span>' : '')]);
    }
    if (r0 && rank !== null) {
      let near = null, via = null;
      (Plan.sources(r0) || []).forEach(function (s) { const dd = Plan.distToEdge(s.e, p.pos.x, p.pos.y) * (plan().cell || 0.5); if (near === null || dd < near) { near = dd; via = s; } });
      if (via) facts.push(['Light from', fmtM(near) + ' away' + (via.borrowed ? '<span class="plan-fact-quiet"> · through the opening to the ' + UI.esc(via.borrowed.name) + '</span>' : '')]);
    }
    h += '<dl class="plan-facts">' + facts.map(function (f, i) { return '<div' + (i === 0 ? ' class="is-pills"' : '') + '><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('') + '</dl>';
    if (Plan.known()) h += '<p class="plan-legend"><span class="plan-swatch" style="background:' + HEAT.ideal + '"></span>perfect <span class="plan-swatch" style="background:' + HEAT.ok + '"></span>fine <span class="plan-legend-note">shaded on the plan</span></p>';
    if (v && v.verdict !== 'ideal' && Plan.known()) {
      const s = Plan.suggest(sp, p.pos);
      const sv = s ? Plan.verdict(sp, s.rank) : null;
      const better = s && sv && (sv.verdict === 'ideal' || (v.verdict !== 'ok' && sv.verdict === 'ok'));
      if (better) {
        const where = !s.edge ? '' : s.edge.kind === OPENING ? ', by the opening' : ', by the ' + LOOKUPS.ASPECT_NAMES[Plan.aspectOf(s.edge)].toLowerCase() + (s.room.shape.outdoor ? ' side' : ' window');
        h += '<div class="plan-better"><p><b>A better spot</b>' + (s.room === r0 ? 'Closer to the light in here' + UI.esc(where) + '.' : 'Happier in the ' + UI.esc(s.room.name) + UI.esc(where) + '.') + '</p>' +
          '<button class="btn btn-sm" id="pl-move-plant" data-x="' + s.spot.x + '" data-y="' + s.spot.y + '">Move it there</button></div>';
      } else if (v.verdict === 'bad' || v.verdict === 'poor') {
        /* Named from the species, since the light it wants is to hand. Bright
           indirect is the one rung whose label has no noun, so it gets one:
           "it wants bright indirect." stopped on an adjective. */
        const want = sp && sp.light && LOOKUPS.LIGHT[sp.light.ideal] ? LOOKUPS.LIGHT[sp.light.ideal].label.toLowerCase() : '';
        const wantText = !want ? '' : /(light|sun)$/.test(want) ? want : want + ' light';
        h += '<div class="plan-better"><p><b>No better spot yet</b>Nowhere on your plan has light it likes yet' +
          (wantText ? '; it wants ' + UI.esc(wantText) : '') + '.</p></div>';
      }
    }
    h += '<div class="plan-room-foot"><button class="btn btn-sm" id="pl-done-sel">Done</button>' +
      '<button class="link-btn plan-room-remove plan-unplace" id="pl-unplace"><span>Take off the plan</span></button></div></div>';
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
      '<p class="hint" style="margin:0 0 14px">Turn the dial until N points the way north is in your home, as you look at the plan; a compass app is the quickest way to check.</p>' +
      '<div class="row" style="gap:14px;flex-wrap:nowrap;align-items:center">' + compassDial() +
        '<div class="stack" style="flex:1"><div class="plan-reading" id="pl-north-reading">' + Math.round(pl.north || 0) + '°</div>' +
        '<p class="hint" style="margin:0">Drag the dial. It settles in five-degree steps.</p></div></div>' +
      (guess
        ? '<div style="margin-top:16px"><span class="label">Which side of the equator are you on?</span>' +
          '<p class="hint" style="margin:0 0 8px">It decides which way your bright windows face, so I need it before I can read them.</p>' +
          '<div class="row-wrap"><button class="chip" data-pl-hemi="north">Northern hemisphere</button><button class="chip" data-pl-hemi="south">Southern hemisphere</button></div></div>'
        /* A known hemisphere says nothing here. The sentence that used to
           sit here restated a setting made in Profile, under a dial already
           being read. Asking is still done in full when it is a guess. */
        : '') +
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
      if (ok) ok.addEventListener('click', function () {
        const was = curStep();
        Store.updatePlan({ northConfirmed: true }); UI.closeSheet(); UI.toast('North confirmed', 'leaf');
        /* Confirming north from step 3 finishes it, so the dock moves on, as
           ticking done with the floorplan does from step 1. */
        if (!sel && was === 3 && Plan.known()) goStep(4);
        redraw();
      });
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
    /* Moved only if it was standing somewhere: a plant with no place yet,
       or one just added, is being placed, and "Moved to" a room it was
       never out of read as a mistake. */
    const spot = bestSpotIn(r, Store.species(p)), moved = !!p.pos && p.roomId !== r.id;
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
      body += '<p class="hint">Tap one and I\'ll stand it where the light in this room suits it best, and you can drag it from there.</p>';
    }
    body += '<div class="row" style="gap:8px;margin-top:18px"><button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Close</button><button class="btn" data-act="pl-quick-new" style="flex:1">' + UI.icon('plus') + 'Add new plant</button></div>';
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
    if (!list.length) { UI.toast('Draw a room first', 'warn'); return; }
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
      '<p class="hint" style="margin:0 0 14px">Measure one room and I\'ll scale every other room on the grid from it.</p>' +
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

  /* What a window drawn before north is set is waiting for. It praises the
     window and points at the compass rather than asking for north here and
     now: north is step 3, and the reader can finish their walls first. */
  function windowHelp() {
    UI.openSheet('Window marked',
      '<p class="hint" style="margin:0 0 12px">How much light this window brings in depends on which way it faces, and I can\'t read that until I know where north is and which hemisphere you\'re in.</p>' +
      '<p class="hint" style="margin:0 0 16px">Carry on with your walls; north is step 3, set from the compass on the plan.</p>' +
      '<div class="row" style="gap:8px"><button class="btn btn-sm" id="pl-wq-north">Set north now</button>' +
        '<button class="btn btn-sm btn-ghost" id="pl-wq-later">Later</button></div>',
      function (el) {
        el.querySelector('#pl-wq-north').addEventListener('click', function () { openCompass(); });
        el.querySelector('#pl-wq-later').addEventListener('click', function () { UI.closeSheet(); });
      },
      nudgeCompass);
  }
  /* A short wave from the compass after the sheet closes, so the reader
     sees where it lives without being sent there. */
  function nudgeCompass() {
    const rose = root && root.querySelector('#pl-rose'); if (!rose) return;
    rose.classList.remove('is-nudge'); void rose.offsetWidth; rose.classList.add('is-nudge');
    setTimeout(function () { rose.classList.remove('is-nudge'); }, 2600);
  }

  function wallsHelp() {
    function row(mark, title, body) {
      return '<div class="row" style="align-items:flex-start;gap:12px;margin-bottom:14px;flex-wrap:nowrap"><span class="plan-mark" style="' + mark + '"></span><div style="min-width:0">' +
        '<div style="font-family:var(--serif);font-size:17px">' + title + '</div><p class="hint" style="margin:3px 0 0">' + body + '</p></div></div>';
    }
    UI.openSheet('Wall, window or opening?',
      row('background:var(--plan-wall-edge)', 'Wall', 'Solid, floor to ceiling. No light comes through. This is what every side starts as.') +
      row('background:var(--gold)', 'Window', 'Glass to the outside, a door with glass in it, or a skylight over this side. The light it gives depends on which way it faces, which is why north matters.') +
      row('background:none;border:1.5px dashed var(--emerald-glow)', 'Opening', 'A doorway or a missing wall to the next room. It borrows light from that room\'s own windows, one step dimmer, and never through a second doorway.') +
      '<p class="hint" style="margin:0">Tap a side\'s number on the plan, or its row in the panel, to cycle through the three.</p>');
  }

  /* ======================================================================
     Draw everything
     ====================================================================== */

  function drawCanvas() { if (mode === 'plan') drawPlan(); else drawHome(); }

  function syncOverlays() {
    const list = drawn();
    const n = root.querySelector('#pl-notice');
    /* The first instruction is drawn on the grid by the coach below, so the
       notice only speaks once a corner is down. */
    if (drawing && drawing.pts.length) { n.textContent = 'Tap the next corner. Tap the first one again to close the room.'; n.className = 'plan-notice'; n.hidden = false; }
    /* With the coach switched off, the one line under the grid is all the
       guidance left, and it is enough for someone who has done this before. */
    else if (drawing && Store.get().settings.dragCoachOff) { n.textContent = 'Drag out a room, or tap each corner.'; n.className = 'plan-notice'; n.hidden = false; }
    /* No sentence for an unset north: the compass asks for it itself. */
    else if (tool === 'backdrop') { n.textContent = 'Drag to move the floorplan under the grid.'; n.className = 'plan-notice'; n.hidden = false; }
    else n.hidden = true;
    /* Once read, it stays read. The tip explains a gesture, and a gesture
       learnt does not need explaining every time a room is selected. */
    const tip = root.querySelector('#pl-reshape');
    /* One tip at a time: the reshape tip waits until the walls one is read. */
    tip.hidden = !(mode === 'plan' && sel && sel.type === 'room') || !!Store.get().settings.reshapeTipDone || !Store.get().settings.wallTipDone || isLocked(sel && sel.type === 'room' ? room(sel.id) : null);
    const stage = root.querySelector('.plan-stage');
    const hints = root.querySelector('#pl-hints');
    if (ui.full) {
      /* Back in front of the stage buttons rather than after them: the rule
         that lifts a bottom button over the notice is a sibling selector. */
      if (n.parentNode !== stage) { stage.insertBefore(n, stage.querySelector('.plan-tools')); stage.insertBefore(tip, n.nextSibling); }
      hints.hidden = true;
    } else {
      if (n.parentNode !== hints) { hints.appendChild(n); hints.appendChild(tip); }
      hints.hidden = n.hidden && tip.hidden;
    }
    const inviting = !!(mode === 'plan' && !drawing && !list.length && window.Tour);
    root.querySelector('#pl-invite').hidden = !inviting;
    /* While the invitation is up, it is the whole screen: undo and redo,
       the compass, the ruler, full screen, the step dots and the step panel
       all wait until the reader has chosen to trace. Nine controls around
       an empty grid asked them to learn the planner before deciding to use
       it, and every one of them does nothing until a room exists. They
       come back the moment tracing starts, and go again if it is cancelled
       with nothing drawn. */
    root.querySelector('.plan-history').hidden = inviting;
    root.querySelector('.plan-tools').hidden = inviting;
    root.querySelector('#pl-dock').hidden = inviting;
    root.querySelector('#pl-panel').hidden = inviting;
    /* The line under the grid that used to carry this went unread: tracing
       starts on the grid, so that is where the eye already is. It goes at
       the first touch, and pointer-events: none lets that touch through. */
    const coaching = mode === 'plan' && drawing && !drawing.pts.length && !(drag && drag.kind === 'draw');
    const picking = coaching && !drawing.picked && !drawing.forRoomId && !list.length && !plan().backdrop;
    const unnamed = coaching && list.length && !drawing.nameChecked && !drawing.forRoomId && !Store.get().settings.nameNudgeOff ? unnamedRoom() : null;
    root.querySelector('#pl-coach').hidden = !coaching || (!picking && !unnamed && !!Store.get().settings.dragCoachOff);
    root.querySelector('#pl-coach-pick').hidden = !picking;
    root.querySelector('#pl-coach-name').hidden = !unnamed;
    root.querySelector('#pl-coach-drag').hidden = picking || !!unnamed;
    if (unnamed) {
      root.querySelector('#pl-coach-name-t').textContent = 'Name ' + unnamed.name + ' first?';
      root.querySelector('#pl-coach-name-s').textContent = 'Rename ' + unnamed.name + ' before you add another, so you can tell which plant lives where.';
    }
    const addRoom = root.querySelector('#pl-add-room');
    addRoom.hidden = !(mode === 'plan' && !drawing && !sel && list.length);
    /* On step 2 it is the step's one action, so it wears the primary green
       and breathes, the way the compass does while north is unset. */
    addRoom.classList.toggle('is-cta', curStep() === 2);
    const full = root.querySelector('#pl-full');
    full.innerHTML = UI.icon(ui.full ? 'shrink' : 'expand');
    full.setAttribute('aria-label', ui.full ? 'Leave full screen' : 'Fill the screen');
    full.classList.toggle('is-on', !!ui.full);
    root.querySelector('.plan-stage').classList.toggle('is-full', !!ui.full);
    /* Set from here rather than read with #view:has(.is-full), which some
       Android WebViews do not apply: the stage then stayed fixed to the
       animated view, under the header and hanging off the right edge. The
       class also lets the header and tab bar step aside entirely. */
    document.documentElement.classList.toggle('plan-full', !!ui.full);
    const wt = root.querySelector('#pl-walls-toggle');
    wt.hidden = mode !== 'home' || !list.length;
    wt.textContent = ui.hideInner ? 'Show inside walls' : 'Hide inside walls';
    wt.classList.toggle('is-on', !!ui.hideInner);
    root.querySelector('#pl-view-reset').hidden = !viewChanged();
    root.querySelector('#pl-tool-compass').innerHTML = compassRose(0, 0, 22, 'var(--bg-2)');
    const rose = root.querySelector('#pl-rose');
    if (rose) {
      const unset = !Plan.known();
      rose.classList.toggle('is-unset', unset);
      /* The tag only once a room is drawn: on an empty grid there is no
         light to read yet, and the invitation is the one thing to look at. */
      rose.classList.toggle('has-tag', unset && list.length > 0 && !drawing && curStep() === 3);
      rose.setAttribute('aria-label', unset ? 'Set north. Room light is off until it is set' : 'Which way is north?');
    }
    document.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-mode') === mode); });
    const dock = root.querySelector('#pl-dock');
    if (dock) dock.innerHTML = dockHtml();
    stage.classList.toggle('is-home', mode === 'home');
    placeWallTip();
  }

  /* ======================================================================
     Undo and redo
     ----------------------------------------------------------------------
     Snapshots of what the plan owns: every room (shape, name, windows, and
     the rest of the record, so a removed room comes back whole), where each
     plant stands, and the plan's own settings. Not the backdrop image: it
     is the one heavy thing here, and moving it is not worth a history.

     A snapshot is taken on every redraw and kept only if it differs from
     the last, so one gesture is one step however many saves it made on the
     way: a room dragged across the grid saves once and lands once, and a
     name typed letter by letter is one change by the time anything redraws.
     Kept for the visit, never saved.
     ====================================================================== */
  const hist = { past: [], future: [], applying: false };
  const HIST_MAX = 60;
  function snapOf() {
    const s = Store.get(), pl = Object.assign({}, s.plan); delete pl.backdrop;
    return JSON.stringify({
      rooms: s.rooms,
      plants: s.plants.map(function (p) { return [p.id, p.pos || null, p.roomId || null]; }),
      plan: pl
    });
  }
  function record() {
    if (hist.applying) return;
    const now = snapOf();
    if (hist.past[hist.past.length - 1] === now) return;
    hist.past.push(now); if (hist.past.length > HIST_MAX) hist.past.shift();
    if (hist.past.length > 1) hist.future = [];
  }
  function applySnap(json) {
    const d = JSON.parse(json), s = Store.get();
    s.rooms.splice.apply(s.rooms, [0, s.rooms.length].concat(d.rooms));
    const at = {}; d.plants.forEach(function (r) { at[r[0]] = r; });
    /* A plant made since the snapshot keeps living in the greenhouse; it
       only leaves the plan, which is all the plan can take back. */
    s.plants.forEach(function (p) { const r = at[p.id]; p.pos = r ? r[1] : null; if (r) p.roomId = r[2]; });
    const bd = s.plan.backdrop; Object.assign(s.plan, d.plan); s.plan.backdrop = bd;
    hist.applying = true;
    Store.save(); Plan.sync();
    if (sel && sel.type === 'room' && !room(sel.id)) sel = null;
    drawing = null; if (tool === 'add') tool = 'select';
    redraw();
    hist.applying = false;
  }
  function undo() {
    if (hist.past.length < 2) return;
    hist.future.push(hist.past.pop());
    applySnap(hist.past[hist.past.length - 1]);
  }
  function redo() {
    if (!hist.future.length) return;
    const next = hist.future.pop(); hist.past.push(next);
    applySnap(next);
  }
  const UNDO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';
  const REDO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>';

  function redraw() { if (!root || !document.body.contains(root)) return; Plan.sync(); drawPanel(); syncOverlays(); drawCanvas(); record(); syncHistory(); }
  function syncHistory() {
    const u = root && root.querySelector('#pl-undo'), r = root && root.querySelector('#pl-redo');
    if (u) u.disabled = hist.past.length < 2;
    if (r) r.disabled = !hist.future.length;
  }

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
          mode = 'plan'; tool = 'backdrop'; drawing = null; goStep(1); redraw();
          UI.toast('Line it up, then trace over it', 'leaf');
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

  /* Where both the invitation's quiet link and the walkthrough's last
     button land: Step 2 open, the add tool armed, nothing drawn for them. */
  /* The walls tip: shown on a selected, unlocked room until the reader has
     tapped a number (or a side's stepper) once. */
  function wallTipOn() {
    const r = sel && sel.type === 'room' ? room(sel.id) : null;
    return mode === 'plan' && !drawing && !!(r && r.shape) && !isLocked(r) && !Store.get().settings.wallTipDone;
  }
  function wallTipDone() { Store.updateSettings({ wallTipDone: true }); drawCanvas(); syncOverlays(); }
  /* Placed from the badge itself after each draw, so it follows the room
     through pans, zooms and reshapes: above side 1's number, or below it
     when that would leave the stage, and never past either side. */
  function placeWallTip() {
    const tip = root && root.querySelector('#pl-walltip'); if (!tip) return;
    const b = wallTipOn() && canvas.querySelector('[data-edge="0"] circle');
    if (!b) { tip.hidden = true; return; }
    const stage = root.querySelector('.plan-stage'), sr = stage.getBoundingClientRect(), br = b.getBoundingClientRect();
    tip.hidden = false;
    const w = tip.offsetWidth, hgt = tip.offsetHeight;
    const cx = br.left + br.width / 2 - sr.left;
    let top = br.top - sr.top - hgt - 12, below = false;
    if (top < 8) { top = br.bottom - sr.top + 12; below = true; }
    const left = Math.max(8, Math.min(sr.width - w - 8, cx - w / 2));
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
    tip.style.setProperty('--arrow-x', Math.max(14, Math.min(w - 14, cx - left)) + 'px');
    tip.classList.toggle('is-below', below);
  }

  /* The latest drawn room still wearing the name finishRoom() gave it. */
  function unnamedRoom() {
    const list = drawn().filter(function (r) { return /^Room \d+$/.test(r.name || ''); });
    return list.length ? list[list.length - 1] : null;
  }

  function startTracing() {
    tool = 'add'; drawing = { pts: [] }; mode = 'plan'; sel = null;
    redraw();
  }

  /* ======================================================================
     Rooms: create, reshape, edit
     ====================================================================== */

  function finishRoom(points) {
    if (Math.abs(Plan.area2(points)) < 1) { UI.toast('Too thin for a room', 'warn'); drawing = null; redraw(); return; }
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
    /* The room is selected but nothing takes focus. Putting the cursor in
       the name field the moment a shape closed threw a keyboard over the
       plan on every single room, which is the worst time to ask for a name:
       the reader is laying out a floor and is happy with Room 1 to Room 5
       until it looks right. The heading is a field whenever they want it. */
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

  function modeTabs() {
    return '<button class="tab-btn' + (mode === 'plan' ? ' is-on' : '') + '" data-mode="plan">Plan</button><button class="tab-btn' + (mode === 'home' ? ' is-on' : '') + '" data-mode="home">Home</button>';
  }
  /* Plan and Home are off the header for now: the Home view is not ready
     to be the second thing a new reader finds, and two tabs beside the
     title read as a choice to make before anything is drawn. The Home
     drawing and setMode() are kept, so putting modeTabs() back here is
     the whole of turning it on again. */
  function actions() { return ''; }
  function setMode(m) { mode = m; if (mode === 'home') { tool = 'select'; drawing = null; } redraw(); }

  function render() {
    return '<div class="plan">' +
      '<div class="plan-main">' +
        '<div class="plan-stage" id="pl-stage">' +
          '<svg id="pl-canvas" xmlns="http://www.w3.org/2000/svg"></svg>' +
          '<div class="plan-notice" id="pl-notice" hidden></div>' +
          '<div class="plan-overlay" id="pl-reshape" hidden><span>Drag a square corner to reshape the room. Drag the small dot on a wall to add a corner.</span>' +
            '<button class="plan-tip-x" data-tip-done="1" aria-label="Got it, hide this tip">' + UI.icon('x') + '</button></div>' +
          /* Pinned beside side 1's number on a freshly selected room, the
             one place a reader looking for "how do I add a window" is
             already looking. Gone for good at the first number tapped. */
          '<div class="plan-walltip" id="pl-walltip" hidden><span>Tap a number and I\'ll switch that side between wall, window and opening.</span>' +
            '<button class="plan-tip-x" data-walltip-done="1" aria-label="Got it, hide this tip">' + UI.icon('x') + '</button></div>' +
          '<div class="plan-history"><button class="plan-tool" id="pl-undo" aria-label="Undo" disabled>' + UNDO_SVG + '</button><button class="plan-tool" id="pl-redo" aria-label="Redo" disabled>' + REDO_SVG + '</button></div>' +
          '<div class="plan-tools">' +
            '<button class="plan-tool is-rose" id="pl-rose" data-open-compass="1" aria-label="Which way is north?"><svg id="pl-tool-compass" viewBox="-30 -30 60 60" aria-hidden="true"></svg>' +
              '<span class="plan-rose-tag" aria-hidden="true">Set north<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h8M7 3l3 3-3 3"/></svg></span>' +
            '</button>' +
            '<button class="plan-tool" data-open-dims="1" aria-label="Set the room sizes">' + UI.icon('ruler') + '</button>' +
            '<button class="plan-tool" id="pl-full" aria-label="Fill the screen"></button>' +
          '</div>' +
          /* The bottom-right corner belongs to the dock, so the Home
             view's walls switch takes the top-left, and Centre steps down
             beneath it when both are showing. */
          '<button class="plan-stage-btn is-left" id="pl-walls-toggle" hidden></button>' +
          '<div class="plan-dock" id="pl-dock" role="group" aria-label="Planner steps"></div>' +
          '<button class="plan-stage-btn is-left" id="pl-view-reset" hidden>Centre</button>' +
          /* The same corner as Add a plant, and never at the same time: one
             wants a room selected, the other wants nothing selected. An
             empty plan keeps its invitation instead, whose quiet link
             already offers exactly this. */
          '<button class="plan-stage-btn is-left is-bottom" id="pl-add-room" hidden>' + UI.icon('plus') + 'Add a room</button>' +
          /* Offered, not asked. An empty grid has nothing to interrupt, so
             the invitation lives on it rather than in a dialog over it, and
             it goes the moment a first room exists. */
          /* The home-planner scene sits above the title because this is the
             one moment the plan talks to the reader before there is anything
             to measure: a conversation, so the face is allowed, and gone
             with the rest of the invitation once a room exists. */
          /* Two faces in one card. A first trace with no picture under the
             grid asks first whether there is a floorplan to trace over,
             since that gets the shapes right; then, or straight away when
             there is one, the drag itself. */
          '<div class="plan-coach" id="pl-coach" hidden>' +
            '<div class="plan-coach-pick" id="pl-coach-pick">' +
              '<span class="plan-coach-ico" aria-hidden="true">' + UI.icon('upload') + '</span>' +
              '<div class="plan-coach-t">Got a floorplan?</div>' +
              '<p class="plan-coach-s">Load a picture of it to trace over, which gets the shapes right, or draw your rooms freehand.</p>' +
              '<div class="plan-coach-acts">' +
                '<button class="btn btn-sm" id="pl-coach-load">' + UI.icon('upload') + 'Load a floorplan</button>' +
                '<button class="btn btn-sm btn-ghost" id="pl-coach-self">Draw freehand</button>' +
              '</div>' +
            '</div>' +
            /* Asked only on the way to a second room, never as the first
               one closes: a name is easiest to give once there are two
               rooms to tell apart, and asking sooner threw a keyboard over
               the plan at the worst moment. */
            '<div class="plan-coach-pick" id="pl-coach-name">' +
              '<span class="plan-coach-ico" aria-hidden="true">' + UI.icon('edit') + '</span>' +
              '<div class="plan-coach-t" id="pl-coach-name-t"></div>' +
              '<p class="plan-coach-s" id="pl-coach-name-s"></p>' +
              '<div class="plan-coach-acts">' +
                '<button class="btn btn-sm" id="pl-coach-name-go">' + UI.icon('edit') + 'Name it</button>' +
                '<button class="btn btn-sm btn-ghost" id="pl-coach-name-skip">Add a room anyway</button>' +
              '</div>' +
              '<button class="plan-coach-off" id="pl-coach-name-off">Don\'t show this again</button>' +
            '</div>' +
            '<div class="plan-coach-drag" id="pl-coach-drag">' +
              '<div class="plan-coach-demo" aria-hidden="true"><span class="plan-coach-box"></span><span class="plan-coach-dot"></span></div>' +
              '<div class="plan-coach-t">Drag out a room</div>' +
              '<p class="plan-coach-s">Or tap each corner, and I\'ll join them up.</p>' +
              '<button class="plan-coach-off" id="pl-coach-off">Don\'t show this again</button>' +
            '</div>' +
          '</div>' +
          '<div class="plan-invite" id="pl-invite" hidden>' +
            UI.sprout('home-planner', 'is-small plan-invite-sprout') +
            '<div class="plan-invite-t">Nothing drawn yet</div>' +
            '<p class="hint">I\'ll build a sample home and name each part as it appears, if it helps to see one first.</p>' +
            '<div class="stack" style="gap:9px;align-items:center">' +
              '<button class="btn btn-sm" data-tour="1">' + UI.icon('sparkle') + 'Watch me build one</button>' +
              '<button class="link-btn" id="pl-trace">or trace one yourself</button>' +
              /* Only where Settings is loaded, which is the app: the planner
                 preview is where these files come from, not where they go. */
              (window.ViewSettings ? '<button class="link-btn" id="pl-import">or import one you drew on the web</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        /* Where the notice and the reshape tip live when the stage is in the
           page. Both used to sit on the grid's bottom edge, stacked with Add a
           plant, and together they covered the lower third of it: exactly
           where a second room would go (PrimeTestLab 7959, S-02). Under the
           grid they cover nothing. Full screen has no "under", so there
           syncOverlays() hands them back to the stage. */
        '<div class="plan-hints" id="pl-hints" hidden></div>' +
      '</div>' +
      '<div class="plan-panel" id="pl-panel"></div>' +
    '</div>';
  }

  function mount(el, params) {
    root = el;
    /* Arriving is a fresh start; a refresh is not. Arriving puts the dock
       back on the first step not yet done and starts a new undo history,
       so an undo can never reach back into a change made on another screen
       before this visit. A refresh (a sheet saved over the plan) keeps both.
       The selection is left alone either way: focusRoom() sets it before
       the arrival it is for. */
    if (!(params && params.refresh)) { ui.step = null; ui.full = false; drawing = null; tool = 'select'; hist.past = []; hist.future = []; }
    if (!escBound) {
      escBound = true;
      /* Leaving the plan while it fills the screen (the phone's own back
         gesture) must not leave the header and tab bar hidden on the next
         page. Checked once the router has swapped the view in. */
      window.addEventListener('hashchange', function () {
        setTimeout(function () {
          if (!root || !document.body.contains(root)) { ui.full = false; document.documentElement.classList.remove('plan-full'); }
        }, 0);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && ui.full) { ui.full = false; redraw(); }
        /* Undo and redo from the keyboard too, but never out of a text
           field, where the browser's own undo is the one wanted. */
        if (!root || !document.body.contains(root) || UI.sheetIsOpen()) return;
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); }
      });
    }
    /* The header lives outside the view, and outlives it, so its listener is
       bound once for the page like the Escape key above. */
    if (!modesBound) {
      modesBound = true;
      document.addEventListener('click', function (e) {
        const m = e.target.closest('.topbar [data-mode]');
        if (m && root && document.body.contains(root)) setMode(m.getAttribute('data-mode'));
      });
    }
    canvas = root.querySelector('#pl-canvas'); panel = root.querySelector('#pl-panel');
    drag = null; pinch = null; pointers.clear();
    views.plan.k = 1; views.plan.cx = 0; views.plan.cy = 0; fitBox = null;
    drawPanel(); syncOverlays(); drawCanvas(); record(); syncHistory();
    /* Once more when the layout has settled. The stage takes its height
       from the viewport, and the first measurement can land before that is
       final, which leaves the drawing fitted to a box a few pixels off. */
    setTimeout(function () { if (root && document.body.contains(root)) drawCanvas(); }, 0);
    if (!resizeBound) {
      resizeBound = true;
      window.addEventListener('resize', function () { if (root && document.body.contains(root)) drawCanvas(); });
    }

    root.addEventListener('click', function (e) {
      const m = e.target.closest('[data-mode]');
      if (m) { setMode(m.getAttribute('data-mode')); return; }
      const dk = e.target.closest('[data-dock]');
      if (dk) { pickStep(+dk.getAttribute('data-dock')); return; }
      if (e.target.closest('#pl-walls-toggle')) { ui.hideInner = !ui.hideInner; drawCanvas(); syncOverlays(); return; }
      if (e.target.closest('#pl-view-reset')) { centreView(); drawCanvas(); syncOverlays(); return; }
      if (e.target.closest('.plan-tools [data-open-compass]')) { openCompass(); return; }
      if (e.target.closest('[data-open-dims]')) { openDims(sel && sel.type === 'room' ? sel.id : null); return; }
      if (e.target.closest('#pl-add-plant')) { ViewGreenhouse.addPlantSheet(null); return; }
      const plSp = e.target.closest('[data-pl-species]');
      if (plSp) { App.go('/species/' + plSp.getAttribute('data-pl-species')); return; }
      if (e.target.closest('#pl-import')) { ViewSettings.importPlan(); return; }
      if (e.target.closest('#pl-quick-add')) { if (sel && sel.type === 'room') quickAdd(room(sel.id)); return; }
      if (e.target.closest('[data-tip-done]')) { Store.updateSettings({ reshapeTipDone: true }); syncOverlays(); return; }
      if (e.target.closest('[data-walltip-done]')) { wallTipDone(); return; }
      if (e.target.closest('[data-tour]')) { Tour.open(startTracing); return; }
      if (e.target.closest('#pl-add-room')) { startTracing(); return; }
      if (e.target.closest('#pl-undo')) { undo(); return; }
      if (e.target.closest('#pl-redo')) { redo(); return; }
      /* Not the Fullscreen API: iOS Safari grants it to video alone, so the
         one device where this is most wanted is the one where it would do
         nothing. A fixed, inset stage does the same job everywhere, and
         because the stage lives inside the view it is torn down on
         navigation with nothing left to clean up. */
      if (e.target.closest('#pl-full')) { ui.full = !ui.full; syncOverlays(); drawCanvas(); return; }
      if (e.target.closest('#pl-trace')) { startTracing(); return; }
      if (e.target.closest('#pl-coach-load')) { pickBackdrop(); return; }
      if (e.target.closest('#pl-coach-self')) { if (drawing) drawing.picked = true; syncOverlays(); return; }
      if (e.target.closest('#pl-coach-off')) { Store.updateSettings({ dragCoachOff: true }); syncOverlays(); return; }
      /* Naming goes through the room's own form, with the name field ready.
         The trace stays open underneath, so saving lands straight on the
         drag card for the next room. */
      if (e.target.closest('#pl-coach-name-go')) {
        const r = unnamedRoom(); if (drawing) drawing.nameChecked = true; syncOverlays();
        if (r) {
          ViewGreenhouse.roomSheet(r);
          setTimeout(function () { const f = document.getElementById('r-name'); if (f) { f.focus(); f.select(); } }, 320);
        }
        return;
      }
      if (e.target.closest('#pl-coach-name-skip')) { if (drawing) drawing.nameChecked = true; syncOverlays(); return; }
      if (e.target.closest('#pl-coach-name-off')) { Store.updateSettings({ nameNudgeOff: true }); if (drawing) drawing.nameChecked = true; syncOverlays(); return; }
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
      if (t.closest('[data-win-help]')) { drag = { kind: 'winhelp' }; return; }
      const pl = t.closest('[data-plant]');
      if (pl) { const p = Store.getPlant(pl.getAttribute('data-plant')); drag = { kind: 'plant', id: p.id, ox: p.pos.x, oy: p.pos.y, sx: start.x, sy: start.y, moved: false }; return; }
      if (mode !== 'plan') { const rb = t.closest('[data-room-body]'); drag = { kind: 'pan', px: e.clientX, py: e.clientY, moved: false, roomId: rb ? rb.getAttribute('data-room-body') : null }; return; }
      const badge = t.closest('[data-edge]'); if (badge) { if (wallTipOn()) Store.updateSettings({ wallTipDone: true }); drag = { kind: 'edge', i: +badge.getAttribute('data-edge') }; return; }
      const vx = t.closest('[data-vertex]'); if (vx) { drag = { kind: 'vertex', id: sel.id, i: +vx.getAttribute('data-vertex') }; return; }
      const mp = t.closest('[data-midpoint]');
      if (mp) {
        const r = room(sel.id), i = +mp.getAttribute('data-midpoint'), ed = Plan.edges(r.shape)[i];
        r.shape.pts.splice(i + 1, 0, { x: snap(ed.mid.x), y: snap(ed.mid.y) }); r.shape.win.splice(i + 1, 0, r.shape.win[i]);
        drag = { kind: 'vertex', id: r.id, i: i + 1 }; drawCanvas(); return;
      }
      if (tool === 'backdrop' && plan().backdrop) { const s = svgPoint(e); drag = { kind: 'bd', sx: s.x, sy: s.y, ox: plan().backdrop.x, oy: plan().backdrop.y }; return; }
      const rb = t.closest('[data-room-body]');
      if (tool === 'add' && !(rb && !drawing)) { drag = { kind: 'draw', sx: snap(start.x), sy: snap(start.y), rect: null, moved: false }; root.querySelector('#pl-coach').hidden = true; return; }
      if (rb && isLocked(room(rb.getAttribute('data-room-body')))) { drag = { kind: 'pan', px: e.clientX, py: e.clientY, moved: false, roomId: rb.getAttribute('data-room-body') }; return; }
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
      if (d.kind === 'winhelp') { windowHelp(); return; }
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
      const dr = t.closest('[data-draw-room]');
      if (dr) { tool = 'add'; drawing = { pts: [], forRoomId: dr.getAttribute('data-draw-room') }; mode = 'plan'; sel = null; redraw(); UI.toast('Trace ' + room(dr.getAttribute('data-draw-room')).name + ' on the plan', 'leaf'); return; }
      if (t.closest('#pl-draw-finish')) { if (drawing && drawing.pts.length >= 3) finishRoom(drawing.pts); return; }
      if (t.closest('#pl-draw-undo')) { if (drawing) drawing.pts.pop(); redraw(); return; }
      if (t.closest('#pl-draw-cancel')) { drawing = null; tool = 'select'; redraw(); return; }
      if (t.closest('#pl-bd-load')) { pickBackdrop(); return; }
      if (t.closest('#pl-step1-next')) { if (!plan().backdrop && !plan().done) Store.updatePlan({ done: true }); pickStep(2); return; }
      if (t.closest('#pl-bd-finish')) { Store.updatePlan({ done: true, backdrop: null }); tool = 'select'; redraw(); UI.toast('Image removed. Your rooms stay.', 'leaf'); return; }
      if (t.closest('#pl-tool-bd')) { tool = tool === 'backdrop' ? 'select' : 'backdrop'; mode = 'plan'; redraw(); return; }
      if (t.closest('#pl-bd-remove')) { Store.updatePlan({ backdrop: null }); tool = 'select'; redraw(); UI.toast('Image removed. Your rooms stay.', 'leaf'); return; }
      if (t.closest('#pl-open-compass') || t.closest('[data-open-compass]')) { openCompass(); return; }
      if (t.closest('#pl-back') || t.closest('#pl-done-sel')) { sel = null; redraw(); return; }
      if (t.closest('#pl-walls-help')) { wallsHelp(); return; }
      if (t.closest('#pl-room-more')) { const r = room(sel.id); if (r) ViewGreenhouse.roomSheet(r); return; }
      if (t.closest('#pl-room-delete')) {
        const r = room(sel.id); if (!r) return;
        if (isLocked(r)) { lockedNudge(r); return; }
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
      if (t.closest('#pl-room-lock')) {
        const r = room(sel.id); if (!r) return;
        r.locked = !r.locked; Store.save(); redraw();
        UI.toast(r.locked ? r.name + ' is locked' : r.name + ' is unlocked', 'leaf');
        return;
      }
      const wall = t.closest('[data-wall]');
      if (wall && isLocked(room(sel.id))) { lockedNudge(room(sel.id)); return; }
      if (wall) {
        /* The left chevron steps back; the right one, or anywhere else on
           the card, steps on, so a plain tap still cycles as it always has. */
        const r = room(sel.id), i = +wall.getAttribute('data-wall'), st = t.closest('[data-wall-step]');
        const by = st && st.getAttribute('data-wall-step') === '-1' ? 2 : 1;
        if (!Store.get().settings.wallTipDone) Store.updateSettings({ wallTipDone: true });
        r.shape.win[i] = ((r.shape.win[i] || 0) + by) % 3; saveShape(); redraw(); return;
      }
      const sr = t.closest('[data-sel-room]'); if (sr) { sel = { type: 'room', id: sr.getAttribute('data-sel-room') }; redraw(); return; }
      const spl = t.closest('[data-sel-plant]'); if (spl) { sel = { type: 'plant', id: spl.getAttribute('data-sel-plant') }; redraw(); return; }
    });

    panel.addEventListener('input', function (e) {
      const t = e.target;
      /* Saved as typed, so the label on the plan follows the keyboard, but
         never saved empty. It used to be, and a room cleared here stayed
         nameless: a blank card in the greenhouse and a blank choice in every
         room picker (PrimeTestLab 8220, M-01). An empty field now leaves the
         last real name in the store, and the change handler below puts it
         back in the field when the reader leaves it. */
      if (t.id === 'pl-room-name') {
        const r = room(sel.id), v = t.value.trim();
        if (v) { r.name = v; Store.save(); drawCanvas(); }
        return;
      }
      if (t.id === 'pl-bd-op') { plan().backdrop.opacity = +t.value; Store.save(); drawCanvas(); return; }
      if (t.id === 'pl-bd-sc') { plan().backdrop.scale = +t.value; Store.save(); drawCanvas(); return; }
    });

    panel.addEventListener('change', function (e) {
      const t = e.target;
      if (t.id === 'pl-room-name') {
        const r = room(sel.id);
        if (!t.value.trim()) { t.value = r.name; UI.toast('Kept the name ' + r.name, 'leaf'); }
        else t.value = r.name;
        return;
      }
      if (t.id === 'pl-room-outdoor') {
        const r = room(sel.id); r.shape.outdoor = t.checked;
        if (t.checked) r.shape.win = r.shape.win.map(function (v) { return v === WINDOW ? WALL : v; });
        saveShape(); redraw(); return;
      }
    });
  }

  /* A dock tap is a way back to the steps, so it lets go of any room or
     plant, and of full screen, where there is no panel to show the step. */
  function pickStep(n) {
    if (drawing && n !== 2) { drawing = null; tool = 'select'; }
    sel = null; goStep(n);
    if (ui.full) ui.full = false;
    redraw();
    if (window.matchMedia('(max-width: 899px)').matches) {
      const pr = panel.getBoundingClientRect();
      if (pr.top > window.innerHeight - 120) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* Stand a plant at its best spot in a room and select it, so the floor
     shades for it straight away. The planner preview calls this once a
     plant it has just added exists; placeIn() alone leaves nothing
     selected, and the shading is the point of adding one there. */
  function place(plantId, roomId) {
    const p = Store.getPlant(plantId), r = room(roomId);
    if (!p || !r || !r.shape) return;
    sel = { type: 'plant', id: p.id }; mode = 'plan'; tool = 'select'; drawing = null;
    placeIn(p, r);
  }

  /* Arrive with a room already selected — from its sheet or its page. */
  function focusRoom(id) { sel = { type: 'room', id: id }; mode = 'plan'; tool = 'select'; drawing = null; }

  /* Whether this visit has changed the plan, for the rating screen's
     "leaving a plan you have just drawn" moment. The first snapshot is the
     plan as it was on arrival, so a second means something moved; undoing
     back to the start counts as no change. */
  function edited() { return hist.past.length > 1; }

  return { title: title, sub: sub, actions: actions, back: true, render: render, mount: mount, stagger: false, focusRoom: focusRoom, place: place, edited: edited };
})();
