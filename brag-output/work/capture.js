// Drives the real app, one video frame at a time, under a fake clock, and saves
// what the phone screen shows. Taps, pushes and highlight rects go to events.json
// so the stage can draw ripples, slides and rings on exactly those pixels.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const seed = require('./seed.js');
const FPS = 30, APP = 'http://127.0.0.1:8787/';
const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;

async function find(p, spec) {
  return p.evaluate(({ re, sel, within }) => {
    const r = new RegExp(re);
    let scope = document;
    if (within) { const w = [...document.querySelectorAll('*')].find(e => new RegExp(within).test(e.textContent) && e.children.length && e.offsetParent !== null && e.querySelectorAll('*').length < 400 && /section|card|list/i.test(e.className + ' ' + e.tagName)); if (w) scope = w; }
    const els = [...scope.querySelectorAll(sel || 'button,a,label,input,.task,[data-plant]')].filter(e => e.offsetParent !== null && r.test(e.textContent + ' ' + (e.placeholder || '')));
    // the innermost match, so a card's text does not select the whole list
    const el = els.sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!el) return null;
    el.setAttribute('data-cap-target', '1');
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, docY: b.top + scrollY };
  }, { re: spec.re.source, sel: spec.sel, within: spec.within && spec.within.source });
}

async function run(spec) {
  const out = `phone-${spec.id}`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Australia/Sydney' });
  const st = seed(); if (spec.mutate) spec.mutate(st);
  await ctx.addInitScript(s => { try { localStorage.setItem('sprout.state.v1', s); localStorage.setItem('sprout.theme', 'viridium'); } catch (e) {} }, JSON.stringify(st));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-10-03T08:12:00+10:00') });
  // Screenshots let real animation frames through, and the tour advances a
  // capped 64ms on each; tie its frames to the fake clock so only runFor moves it.
  if (spec.progress) await p.addInitScript(() => { window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16); window.cancelAnimationFrame = id => clearTimeout(id); });
  await p.goto(APP + spec.route, { waitUntil: 'load' });
  await p.clock.runFor(3200);
  // install() leaves the fake clock flowing in real time, which the slow
  // screenshots then leak into the tour; stop it so only runFor moves time.
  if (spec.progress) await p.clock.pauseAt((await p.evaluate(() => Date.now())) + 50);
  await p.evaluate(() => document.fonts.ready);
  // App transitions run on real time, which a frame-by-frame capture cannot keep;
  // the stage draws its own push, so the app's are switched off.
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important} html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}' });
  if (spec.prelude) await spec.prelude(p);
  await p.clock.runFor(100);

  const ev = { taps: [], pushes: [], rings: {}, from: spec.from, to: spec.to };
  const acts = spec.actions.map(a => ({ ...a, done: false }));
  let scroll = null;
  const f0 = Math.round(spec.from * FPS), f1 = Math.round(spec.to * FPS);
  for (let f = f0; f <= f1; f++) {
    const t = f / FPS;
    for (const a of acts) {
      if (a.done || t + 1e-6 < a.t) continue;
      a.done = true;
      if (a.tap) {
        const r = await find(p, a.tap);
        if (!r) { console.log(spec.id, 'TAP NOT FOUND', a.tap.re); continue; }
        ev.taps.push({ t: a.t, x: r.x + r.w / 2, y: r.y + r.h / 2 });
        await p.evaluate(() => { const el = document.querySelector('[data-cap-target]'); el.removeAttribute('data-cap-target'); el.click(); if (el.tagName === 'INPUT') el.focus(); });
        if (a.push) { ev.pushes.push({ t: a.t, f }); await p.evaluate(() => window.scrollTo(0, 0)); }
      }
      if (a.type) {
        const chars = [...a.type.text];
        for (let i = 0; i < chars.length; i++) acts.push({ t: a.t + i * a.type.dt, ch: chars[i], done: false });
      }
      if (a.ch !== undefined) { await p.keyboard.type(a.ch); ev.taps.push({ t: a.t, key: true }); }
      if (a.key) for (let i = 0; i < (a.times || 1); i++) { await p.keyboard.press(a.key); if (a.until && (await p.evaluate(a.until))) break; }
      if (a.scroll) {
        const r = a.scroll.re ? await find(p, a.scroll) : null;
        const y0 = await p.evaluate(() => scrollY);
        const y1 = r ? Math.max(0, r.docY - (a.scroll.offset || 0)) : a.scroll.y;
        scroll = { t0: a.t, dur: a.scroll.dur, y0, y1 };
        if (r) await p.evaluate(() => { const el = document.querySelector('[data-cap-target]'); el && el.removeAttribute('data-cap-target'); });
      }
      if (a.fn) await p.evaluate(a.fn);
    }
    if (scroll) {
      const k = Math.min(1, (t - scroll.t0) / scroll.dur);
      await p.evaluate(y => window.scrollTo(0, y), scroll.y0 + (scroll.y1 - scroll.y0) * ease(k));
      if (k >= 1) scroll = null;
    }
    for (const ring of spec.rings || []) {
      if (t < ring.t0 || t > ring.t1) continue;
      const r = await p.evaluate(ring.rect);
      if (r) (ev.rings[ring.id] = ev.rings[ring.id] || {})[f] = r;
    }
    if (spec.progress) {
      // The tour caps each rAF step, so its speed is not proportional to the
      // fake clock. Drive it by its own meter instead: (beat + t) of 11.
      const target = spec.progress(t);
      for (let i = 0; i < 3000; i++) {
        const got = await p.evaluate(() => parseFloat(document.querySelector('#tr-meter').style.width) / 100 * 11);
        if (got >= target - 0.002) break;
        await p.clock.runFor(8);
      }
    } else {
      await p.clock.runFor(1000 / FPS);
    }
    // Species photos are lazy and decode async, off the real clock, so a frame
    // shot straight after a search showed empty cards; wait (briefly, off the
    // page's faked timers) for every image on screen to be decoded first.
    await Promise.race([p.evaluate(() => Promise.all([...document.images].filter(i => {
      const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0;
    }).map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }))),
      new Promise(res => setTimeout(res, 1500))]);
    await p.screenshot({ path: `${out}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  fs.writeFileSync(`events-${spec.id}.json`, JSON.stringify(ev));
  console.log(spec.id, 'frames', f1 - f0 + 1, 'taps', ev.taps.filter(x => !x.key).length, 'pushes', ev.pushes.length, 'errors', errs.length ? errs : 'none');
  await b.close();
}

// One capture per feature card. Times are on the brag video's own clock, so
// the stage can lay the three phone runs end to end with a slide between them.
const SPECS = {
  schedule: {
    id: 'schedule', route: '#/today', from: 3.4, to: 8.9,
    actions: [
      // Monny, not the Calathea due today: its pot and terracotta move the
      // number off the species baseline, so the card has a "why" to show.
      { t: 4.2, scroll: { re: /Coming up/, sel: 'h2', offset: 330, dur: 0.9 } },
      { t: 5.3, tap: { re: /Monny\s*Water/, sel: '.task' }, push: true },
      { t: 6.0, scroll: { re: /^\s*Watering/i, sel: '.card', offset: 118, dur: 1.0 } }
    ],
    rings: [{ id: 'why', t0: 7.1, t1: 8.9, rect: () => {
      const eb = [...document.querySelectorAll('.card .eyebrow')].find(e => /why/i.test(e.textContent));
      if (!eb) return null; const st = eb.nextElementSibling || eb;
      const a = eb.getBoundingClientRect(), b = st.getBoundingClientRect();
      return [Math.min(a.left, b.left), a.top, Math.max(a.right, b.right) - Math.min(a.left, b.left), b.bottom - a.top];
    } }]
  },
  diagnose: {
    id: 'diagnose', route: '#/diagnose', from: 8.6, to: 14.3,
    actions: [
      { t: 9.3, tap: { re: /Monny/ }, push: true },
      { t: 10.2, tap: { re: /Leaves turning yellow/, sel: 'button' }, push: true },
      { t: 11.0, tap: { re: /Soil is wet or damp/, sel: 'button.dx-opt' } },
      { t: 11.5, tap: { re: /Only the oldest, lowest leaves/, sel: 'button.dx-opt' } },
      { t: 12.1, tap: { re: /^\s*Diagnose\s*$/, sel: 'button.btn' }, push: true }
    ],
    rings: [{ id: 'top', t0: 12.7, t1: 14.3, rect: () => {
      // the top-ranked cause: its name, how sure, and the pills, not the steps
      const c = document.querySelector('.dx-result'); if (!c) return null;
      const a = c.getBoundingClientRect(), w = c.querySelector('.row-wrap').getBoundingClientRect();
      return [a.left, a.top, a.width, w.bottom + 14 - a.top];
    } }]
  },
  planner: {
    id: 'planner', route: '#/plan', from: 14.0, to: 19.8,
    mutate: st => { st.plants = []; },
    prelude: async p => {
      await p.evaluate(() => document.querySelector('[data-tour="1"]').click());
      // Straight to the flat already traced and lit: beat 9 of 11, a plant's place.
      for (let i = 0; i < 4000; i++) {
        const got = await p.evaluate(() => parseFloat(document.querySelector('#tr-meter').style.width) / 100 * 11);
        if (got >= 8.98) break;
        await p.clock.runFor(120);
      }
    },
    progress: t => 8.98 + Math.max(0, t - 14.0) / 5.5,
    actions: []
  }
};

(async () => {
  const which = process.argv.slice(2);
  for (const k of (which.length ? which : Object.keys(SPECS))) await run(SPECS[k]);
})();
