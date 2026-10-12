// Captures the app screens the store listing frames, from the app as it is
// now, so the listing never sells an older build than the one on Play.
//
//   node .claude/serve.js &          (the app on :8787)
//   NODE_PATH=$(npm root -g) node marketing/store-shots/capture.js
//
// Same home, clock and phone as marketing/site-shots/capture.js, so the
// listing and the site show one Daniel and one set of plants. Writes
// 1170x2532 PNGs to raw/ (ignored by git), plus the cut-out elements the
// lifted layout floats over the frame edge.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const state = require('../site-shots/state.js');

const APP = process.env.APP || 'http://127.0.0.1:8787/';
const OUT = path.join(__dirname, 'raw');

const clickText = (p, sel, re) => p.evaluate(([sel, src]) => {
  const r = new RegExp(src, 'i');
  const el = [...document.querySelectorAll(sel)].find(e => e.offsetParent && r.test(e.textContent.trim()));
  el && el.click();
  return !!el;
}, [sel, re.source]);

// Each crop is an element of the finished screen, photographed on its own
// at the same scale, so a lifted card is the card the reader will tap.
const SHOTS = [
  { name: 'today', route: '#/today', crops: { 'today-task': '.task', 'today-greeting': '.greeting-card' } },
  { name: 'caught-up', route: '#/today', then: async p => {
      // Tick every task the way a reader would, one at a time, until the
      // list gives way to "All caught up".
      for (let i = 0; i < 12; i++) {
        const left = await p.evaluate(() => { const b = document.querySelector('.task-check'); b && b.click(); return !!b; });
        if (!left) break;
        await p.waitForTimeout(450);
      }
      // Let the "Watered" toasts clear, then scroll the section title up to
      // the header: the frame runs the phone off the canvas's foot, and the
      // all-clear card is the point of this screen.
      await p.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 9000 }).catch(() => {});
      await p.evaluate(() => {
        const c = document.querySelector('.all-clear'), sec = c && c.closest('.section'), bar = document.querySelector('.topbar, .view-head, header');
        if (sec) window.scrollBy(0, sec.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 100) - 16);
      });
    } },
  { name: 'greenhouse', route: '#/greenhouse' },
  { name: 'plan', route: '#/plan', then: async p => { await clickText(p, 'button', /^home$/); } },
  { name: 'plant', route: '#/plant/p1', crops: { 'plant-chips': '.hero .row-wrap' } },
  { name: 'discover', route: '#/discover', then: async p => { await clickText(p, 'button', /^pet safe$/); } },
  { name: 'diagnose', route: '#/diagnose/p1/yellow-lower-leaves/causes', crops: { 'diagnose-cause': '.dx-result .dx-cause-head' } }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const b = await chromium.launch();
  for (const s of SHOTS) {
    if (only.length && !only.includes(s.name)) continue;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'Australia/Sydney', isMobile: true, hasTouch: true });
    await ctx.addInitScript(j => { try { localStorage.setItem('sprout.state.v1', j); localStorage.setItem('sprout.theme', 'viridium'); } catch (e) {} }, JSON.stringify(state()));
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date('2026-10-06T08:40:00+11:00'));
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(APP + s.route, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => !document.getElementById('splash'), null, { timeout: 8000 }).catch(() => {});
    if (s.then) await s.then(p);
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(OUT, s.name + '.png') });
    const got = [];
    for (const [name, sel] of Object.entries(s.crops || {})) {
      const el = p.locator('.view').locator(sel).first();
      if (await el.count()) {
        // A row with no card of its own sits on the page's gradient, which
        // would show as a box inside the lifted card. Give it the card's
        // flat ground first; frame.html pads it with the same colour.
        await el.evaluate(e => { if (!e.classList.contains('task') && !e.classList.contains('greeting-card')) e.style.background = '#0E1B15'; });
        await el.screenshot({ path: path.join(OUT, name + '.png') });
        got.push(name);
      }
      else got.push(name + ' MISSING');
    }
    console.log(s.name, errs.length ? errs : 'ok', got.join(' '));
    await ctx.close();
  }
  await b.close();
})();
