// Renders the brag stage: every frame (default), or named stills to check.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const [stillsArg] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync('brag.json'));
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8787/brag-output/work/stage.html', { waitUntil: 'load' });
  await p.evaluate(() => window.setup());
  if (stillsArg) {
    fs.mkdirSync('stills', { recursive: true });
    for (const s of stillsArg.split(',').map(Number)) {
      await p.evaluate(t => window.render(t), s);
      await p.screenshot({ path: `stills/${s.toFixed(2)}.png` });
    }
    console.log('stills', stillsArg, 'errors', errs.length ? errs : 'none');
  } else {
    const dir = 'frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const N = Math.round(C.duration * 30);
    for (let f = 0; f < N; f++) {
      await p.evaluate(t => window.render(t), f / 30);
      await p.screenshot({ path: `${dir}/${String(f).padStart(4, '0')}.png` });
    }
    console.log('frames', N, 'errors', errs.length ? errs : 'none');
  }
  await b.close();
})();
