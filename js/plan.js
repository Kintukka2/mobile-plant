/* ==========================================================================
   Sprout — the floor plan
   --------------------------------------------------------------------------
   Geometry and light for rooms that have been drawn rather than described.
   No DOM in here: ViewPlan draws, this decides.

   A drawn room is a polygon in grid cells. Each edge is a wall, a window or
   an opening to the next room. Windows let the sky in and their strength
   comes from the compass aspect of the wall, which needs two facts the app
   already keeps separately: which way north is on the plan, and which
   hemisphere the reader is in. Openings borrow light from the room across
   them, one step dimmer, and only from that room's own windows — light
   crosses one doorway, it is not chained through the whole home. An outdoor
   room (a balcony) counts every side with nothing built beyond it as open
   sky, so it needs no windows marked at all.

   The one rule everything below obeys is the same one the room form
   follows: when north or the hemisphere is unconfirmed, say nothing. Every
   function that would assert a light level returns null instead, and
   sync() writes null into the rooms, so the rest of the app shows "light
   not set" rather than a confident guess.
   ========================================================================== */

window.Plan = (function () {

  const WALL = 0, WINDOW = 1, OPENING = 2;
  /* The drawable grid, in cells — 24m by 20m at the default half-metre
     cell. Wider than any flat needs on purpose: the grid is also the only
     thing on the canvas when nothing is drawn yet, and at 30 by 24 a pinch
     outwards ran off the end of it and left the plan floating in a void.
     The resting frame shows a window onto the middle of it, so there is
     always more grid in every direction. */
  const GW = 48, GH = 40;                 // the grid, in cells

  const RANKS = ['none', 'low', 'medium', 'bright-indirect', 'direct'];
  function keyOf(rank) { return RANKS[Math.max(0, Math.min(4, rank))]; }
  function rankOf(key) { return LOOKUPS.LIGHT[key] ? LOOKUPS.LIGHT[key].rank : null; }

  function settings() { return Store.get().plan; }
  function known() { return !!settings().northConfirmed && !Store.hemisphereIsGuess(); }
  function shaped() { return Store.get().rooms.filter(function (r) { return r.shape && r.shape.pts && r.shape.pts.length >= 3; }); }

  /* ---------- Polygon geometry ---------- */

  function area2(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; }
    return s;
  }
  /* Screen-clockwise (y down), so every edge's outward normal is (dy, -dx).
     A reversed polygon flips every normal, and with it every aspect. */
  function normalise(shape) {
    if (area2(shape.pts) < 0) {
      shape.pts.reverse();
      shape.win.reverse(); shape.win.unshift(shape.win.pop());
    }
    return shape;
  }
  function centroid(pts) {
    const A = area2(pts) / 2;
    if (Math.abs(A) < 1e-6) {
      return { x: pts.reduce(function (s, p) { return s + p.x; }, 0) / pts.length,
               y: pts.reduce(function (s, p) { return s + p.y; }, 0) / pts.length };
    }
    let cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], f = a.x * b.y - b.x * a.y;
      cx += (a.x + b.x) * f; cy += (a.y + b.y) * f;
    }
    return { x: cx / (6 * A), y: cy / (6 * A) };
  }
  function bbox(pts) {
    const xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
  }
  function pointIn(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if (((a.y > y) !== (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) inside = !inside;
    }
    return inside;
  }
  function edges(shape) {
    return shape.pts.map(function (a, i) {
      const b = shape.pts[(i + 1) % shape.pts.length];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      return { i: i, a: a, b: b, dx: dx, dy: dy, len: len, nx: dy / len, ny: -dx / len,
               mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, kind: shape.win[i] || WALL };
    });
  }
  function distToEdge(e, x, y) {
    const t = Math.max(0, Math.min(1, ((x - e.a.x) * e.dx + (y - e.a.y) * e.dy) / (e.len * e.len)));
    return Math.hypot(x - (e.a.x + t * e.dx), y - (e.a.y + t * e.dy));
  }
  function roomAt(x, y) {
    return shaped().filter(function (r) { return pointIn(r.shape.pts, x, y); })[0] || null;
  }
  /* The room on the far side of an edge, if any: probe just outside the midpoint. */
  function across(room, e) {
    const x = e.mid.x + e.nx * 0.3, y = e.mid.y + e.ny * 0.3;
    return shaped().filter(function (o) { return o !== room && pointIn(o.shape.pts, x, y); })[0] || null;
  }
  const SIDE = ['Top', 'Right', 'Bottom', 'Left'];
  function sideName(e) { return SIDE[Math.round(screenBearing(e) / 90) % 4]; }

  /* ---------- Light ---------- */

  /* Bearing of an edge's outward normal, clockwise from the top of the plan. */
  function screenBearing(e) { return (Math.atan2(e.nx, -e.ny) * 180 / Math.PI + 360) % 360; }
  /* Compass aspect of an edge, once north is known. */
  function aspectOf(e) {
    if (!known()) return null;
    const b = ((screenBearing(e) - settings().north) % 360 + 360) % 360;
    return LOOKUPS.ASPECTS[Math.round(b / 45) % 8];
  }
  function skyRank(e) {
    const a = aspectOf(e); if (!a) return null;
    const prof = LOOKUPS.aspectProfile(a, Store.hemisphere());
    return prof ? rankOf(prof.light) : null;
  }

  /* Every edge that lets light into a room, with the strength it arrives at.
     `direct` restricts to the room's own sky (windows and outdoor sides), which
     is what a neighbour is allowed to borrow through an opening. */
  function sources(room, direct) {
    if (!known() || !room.shape) return null;
    const out = [];
    edges(room.shape).forEach(function (e) {
      const nb = across(room, e);
      if (e.kind === WINDOW || (room.shape.outdoor && !nb)) { out.push({ e: e, rank: skyRank(e) }); return; }
      if (e.kind === OPENING && !direct && nb) {
        const there = pointRank(nb, e.mid.x + e.nx * 0.5, e.mid.y + e.ny * 0.5, true);
        if (there > 0) out.push({ e: e, rank: Math.max(1, there - 1), borrowed: nb });
      }
    });
    return out;
  }
  function roomRank(room) {
    const s = sources(room); if (s === null) return null;
    return s.reduce(function (m, x) { return Math.max(m, x.rank); }, 0);
  }
  /* Light at a spot: the source's strength, stepping down with distance in
     metres from it. Outdoors there is no falloff — the sky is overhead. */
  function pointRank(room, x, y, direct) {
    const s = sources(room, direct); if (s === null) return null;
    if (!s.length) return 0;
    const cell = settings().cell || 0.5;
    let best = 0;
    s.forEach(function (src) {
      const d = distToEdge(src.e, x, y) * cell;
      const drop = room.shape.outdoor ? 0 : d <= 1 ? 0 : d <= 2.5 ? 1 : d <= 4 ? 2 : 3;
      best = Math.max(best, Math.max(1, src.rank - drop));
    });
    return best;
  }
  /* The aspect the room's light comes from: its strongest direct window, or
     'NONE' for a room with no light of its own. */
  function roomAspect(room) {
    const s = sources(room, true); if (s === null) return null;
    if (!s.length) return sources(room).length ? null : 'NONE';
    let best = s[0];
    s.forEach(function (x) { if (x.rank > best.rank) best = x; });
    return aspectOf(best.e);
  }

  /* Same four verdicts as Schedule.lightMatch, so the plan and the plant
     page never disagree about the same spot. */
  function verdict(sp, rank) {
    if (rank === null || rank === undefined || !sp || !sp.light) return null;
    const key = keyOf(rank);
    if (key === 'none') return { verdict: 'bad', label: 'No daylight here' };
    if (key === sp.light.ideal) return { verdict: 'ideal', label: 'Perfect spot' };
    if ((sp.light.avoid || []).indexOf(key) !== -1) return { verdict: 'bad', label: rankOf(key) < rankOf(sp.light.ideal) ? 'Too dark here' : 'Too much sun here' };
    if ((sp.light.tolerates || []).indexOf(key) !== -1) return { verdict: 'ok', label: rankOf(key) < rankOf(sp.light.ideal) ? 'A little dim, but fine' : 'A little bright, but fine' };
    return { verdict: 'poor', label: rankOf(key) < rankOf(sp.light.ideal) ? 'Dimmer than it wants' : 'Brighter than it wants' };
  }

  /* Every whole cell inside a drawn room, rated for one species. */
  function heatCells(sp) {
    const cells = [];
    shaped().forEach(function (r) {
      const b = bbox(r.shape.pts);
      for (let cx = Math.floor(b.x0); cx < Math.ceil(b.x1); cx++) {
        for (let cy = Math.floor(b.y0); cy < Math.ceil(b.y1); cy++) {
          const x = cx + 0.5, y = cy + 0.5;
          if (!pointIn(r.shape.pts, x, y)) continue;
          const v = verdict(sp, pointRank(r, x, y));
          if (!v) continue;
          cells.push({ x: cx, y: cy, v: v.verdict, room: r });
        }
      }
    });
    return cells;
  }

  /* The best spot for a species, chosen from the same cells the heatmap
     shades so a suggestion can never point somewhere the plan shows as
     wrong. Nearest perfect cell first; failing that, nearest tolerable one. */
  function suggest(sp, from) {
    const cells = heatCells(sp);
    function pick(key) {
      let best = null;
      cells.forEach(function (c) {
        if (c.v !== key) return;
        const x = c.x + 0.5, y = c.y + 0.5, d = from ? Math.hypot(x - from.x, y - from.y) : 0;
        if (!best || d < best.d) best = { x: x, y: y, d: d, room: c.room };
      });
      return best;
    }
    const spot = pick('ideal') || pick('ok');
    if (!spot) return null;
    let edge = null, near = Infinity;
    (sources(spot.room) || []).forEach(function (src) {
      const d = distToEdge(src.e, spot.x, spot.y);
      if (d < near) { near = d; edge = src.e; }
    });
    return { room: spot.room, edge: edge, spot: { x: spot.x, y: spot.y }, rank: pointRank(spot.room, spot.x, spot.y) };
  }

  /* How far the noon sun reaches through an equator-facing window at the
     solstices. Needs a latitude, which only a saved location provides. */
  function sunReach(room) {
    const loc = Store.get().profile.location;
    if (!known() || !loc || !isFinite(loc.lat) || !room.shape || room.shape.outdoor) return null;
    const eq = Store.hemisphere() === 'south' ? 'N' : 'S';
    const hit = (sources(room, true) || []).some(function (s) { return aspectOf(s.e) === eq; });
    if (!hit) return null;
    const lat = Math.abs(loc.lat), head = 2.1;
    function alt(dec) { return 90 - lat + dec; }
    function reach(a) { return a <= 0 ? Infinity : a >= 90 ? 0 : head / Math.tan(a * Math.PI / 180); }
    return { winter: reach(alt(-23.44)), summer: reach(alt(23.44)) };
  }

  /* ---------- Keeping the rooms honest ----------
     Every drawn room's light and aspect are derived, and the rest of the app
     reads them off the room like any other. This writes the derivation back,
     and is cheap enough to run before every render: a handful of polygons.
     Rooms without a shape are never touched — their light is whatever the
     reader said it was. */
  function sync() {
    let changed = false;
    shaped().forEach(function (r) {
      const rank = roomRank(r);
      const light = rank === null ? null : keyOf(rank);
      const aspect = roomAspect(r);
      if (r.light !== light) { r.light = light; changed = true; }
      if (r.aspect !== aspect) { r.aspect = aspect; changed = true; }
    });
    if (changed) Store.save();
    return changed;
  }

  return {
    WALL: WALL, WINDOW: WINDOW, OPENING: OPENING, GW: GW, GH: GH,
    keyOf: keyOf, rankOf: rankOf, known: known, shaped: shaped,
    area2: area2, normalise: normalise, centroid: centroid, bbox: bbox, pointIn: pointIn,
    edges: edges, distToEdge: distToEdge, roomAt: roomAt, across: across, sideName: sideName,
    screenBearing: screenBearing, aspectOf: aspectOf, skyRank: skyRank,
    sources: sources, roomRank: roomRank, pointRank: pointRank, roomAspect: roomAspect,
    verdict: verdict, heatCells: heatCells, suggest: suggest, sunReach: sunReach, sync: sync
  };
})();
