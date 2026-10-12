// Renders the stage for one reel: every frame (default), or named stills to check.
// LAND=1 renders the 1920x1080 landscape cut (frames-land-<id>/, stills/land-…)
// for promo.sh, which joins the reels into Play's promo video.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const [id, stillsArg] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync('reels.json'))[id];
const LAND = !!process.env.LAND, TAG = LAND ? 'land-' : '';
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: LAND ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8787/marketing/reels/build/stage.html' + (LAND ? '?land' : ''), { waitUntil: 'load' });
  await p.evaluate(id => window.setup(id), id);
  if (stillsArg) {
    fs.mkdirSync('stills', { recursive: true });
    for (const s of stillsArg.split(',').map(Number)) {
      await p.evaluate(t => window.render(t), s);
      await p.screenshot({ path: `stills/${TAG}${id}-${s.toFixed(2)}.png` });
    }
    console.log(id, 'stills', stillsArg, 'errors', errs.length ? errs : 'none');
  } else {
    const dir = `frames-${TAG}${id}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const N = Math.round(C.duration * 30);
    for (let f = 0; f < N; f++) {
      await p.evaluate(t => window.render(t), f / 30);
      await p.screenshot({ path: `${dir}/${String(f).padStart(4, '0')}.png` });
    }
    console.log(id, 'frames', N, 'errors', errs.length ? errs : 'none');
  }
  await b.close();
})();
