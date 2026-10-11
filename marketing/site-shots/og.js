// Renders og.html into site/img/og.jpg, the share card the site's
// og:image and twitter:image point at. Needs the app server on :8787.
//   NODE_PATH=$(npm root -g) node marketing/site-shots/og.js
const { chromium } = require('playwright');
const path = require('path');
const APP = process.env.APP || 'http://127.0.0.1:8787/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(APP + 'marketing/site-shots/og.html', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, '../../site/img/og.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
})();
