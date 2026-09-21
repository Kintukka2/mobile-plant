/* ==========================================================================
   Sprout — the plan walkthrough
   --------------------------------------------------------------------------
   The planner asks for a traced home before it can say anything useful, and
   four folded steps over an empty grid do not explain how to produce one.
   This builds a sample flat in front of the reader and names each part as it
   appears, in the order they would meet it.

   It runs on its own canvas, not the real one. Nothing here touches the
   store: the sample flat lives in this file's own state and goes away with
   the overlay, so a reader who has already drawn something loses nothing by
   watching, and a tour abandoned half way leaves no rooms behind.

   It is offered, never forced. ViewPlan shows the invitation only while
   nothing is drawn, and the last beat hands over by arming the add tool.
   ========================================================================== */

window.Tour = (function () {
  'use strict';

  const P = 24;                       // px per grid cell, matching ViewPlan
  const WALL = 0, WINDOW = 1, OPENING = 2;

  /* The sample flat, in grid cells of half a metre. Rooms that share a wall
     share an edge exactly, because the borrowed-light beat needs a real
     shared edge to borrow across. */
  const FLAT = [
    { id: 'living',  name: 'Living room', pts: [[8, 6], [18, 6], [18, 14], [8, 14]],   light: 3 },
    { id: 'bedroom', name: 'Bedroom',     pts: [[18, 6], [26, 6], [26, 13], [18, 13]], light: 2 },
    { id: 'kitchen', name: 'Kitchen',     pts: [[8, 14], [15, 14], [15, 20], [8, 20]], light: 1 },
    { id: 'hall',    name: 'Hallway',     pts: [[15, 14], [18, 14], [18, 20], [15, 20]], light: 0 },
    { id: 'balcony', name: 'Balcony',     pts: [[18, 13], [26, 13], [26, 17], [18, 17]], light: 4 }
  ];

  const RANK_KEY = ['none', 'low', 'medium', 'bright-indirect', 'direct'];
  const HEAT = { ideal: 'rgba(63,190,139,0.42)', ok: 'rgba(200,169,107,0.30)', poor: 'rgba(208,138,98,0.12)', bad: 'rgba(208,138,98,0.06)' };
  const RING = { ideal: 'var(--emerald-glow)', ok: 'var(--gold)', poor: 'var(--terra)', bad: 'var(--terra)' };

  /* The demo plant is a Monstera: bright indirect ideal, medium tolerated.
     One table, so the heatmap and the verdict can never disagree. */
  function verdictOf(rank) {
    if (rank === 3) return 'ideal';
    if (rank === 2) return 'ok';
    if (rank === 4) return 'poor';
    return 'bad';
  }
  function verdictWord(v) {
    return v === 'ideal' ? 'Perfect spot' : v === 'ok' ? 'It will cope' : 'Wrong light';
  }
  function lightLabel(rank) { return LOOKUPS.LIGHT[RANK_KEY[rank]].label; }
  function metres(cells) {
    const v = Math.round(cells * 0.5 * 10) / 10;
    return (v % 1 === 0 ? v : v.toFixed(1)) + ' m';
  }

  /* ======================================================================
     State — the canvas is a pure function of this
     ====================================================================== */

  let st = null;
  function reset() {
    st = { grid: 0, rooms: [], trace: null, names: {}, scale: 0, shade: 0,
           north: 0, northSet: false, hot: null, plant: null, heat: 0, verdict: null };
  }
  function room(id) {
    for (let i = 0; i < st.rooms.length; i++) if (st.rooms[i].id === id) return st.rooms[i];
    return null;
  }
  function add(id, grow) {
    let src = null;
    FLAT.forEach(function (f) { if (f.id === id) src = f; });
    let r = room(id);
    if (!r) {
      r = { id: src.id, name: src.name, pts: src.pts, light: src.light,
            win: [WALL, WALL, WALL, WALL], outdoor: false, grow: 0 };
      st.rooms.push(r);
    }
    r.grow = grow === undefined ? 1 : grow;
    return r;
  }

  /* ======================================================================
     Geometry
     ====================================================================== */

  function centroid(pts) {
    let x = 0, y = 0;
    pts.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }
  function grown(pts, k) {
    if (k >= 1) return pts;
    const c = centroid(pts);
    return pts.map(function (p) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; });
  }
  function poly(pts) { return pts.map(function (p) { return (p[0] * P) + ',' + (p[1] * P); }).join(' '); }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  /* ======================================================================
     Drawing — the planner's own tokens, so both themes come free
     ====================================================================== */

  function drawGrid() {
    if (st.grid <= 0) return '';
    let h = '<g opacity="' + st.grid.toFixed(3) + '">';
    for (let x = 4; x <= 32; x++) {
      h += '<line x1="' + (x * P) + '" y1="' + (2 * P) + '" x2="' + (x * P) + '" y2="' + (24 * P) +
           '" stroke="var(' + (x % 2 ? '--plan-grid' : '--plan-grid-2') + ')"/>';
    }
    for (let y = 2; y <= 24; y++) {
      h += '<line x1="' + (4 * P) + '" y1="' + (y * P) + '" x2="' + (32 * P) + '" y2="' + (y * P) +
           '" stroke="var(' + (y % 2 ? '--plan-grid' : '--plan-grid-2') + ')"/>';
    }
    return h + '</g>';
  }

  function drawRoom(r) {
    if (r.grow <= 0) return '';
    const pts = grown(r.pts, r.grow);
    const fill = st.shade > 0 ? 'var(--plan-floor-' + r.light + ')' : 'var(--plan-floor-x)';
    let h = '<g opacity="' + Math.min(1, r.grow * 1.4).toFixed(3) + '">';
    h += '<polygon points="' + poly(pts) + '" style="fill:' + fill +
         ';stroke:var(--plan-wall-edge);stroke-width:2;stroke-linejoin:round' +
         (r.outdoor ? ';stroke-dasharray:6 4' : '') + '"/>';

    /* Windows and openings are drawn along the wall itself, inset at both
       ends, exactly as the real plan draws them. */
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const kind = r.win[i];
      const lit = kind === WINDOW || kind === OPENING || r.outdoor;
      const hot = st.hot && st.hot.id === r.id && st.hot.edge === i;
      if (hot) {
        h += '<line x1="' + (a[0] * P) + '" y1="' + (a[1] * P) + '" x2="' + (b[0] * P) + '" y2="' + (b[1] * P) +
             '" stroke="var(--emerald-glow)" stroke-width="9" stroke-linecap="round" opacity="0.26"/>';
      }
      if (!lit) continue;
      const t0 = 0.12, t1 = 0.88;
      const x1 = (a[0] + (b[0] - a[0]) * t0) * P, y1 = (a[1] + (b[1] - a[1]) * t0) * P;
      const x2 = (a[0] + (b[0] - a[0]) * t1) * P, y2 = (a[1] + (b[1] - a[1]) * t1) * P;
      const col = kind === OPENING ? 'var(--emerald-glow)' : 'var(--gold)';
      h += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col +
           '" stroke-width="' + (kind === OPENING ? 3 : 5) + '"' +
           (kind === OPENING ? ' stroke-dasharray="3 4"' : '') +
           (r.outdoor && kind !== OPENING ? ' opacity="0.55"' : '') + ' stroke-linecap="round"/>';
    }

    if (r.grow > 0.92) {
      const c = centroid(r.pts), b2 = bbox(r.pts);
      const nm = st.names[r.id] !== undefined ? st.names[r.id] : r.name;
      if (nm) h += '<text class="plan-name" x="' + (c[0] * P) + '" y="' + (c[1] * P - 2) + '" text-anchor="middle">' + UI.esc(nm) + '</text>';
      if (st.shade > 0) {
        h += '<text class="plan-tiny" x="' + (c[0] * P) + '" y="' + (c[1] * P + 11) + '" text-anchor="middle" opacity="' + st.shade.toFixed(3) + '">' +
             UI.esc(lightLabel(r.light) + (r.outdoor ? ' · outdoors' : '')) + '</text>';
      }
      if (st.scale > 0) {
        h += '<text class="plan-tiny" x="' + (c[0] * P) + '" y="' + (b2.y1 * P - 7) + '" text-anchor="middle" opacity="' + (st.scale * 0.8).toFixed(3) + '">' +
             UI.esc(metres(b2.x1 - b2.x0) + ' × ' + metres(b2.y1 - b2.y0)) + '</text>';
      }
    }
    return h + '</g>';
  }

  function drawHeat() {
    if (st.heat <= 0) return '';
    let h = '<g opacity="' + st.heat.toFixed(3) + '" style="pointer-events:none">';
    st.rooms.forEach(function (r) {
      const b = bbox(r.pts), col = HEAT[verdictOf(r.light)];
      for (let cx = b.x0; cx < b.x1; cx++) {
        for (let cy = b.y0; cy < b.y1; cy++) {
          h += '<rect x="' + (cx * P) + '" y="' + (cy * P) + '" width="' + P + '" height="' + P + '" style="fill:' + col + '"/>';
        }
      }
    });
    return h + '</g>';
  }

  function drawTrace() {
    if (!st.trace) return '';
    const t = st.trace;
    let h = '';
    if (t.pts.length) {
      const run = t.pts.concat(t.cursor ? [t.cursor] : []);
      h += '<polyline points="' + poly(run) + '" style="fill:var(--mint-wash);stroke:var(--emerald-glow);stroke-width:1.5;stroke-dasharray:4 4"/>';
    }
    t.pts.forEach(function (p, i) {
      h += '<circle cx="' + (p[0] * P) + '" cy="' + (p[1] * P) + '" r="' + (i === 0 ? 7 : 4) +
           '" style="fill:' + (i === 0 ? 'var(--bg-1)' : 'var(--emerald-glow)') + ';stroke:var(--emerald-glow);stroke-width:2"/>';
    });
    if (t.cursor) {
      h += '<circle cx="' + (t.cursor[0] * P) + '" cy="' + (t.cursor[1] * P) + '" r="11" style="fill:var(--mint-wash);stroke:var(--emerald-glow);stroke-width:1.4"/>';
      h += '<circle cx="' + (t.cursor[0] * P) + '" cy="' + (t.cursor[1] * P) + '" r="3" style="fill:var(--emerald-glow)"/>';
    }
    return h;
  }

  function drawPlant() {
    if (!st.plant) return '';
    const ring = st.verdict ? RING[st.verdict] : 'var(--hair-3)';
    const x = st.plant[0] * P, y = st.plant[1] * P;
    let h = '<g>';
    h += '<ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="12" ry="5" style="fill:rgba(0,0,0,0.22)"/>';
    h += '<circle cx="' + x + '" cy="' + y + '" r="11" style="fill:var(--plan-pot);stroke:' + ring + ';stroke-width:2.4"/>';
    h += '<text class="plan-letter" x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" style="font-size:12px">M</text>';
    if (st.verdict) {
      h += '<text class="plan-tiny" x="' + x + '" y="' + (y - 19) + '" text-anchor="middle" style="fill:' + ring + '">' +
           UI.esc(verdictWord(st.verdict)) + '</text>';
    }
    return h + '</g>';
  }

  function compassRose() {
    const known = st.northSet;
    let h = '<circle r="21" style="fill:var(--bg-2);stroke:' + (known ? 'var(--hair-3)' : 'var(--gold)') + '"/>';
    if (known) {
      h += '<g transform="rotate(' + st.north.toFixed(1) + ')">' +
           '<polygon points="0,-16 4,0 -4,0" style="fill:var(--terra)"/>' +
           '<polygon points="0,16 4,0 -4,0" style="fill:var(--ink-4)"/>' +
           '<text class="plan-n" y="-22" text-anchor="middle">N</text></g>';
    } else {
      h += '<text class="plan-n" y="4" text-anchor="middle" style="fill:var(--gold-lit)">N?</text>';
    }
    return h;
  }

  /* ======================================================================
     The beats. run(t) sets the whole world from t alone, so stepping back
     and jumping about land on the same picture as playing through.
     ====================================================================== */

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Everything the earlier beats established, so a beat only animates its
     own move. */
  function stateBefore(i) {
    if (i > 0) st.grid = 1;
    if (i >= 2) { add('living'); st.names.living = 'Living room'; }
    if (i >= 4) ['bedroom', 'kitchen', 'hall', 'balcony'].forEach(function (id) { add(id); });
    if (i >= 5) st.scale = 1;
    if (i >= 6) {
      room('living').win = [WINDOW, WALL, WALL, WALL];
      room('bedroom').win = [WALL, WINDOW, WALL, WALL];
      room('kitchen').win = [WALL, WALL, WALL, WINDOW];
    }
    if (i >= 7) { st.north = -14; st.northSet = true; st.shade = 1; }
    if (i >= 8) { room('hall').win = [OPENING, WALL, WALL, WALL]; room('hall').light = 2; }
    if (i >= 9) { room('balcony').outdoor = true; room('balcony').light = 4; }
    if (i >= 10) { st.plant = [10.8, 8.4]; st.verdict = 'ideal'; }
  }

  const BEATS = [
    {
      short: 'The grid', title: 'The grid', dur: 2200,
      body: 'Every square is half a metre. Draw your rooms at the size they really are and the readings that follow will mean something.',
      run: function (t) { st.grid = ease(t); }
    },
    {
      short: 'Trace a room', title: 'Trace a room', dur: 4200,
      body: 'Drag a box, or tap corner to corner for any shape. I\'ll snap what you draw to the grid as you go.',
      run: function (t) {
        const c = FLAT[0].pts;
        const k = Math.min(1, t / 0.88) * c.length;
        const i = Math.min(c.length - 1, Math.floor(k)), f = k - Math.floor(k);
        const a = c[i], b = c[(i + 1) % c.length];
        st.trace = { pts: c.slice(0, Math.floor(k)), cursor: [lerp(a[0], b[0], f), lerp(a[1], b[1], f)] };
        if (t >= 0.9) { st.trace = null; add('living', ease(seg(t, 0.9, 1))); st.names.living = ''; }
      }
    },
    {
      short: 'Name it', title: 'Name it', dur: 3000,
      body: 'Open a room and its heading is the name. Type over it and the plan keeps up with you.',
      mock: function (t) {
        const n = 'Living room', k = Math.floor(seg(t, 0.15, 0.85) * n.length);
        return '<div class="tour-mock-label">Room</div>' +
               '<div class="tour-mock-title">' + UI.esc(n.slice(0, k)) + '<i>|</i></div>';
      },
      run: function (t) {
        const n = 'Living room';
        st.names.living = n.slice(0, Math.floor(seg(t, 0.15, 0.85) * n.length));
      }
    },
    {
      short: 'The rest of it', title: 'The rest of the flat', dur: 4200,
      body: 'Keep going until the whole floor is down. Rooms that share a wall should share an edge, which is what lets light cross between them later.',
      run: function (t) {
        ['bedroom', 'kitchen', 'hall', 'balcony'].forEach(function (id, i) {
          add(id, ease(seg(t, i * 0.22, i * 0.22 + 0.30)));
        });
      }
    },
    {
      short: 'One real size', title: 'One real size', dur: 3800, lit: 'ruler',
      body: 'Measure one room and I\'ll scale the others from it. They all sit on the same grid, so a single width is enough.',
      mock: function (t) {
        const w = (seg(t, 0.1, 0.5) * 5).toFixed(1), rest = seg(t, 0.5, 0.9);
        const rows = ['bedroom', 'kitchen', 'balcony'].map(function (id) {
          let src = null;
          FLAT.forEach(function (f) { if (f.id === id) src = f; });
          const b = bbox(src.pts);
          return '<div class="tour-est"><span>' + UI.esc(src.name) + '</span><b>' +
                 UI.esc(metres(b.x1 - b.x0) + ' × ' + metres(b.y1 - b.y0)) + '</b></div>';
        }).join('');
        return '<div class="tour-mock-label">How big is it?</div>' +
               '<div class="grid-2" style="margin-bottom:8px">' +
                 '<div class="tour-field"><span>Width</span><b>' + w + '</b></div>' +
                 '<div class="tour-field"><span>Depth</span><b>' + (rest > 0 ? '4.0' : '—') + '</b></div>' +
               '</div>' +
               (rest > 0.1 ? '<div style="opacity:' + rest.toFixed(2) + '"><div class="tour-mock-label">The rest, estimated</div>' + rows + '</div>' : '');
      },
      run: function (t) { st.scale = seg(t, 0.5, 0.9); }
    },
    {
      short: 'Windows', title: 'Windows', dur: 4600,
      body: 'Tap a wall to cycle it: wall, then window, then opening. A window is the only way daylight gets into a room.',
      mock: function (t) {
        const k = seg(t, 0.05, 0.3) > 0.6;
        return '<div class="tour-mock-label">Wall / window / opening · tap to cycle</div>' +
               '<div class="row-wrap">' +
                 '<span class="tour-wall' + (k ? ' is-win' : '') + '">1 · ' + (k ? 'Window' : 'Wall') + '</span>' +
                 '<span class="tour-wall">2 · Wall</span><span class="tour-wall">3 · Wall</span><span class="tour-wall">4 · Wall</span>' +
               '</div>';
      },
      run: function (t) {
        st.hot = t < 0.3 ? { id: 'living', edge: 0 } : null;
        if (t > 0.22) room('living').win = [WINDOW, WALL, WALL, WALL];
        if (t > 0.55) room('bedroom').win = [WALL, WINDOW, WALL, WALL];
        if (t > 0.8) room('kitchen').win = [WALL, WALL, WALL, WINDOW];
      }
    },
    {
      short: 'North', title: 'Which way is north', dur: 4200, lit: 'compass',
      body: 'Turn the dial until N points the way north is at your place. Until it\'s confirmed I leave every room unshaded rather than guess at it.',
      run: function (t) {
        st.north = lerp(0, -14, ease(Math.min(1, t / 0.5)));
        st.northSet = t > 0.5;
        st.shade = ease(seg(t, 0.55, 1));
      }
    },
    {
      short: 'Doorways', title: 'Doorways', dur: 4000,
      body: 'An opening lets a room borrow light from the one next door, one step dimmer. Light crosses a single doorway, never a chain of them.',
      run: function (t) {
        st.hot = t < 0.35 ? { id: 'hall', edge: 0 } : null;
        const r = room('hall');
        if (t > 0.3) r.win = [OPENING, WALL, WALL, WALL];
        r.light = t > 0.55 ? 2 : 0;
      }
    },
    {
      short: 'Outdoors', title: 'Outdoors', dur: 3400,
      body: 'Tick a balcony as outdoors and every side with nothing built beyond it opens to the sky, so there are no windows to mark.',
      mock: function () {
        return '<div class="tour-mock-label">Balcony</div>' +
               '<div class="row" style="gap:10px"><span class="tour-wall is-open">✓ Outdoors</span>' +
               '<span class="hint" style="margin:0">Open sky on three sides</span></div>';
      },
      run: function (t) {
        const r = room('balcony');
        r.outdoor = t > 0.3;
        r.light = t > 0.45 ? 4 : 0;
      }
    },
    {
      short: 'A plant’s place', title: 'Where a plant should stand', dur: 4800,
      body: 'Drop a plant in and I\'ll shade the whole floor by how well each square suits it. The greenest one is where I\'d put it.',
      run: function (t) {
        st.heat = ease(seg(t, 0.05, 0.4));
        const k = ease(seg(t, 0.35, 0.8));
        st.plant = [lerp(24, 10.8, k), lerp(19, 8.4, k)];
        st.verdict = t > 0.85 ? 'ideal' : null;
      }
    },
    {
      short: 'Done', title: 'That is a home, read for light', dur: 3400, last: true,
      body: 'Each room\'s reading feeds the watering of everything standing in it, and I\'ll say so when a plant is in the wrong place. Your turn.',
      run: function (t) { st.heat = 1 - ease(t); }
    }
  ];

  /* ======================================================================
     The overlay
     ====================================================================== */

  let root = null, canvas = null, at = 0, t = 0, playing = false, raf = null, last = 0, onHandover = null;

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function paint() {
    const beat = BEATS[at], tt = reduced() ? 1 : t;
    reset();
    stateBefore(at);
    beat.run(tt);

    let h = drawGrid();
    st.rooms.forEach(function (r) { h += drawRoom(r); });
    h += drawHeat() + drawTrace() + drawPlant();
    canvas.innerHTML = h;
    root.querySelector('#tr-rose').innerHTML = compassRose();

    root.querySelector('#tr-num').textContent = 'Step ' + (at + 1) + ' of ' + BEATS.length;
    root.querySelector('#tr-title').textContent = beat.title;
    root.querySelector('#tr-body').textContent = beat.body;
    root.querySelector('#tr-meter').style.width = ((at + tt) / BEATS.length * 100).toFixed(2) + '%';
    root.querySelector('#tr-back').disabled = at === 0;
    root.querySelector('#tr-next').disabled = at === BEATS.length - 1;

    const mock = root.querySelector('#tr-mock');
    const html = beat.mock ? beat.mock(tt) : null;
    if (html) { mock.innerHTML = html; mock.classList.add('is-up'); }
    else { mock.classList.remove('is-up'); }

    root.querySelectorAll('[data-tr-lit]').forEach(function (el) {
      el.classList.toggle('is-lit', beat.lit === el.getAttribute('data-tr-lit'));
    });

    /* The last beat swaps the primary action for the handover, because the
       point of the walkthrough is the plan the reader draws after it. */
    const done = at === BEATS.length - 1 && tt >= 1;
    root.querySelector('#tr-play').hidden = done;
    root.querySelector('#tr-go').hidden = !done;
    setPlayLabel();
  }

  function frame(now) {
    if (!playing) return;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    t += dt / BEATS[at].dur;
    if (t >= 1) {
      t = 1;
      if (at < BEATS.length - 1) { paint(); at++; t = 0; }
      else { paint(); pause(); return; }
    }
    paint();
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (at === BEATS.length - 1 && t >= 1) { at = 0; t = 0; }
    playing = true; last = 0;
    setPlayLabel();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    setPlayLabel();
    paint();
  }
  /* UI.icon has no transport glyphs and one overlay is not a reason to add
     two to the set, so they are drawn here. */
  const PLAY = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><rect x="3.5" y="2.5" width="3.5" height="11"/><rect x="9" y="2.5" width="3.5" height="11"/></svg>';
  function setPlayLabel() {
    const b = root.querySelector('#tr-play');
    if (b) b.innerHTML = (playing ? PAUSE + 'Pause' : PLAY + 'Play');
  }
  function jump(i) {
    at = Math.max(0, Math.min(BEATS.length - 1, i));
    if (playing) { t = 0; last = 0; paint(); }
    else { t = 1; paint(); }
  }

  function close(handover) {
    if (!root) return;
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey, true);
    document.body.style.overflow = '';
    const el = root;
    root = null; canvas = null;
    el.classList.add('is-out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    if (handover && typeof onHandover === 'function') onHandover();
  }

  /* Capture, because the app's own shortcuts would otherwise navigate the
     page behind an overlay the reader cannot see past. */
  function onKey(e) {
    if (!root) return;
    if (e.key === 'Escape') { close(false); }
    else if (e.key === 'ArrowRight') { jump(at + 1); }
    else if (e.key === 'ArrowLeft') { jump(at - 1); }
    else if (e.key === ' ') { playing ? pause() : play(); }
    e.stopPropagation();
    if (e.key === ' ' || e.key.indexOf('Arrow') === 0) e.preventDefault();
  }

  function open(handover) {
    if (root) return;
    onHandover = handover || null;
    at = 0; t = 0; reset();

    root = document.createElement('div');
    root.className = 'tour';
    root.innerHTML =
      '<div class="tour-plate" role="dialog" aria-modal="true" aria-label="How the plan works">' +
        '<div class="tour-stage">' +
          '<svg id="tr-canvas" viewBox="144 96 528 432" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>' +
          '<div class="plan-tools">' +
            '<span class="plan-tool is-rose" data-tr-lit="compass"><svg id="tr-rose" viewBox="-30 -30 60 60" aria-hidden="true"></svg></span>' +
            '<span class="plan-tool" data-tr-lit="ruler">' + UI.icon('ruler') + '</span>' +
          '</div>' +
          '<div class="tour-mock" id="tr-mock"></div>' +
        '</div>' +
        '<div class="tour-say">' +
          '<div class="tour-head"><span class="tour-num" id="tr-num"></span><h2 id="tr-title"></h2></div>' +
          '<p id="tr-body"></p>' +
          '<div class="tour-meter"><i id="tr-meter"></i></div>' +
          '<div class="row tour-bar">' +
            '<button class="btn btn-sm" id="tr-play"></button>' +
            '<button class="btn" id="tr-go" hidden>' + UI.icon('plus') + 'Start my own plan</button>' +
            '<button class="btn btn-ghost btn-sm" id="tr-back">Back</button>' +
            '<button class="btn btn-ghost btn-sm" id="tr-next">Next</button>' +
            '<span style="flex:1"></span>' +
            '<button class="link-btn" id="tr-skip">Skip</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    canvas = root.querySelector('#tr-canvas');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);

    root.addEventListener('click', function (e) {
      if (e.target.closest('#tr-play')) { playing ? pause() : play(); return; }
      if (e.target.closest('#tr-next')) { jump(at + 1); return; }
      if (e.target.closest('#tr-back')) { jump(at - 1); return; }
      if (e.target.closest('#tr-skip')) { close(false); return; }
      if (e.target.closest('#tr-go')) { close(true); return; }
    });

    paint();
    /* Choosing to watch is choosing not to drive, so it plays itself. A
       reader who has asked not to be animated at gets the end of each beat
       and the buttons instead. A timer rather than a frame callback: the
       overlay has only just been appended, and a first frame is not owed. */
    if (!reduced()) setTimeout(play, 60);
  }

  /* The invitation belongs only on a plan with nothing on it: once a room
     exists the reader has worked it out and does not need asking again. */
  function shouldOffer() {
    return !Store.get().rooms.some(function (r) { return !!r.shape; });
  }

  return { open: open, shouldOffer: shouldOffer };
})();
