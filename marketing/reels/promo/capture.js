// The promo's phone screens, captured frame by frame from the real app by the
// reels' driver (../build/capture.js), on the promo's own clock: every action
// lands while the line that describes it is spoken (timeline in promo.json).
//
//   node ../../../.claude/serve.js &
//   NODE_PATH=$(npm root -g) node capture.js [id ...]
//
// Writes phone-<id>/ and events-<id>.json here.
const { run } = require('../build/capture.js');
const home = require('./home.js');

const use = opts => st => { for (const k of Object.keys(st)) delete st[k]; Object.assign(st, home(opts)); };
// The forecast is cached in the home; any refetch is refused, so nothing
// leaves the container and nothing on screen depends on the real weather.
const offline = async ctx => { await ctx.route(/open-meteo/, r => r.fulfill({ status: 503, body: '' })); };
// The "Why N and not M?" block on a plant page: the eyebrow and its list.
const why = () => {
  const eb = [...document.querySelectorAll('.card .eyebrow')].find(e => /why/i.test(e.textContent));
  if (!eb) return null;
  const card = eb.closest('.card'), list = eb.nextElementSibling || eb;
  const a = eb.getBoundingClientRect(), b = list.getBoundingClientRect(), c = card.getBoundingClientRect();
  return [c.left, a.top - 16, c.width, b.bottom - a.top + 30];
};
// Rects run in the page, so they cannot close over anything here: the
// pattern goes in as source, and the whole thing as an expression.
const box = re => `(() => {
  const re = new RegExp(${JSON.stringify(re.source)});
  const el = [...document.querySelectorAll('.view *')].filter(e => e.offsetParent && re.test(e.textContent)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
  if (!el) return null; const r = (el.closest('.nudge,.card') || el).getBoundingClientRect(); return [r.left, r.top, r.width, r.height];
})()`;

const SPECS = {
  // The hook: each Monstera's page, settled on its watering card.
  monny: { id: 'monny', route: '#/plant/p1', from: 0, to: 0.4, context: offline, mutate: use(),
    actions: [{ t: 0, scroll: { re: /^\s*Watering/i, sel: '.card .eyebrow', offset: 345, dur: 0.2 } }],
    rings: [{ id: 'why', t0: 0.3, t1: 0.4, rect: why }] },
  monty: { id: 'monty', route: '#/plant/p7', from: 0, to: 0.4, context: offline, mutate: use(),
    actions: [{ t: 0, scroll: { re: /^\s*Watering/i, sel: '.card .eyebrow', offset: 345, dur: 0.2 } }],
    rings: [{ id: 'why', t0: 0.3, t1: 0.4, rect: why }] },
  // Today, down to the light section, where Monty is named.
  light: { id: 'light', route: '#/today', from: 9.6, to: 16.8, context: offline, mutate: use(),
    actions: [{ t: 13.6, scroll: { re: /^\s*Light\s*$/, sel: 'h2', offset: 150, dur: 1.1 } }],
    rings: [{ id: 'wrong', t0: 14.6, t1: 16.6, rect: box(/^\s*Monty is in the wrong light/) }] },
  // The plan: pick Monty up in the kitchen, set it down by the living
  // room's window, open it, and its schedule has moved with it.
  plan: { id: 'plan', route: '#/plan', from: 16.8, to: 25.4, context: offline, mutate: use(),
    actions: [
      { t: 17.4, tap: { re: /^/, sel: '[data-plant="p7"]', mouse: true } },
      { t: 18.6, drag: { re: /^/, sel: '[data-plant="p7"]', to: [170, 262], dur: 1.3 } },
      { t: 20.6, tap: { re: /^/, sel: '[data-plant="p7"]', mouse: true } },
      { t: 22.2, tap: { re: /^/, sel: '#pl-open-plant' }, push: true },
      { t: 22.8, scroll: { re: /^\s*Watering/i, sel: '.card .eyebrow', offset: 330, dur: 0.9 } }
    ],
    rings: [{ id: 'every', t0: 23.8, t1: 25.2, rect: () => {
      const eb = [...document.querySelectorAll('.card .eyebrow')].find(e => /^\s*Watering/i.test(e.textContent));
      if (!eb) return null; const h = eb.nextElementSibling || eb, a = eb.getBoundingClientRect(), b = h.getBoundingClientRect();
      return [a.left, a.top, Math.max(a.width, b.width), b.bottom - a.top];
    } }] },
  // The forecast's offer, accepted.
  weather: { id: 'weather', route: '#/today', from: 25.4, to: 31.8, context: offline, mutate: use({ moved: true, fresher: true }),
    actions: [{ t: 25.9, scroll: { re: /Dry spell ahead/, sel: '.nudge-t', offset: 210, dur: 0.9 } },
      { t: 29.4, tap: { re: /Shorten by 2 days/, sel: 'button' } }],
    rings: [{ id: 'dry', t0: 26.9, t1: 29.2, rect: box(/^\s*Dry spell ahead/) }] },
  // Monty's page at its pets row, then a yellow leaf, diagnosed.
  pets: { id: 'pets', route: '#/plant/p7', from: 31.8, to: 38.4, context: offline, mutate: use({ moved: true }),
    actions: [{ t: 31.8, scroll: { re: /^\s*Pets & people\s*$/i, sel: 'h2,h3,.section-title', offset: 260, dur: 0.15 } },
      { t: 34.3, tap: { re: /Leaves turning yellow/, sel: 'button,a,.chip' }, push: true },
      { t: 35.3, tap: { re: /^\s*Diagnose\s*$/, sel: 'button.btn' }, push: true }],
    rings: [{ id: 'tox', t0: 32.3, t1: 34.1, rect: () => {
      const w = [...document.querySelectorAll('.row-wrap')].find(e => /Cats:/.test(e.textContent));
      if (!w) return null; const r = w.getBoundingClientRect(); return [r.left, r.top, r.width, r.height];
    } }] },
  // All caught up.
  rest: { id: 'rest', route: '#/today', from: 38.4, to: 38.6, context: offline, mutate: use({ moved: true, caughtUp: true }), actions: [] }
};

(async () => {
  const which = process.argv.slice(2);
  for (const k of (which.length ? which : Object.keys(SPECS))) await run(SPECS[k]);
})();
