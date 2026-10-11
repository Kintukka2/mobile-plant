// Captures the phone screens the marketing site shows, from the app as it is
// now, so the site never sells an older build than the one on Play.
//
//   node .claude/serve.js &          (the app on :8787)
//   NODE_PATH=$(npm root -g) node marketing/site-shots/capture.js
//
// The greenhouse is the reels' (marketing/reels/build/seed.js), so every
// marketing surface shows the same Daniel and the same plants, with the
// tour's sample flat drawn in as the plan. The clock is fixed to the seed's
// date plus three, so Today has a short list due rather than none. Writes 1170x2532 PNGs
// beside this file; site/img/screens/ carries web-weight copies.
const { chromium } = require('playwright');
const path = require('path');
const seed = require('../reels/build/seed.js');

const APP = process.env.APP || 'http://127.0.0.1:8787/';
const OUT = __dirname;
const W = 0, WIN = 1, OPEN = 2;

function state() {
  const st = seed();
  // The tour's flat (js/tour.js FLAT), corners as {x, y} cells. North is
  // confirmed at 270, to the left of the plan, so the top edge faces east;
  // with the seed in the southern hemisphere that gives the plan every rung
  // of the light ladder: bright indirect through the living room's east
  // window, the bedroom's south one dimmer, the kitchen borrowing across its
  // doorway, a hallway with no window, and a balcony in full sun.
  st.rooms = [
    { id: 'living',  name: 'Living Room', icon: 'sofa',   humid: 'normal', notes: '', shape: { pts: [{x:8,y:6},{x:18,y:6},{x:18,y:14},{x:8,y:14}],   win: [WIN, OPEN, OPEN, W], outdoor: false } },
    { id: 'bedroom', name: 'Bedroom',     icon: 'bed',    humid: 'normal', notes: '', shape: { pts: [{x:18,y:6},{x:26,y:6},{x:26,y:13},{x:18,y:13}], win: [W, WIN, OPEN, OPEN], outdoor: false } },
    { id: 'kitchen', name: 'Kitchen',     icon: 'kettle', humid: 'humid',  notes: '', shape: { pts: [{x:8,y:14},{x:15,y:14},{x:15,y:20},{x:8,y:20}], win: [OPEN, W, W, W],     outdoor: false } },
    { id: 'hall',    name: 'Hallway',     icon: 'door',   humid: 'normal', notes: '', shape: { pts: [{x:15,y:14},{x:18,y:14},{x:18,y:20},{x:15,y:20}], win: [W, W, W, W],      outdoor: false } },
    { id: 'balcony', name: 'Balcony',     icon: 'sun',    humid: 'normal', notes: '', shape: { pts: [{x:18,y:13},{x:26,y:13},{x:26,y:17},{x:18,y:17}], win: [OPEN, W, W, W],   outdoor: true } }
  ];
  const at = { p1: ['living', 11, 8], p2: ['kitchen', 10, 16], p3: ['hall', 16, 18], p4: ['living', 15, 12], p5: ['living', 13, 7], p6: ['bedroom', 22, 9] };
  st.plants.forEach(p => { const a = at[p.id]; if (a) { p.roomId = a[0]; p.pos = { x: a[1], y: a[2] }; } });
  st.plan = { north: 270, northConfirmed: true, cell: 0.5, scaleFrom: 'living', backdrop: null, done: true };
  return st;
}

const SHOTS = [
  { name: 'today',     route: '#/today' },
  { name: 'plan',      route: '#/plan', then: async p => {
      // The isometric Home view: the one that shows light as a picture.
      await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().toLowerCase() === 'home'); b && b.click(); });
    } },
  { name: 'plant',     route: '#/plant/p1' },
  // The ranked causes, not the plant picker: the answer is what sells it.
  { name: 'diagnose',  route: '#/diagnose/p1/yellow-lower-leaves/causes' },
  { name: 'greenhouse', route: '#/greenhouse' }
];

(async () => {
  const b = await chromium.launch();
  for (const s of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'Australia/Sydney', isMobile: true, hasTouch: true });
    await ctx.addInitScript(j => { try { localStorage.setItem('sprout.state.v1', j); localStorage.setItem('sprout.theme', 'viridium'); } catch (e) {} }, JSON.stringify(state()));
    const p = await ctx.newPage();
    // Three days on from the seed's own date, so a few waterings are due.
    await p.clock.setFixedTime(new Date('2026-10-06T08:40:00+11:00'));
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(APP + s.route, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    // The splash lifts after its 2.3s floor; wait it out rather than remove it.
    await p.waitForFunction(() => !document.getElementById('splash'), null, { timeout: 8000 }).catch(() => {});
    if (s.then) { await s.then(p); }
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(OUT, s.name + '.png') });
    console.log(s.name, errs.length ? errs : 'ok');
    await ctx.close();
  }
  await b.close();
})();
