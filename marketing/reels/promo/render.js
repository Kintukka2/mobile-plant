// Renders the promo stage: every frame into frames/ (default), or named
// stills into stills/ to check a moment, e.g. render.js 4,9.7,21.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const P = JSON.parse(fs.readFileSync('promo.json'));
const stills = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8787/marketing/reels/promo/stage.html', { waitUntil: 'load' });
  await p.evaluate(() => window.setup());
  if (stills) {
    fs.mkdirSync('stills', { recursive: true });
    for (const s of stills.split(',').map(Number)) {
      await p.evaluate(t => window.render(t), s);
      await p.screenshot({ path: `stills/${s.toFixed(2)}.png` });
    }
    console.log('stills', stills, 'errors', errs.length ? errs : 'none');
  } else {
    fs.rmSync('frames', { recursive: true, force: true }); fs.mkdirSync('frames');
    const N = Math.round(P.duration * 30);
    for (let f = 0; f < N; f++) {
      await p.evaluate(t => window.render(t), f / 30);
      await p.screenshot({ path: `frames/${String(f).padStart(4, '0')}.png` });
    }
    console.log('frames', N, 'errors', errs.length ? errs : 'none');
  }
  await b.close();
})();
