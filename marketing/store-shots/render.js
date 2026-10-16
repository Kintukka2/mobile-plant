// Renders the store listing from frame.html and the captures in raw/.
//
//   node .claude/serve.js &
//   NODE_PATH=$(npm root -g) node marketing/store-shots/render.js            # every set, both sizes
//   NODE_PATH=$(npm root -g) node marketing/store-shots/render.js a android-phone   # one set, one size
//
// Writes native/store-assets/listing/<set>/<size>/NN-<screen>.jpg by way of
// flatten.py, which strips the alpha channel Play rejects, converts to JPEG
// and lays out overview.jpg. The feature graphic is rendered here too,
// from native/store-assets/feature-graphic.html.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SETS, SIZES } = require('./sets.js');

const APP = process.env.APP || 'http://127.0.0.1:8787/';
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'native', 'store-assets', 'listing');
const [onlySet, onlySize] = process.argv.slice(2);

(async () => {
  const b = await chromium.launch();
  const written = [];
  for (const [set, def] of Object.entries(SETS)) {
    if (onlySet && onlySet !== set) continue;
    for (const [size, { w, h, device, sets }] of Object.entries(SIZES)) {
      if (onlySize && onlySize !== size) continue;
      if (sets && !sets.includes(set)) continue;
      const dir = path.join(OUT, set, size);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      for (let i = 0; i < def.frames.length; i++) {
        const f = def.frames[i];
        await p.goto(APP + 'marketing/store-shots/frame.html?set=' + set + '&n=' + (i + 1) + '&w=' + w + '&h=' + h + (device ? '&device=' + device : ''), { waitUntil: 'load' });
        await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 10000 });
        const file = path.join(dir, String(i + 1).padStart(2, '0') + '-' + f.screen + '.png');
        await p.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
        written.push(file);
      }
      await p.close();
      console.log(set, size, def.frames.length);
    }
  }
  if (!onlySet) {
    const p = await b.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
    await p.goto(APP + 'native/store-assets/feature-graphic.html', { waitUntil: 'load' });
    await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 10000 });
    const file = path.join(ROOT, 'native', 'store-assets', 'play-feature-graphic-1024x500.png');
    await p.screenshot({ path: file });
    written.push(file);
    await p.close();
    console.log('feature graphic');
  }
  // The App Store's header and search results assets (promo.html), as
  // JPEG straight from the page: Apple refuses alpha in either, and a JPEG
  // has none to strip, so flatten.py has nothing to do for them.
  if (!onlySet || onlySet === 'promo') {
    for (const [kind, w, h] of [['header', 3840, 1646], ['search', 3840, 2560]]) {
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await p.goto(APP + 'marketing/store-shots/promo.html?kind=' + kind, { waitUntil: 'load' });
      await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 10000 });
      await p.screenshot({ path: path.join(ROOT, 'native', 'store-assets', 'app-store-' + kind + '-' + w + 'x' + h + '.jpg'), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: w, height: h } });
      await p.close();
      console.log('app store', kind);
    }
    if (onlySet === 'promo') { await b.close(); return; }
  }
  await b.close();
  execFileSync('python3', ['-I', path.join(__dirname, 'flatten.py'), OUT, ...written], { stdio: 'inherit' });
})();
