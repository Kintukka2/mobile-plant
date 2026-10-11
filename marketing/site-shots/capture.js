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
const state = require('./state.js');

const APP = process.env.APP || 'http://127.0.0.1:8787/';
const OUT = __dirname;

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
