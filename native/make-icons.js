/* ==========================================================================
   Generate every launcher, notification, splash and store image from the
   one definition of the mark.
   --------------------------------------------------------------------------
   The mark is three paths, and they exist in five places already: the
   favicon, the apple-touch-icon, the manifest, the sidebar and
   UI.icon('mark'). Hand-drawing a sixth and seventh copy for the stores is
   how those five drifted apart in the first place. This draws all of them
   from PATHS below, so a change to the mark is a re-run rather than an
   afternoon in an image editor.

   Run it from native/: `npm run icons`. sharp is a devDependency of the
   wrapper, not of the app — the app still installs nothing.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = __dirname;
const AND = path.join(ROOT, 'android/app/src/main/res');
const IOS = path.join(ROOT, 'ios/App/App/Assets.xcassets');
const STORE = path.join(ROOT, 'store-assets');

/* --bg-1 and --emerald-glow, hard-coded for the same reason brand.html
   already gives for the favicon and the touch icon: a file outside the
   document cannot read the cascade. Note the mark green is the glow, not
   the --leaf the app draws with in its own UI — a brighter green is what
   survives being shown at 48dp on a dark field. */
const FIELD = '#0A1410';
const GLOW = '#3FBE8B';

/* The mark, in its own 100x100 space. Its drawn extent is x 28..72 and
   y 24..84, so the optical centre is (50, 54) and the height is 60 — not
   the middle of the box. Everything below centres on that rather than on
   the artboard, because a sprig hung from the box centre sits visibly low. */
const PATHS = [
  'M50 84V40',
  'M50 58C36 58 28 49 28 36c14 0 22 9 22 22Z',
  'M50 46c14 0 22-9 22-22-14 0-22 9-22 22Z',
];
const CX = 50, CY = 54, MARK_H = 60;

/* Stroke is 5 units against a 60-unit mark — the same 5% of the artboard
   the brand guide states, expressed so it survives any scale. The mark is
   monoline, so this single number is the whole weight of the drawing.

   The notification icon is the one exception. It is drawn at 24dp, half the
   launcher's 48, and the brand rule already says the stroke thickens below
   32px because a hairline does not survive being scaled down. 8.5 is that
   rule applied, chosen against 5, 6.5 and 10 side by side at true size: the
   first two go wispy in a status bar sitting next to everyone else's icons,
   and 10 starts closing up the counters inside the leaves. */
const STROKE = 5;
const STROKE_SMALL = 8.5;

function svg(o) {
  const w = o.w, h = o.h;
  const k = o.glyph / MARK_H;
  const cx = w / 2, cy = h / 2;

  let bg = '';
  if (o.bg && o.circle) {
    bg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (Math.min(w, h) / 2) + '" fill="' + o.bg + '"/>';
  } else if (o.bg) {
    const r = o.radius ? ' rx="' + o.radius + '"' : '';
    bg = '<rect width="' + w + '" height="' + h + '"' + r + ' fill="' + o.bg + '"/>';
  }

  const d = PATHS.map(function (p) { return '<path d="' + p + '"/>'; }).join('');

  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      bg +
      '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ') translate(' + -CX + ' ' + -CY + ')" ' +
         'fill="none" stroke="' + (o.fg || GLOW) + '" stroke-width="' + (o.stroke || STROKE) + '" ' +
         'stroke-linecap="round" stroke-linejoin="round">' + d + '</g>' +
    '</svg>'
  );
}

const written = [];
async function write(file, buf, opaque) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let img = sharp(buf);
  /* App Store Connect rejects an app icon that carries an alpha channel
     outright — "the large app icon can't be transparent nor contain an
     alpha channel" — and it rejects it at upload, after the archive, which
     is an expensive place to find out. Every pixel here is already opaque;
     it is the channel itself that has to go. */
  if (opaque) img = img.flatten({ background: FIELD }).removeAlpha();
  await img.png().toFile(file);
  written.push(path.relative(ROOT, file));
}

/* Density buckets are all the same physical size — a 48dp launcher icon is
   48dp on every phone — so the proportions below never vary by bucket. Only
   the pixel count does. */
const DPI = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];

async function main() {
  /* ---- Android launcher, legacy square (pre-API-26 draws the png as-is,
     so the rounding has to be baked in) ---- */
  for (const [d, m] of DPI) {
    const s = Math.round(48 * m);
    await write(path.join(AND, 'mipmap-' + d, 'ic_launcher.png'),
      svg({ w: s, h: s, bg: FIELD, radius: s * 0.22, glyph: s * 0.646 }));
    await write(path.join(AND, 'mipmap-' + d, 'ic_launcher_round.png'),
      svg({ w: s, h: s, bg: FIELD, circle: true, glyph: s * 0.583 }));
  }

  /* ---- Android adaptive foreground. The canvas is 108dp but a launcher
     only ever shows the middle 72, so the glyph is sized against that
     window, not against the file. 47/108 lands the same glyph the legacy
     square shows. ---- */
  for (const [d, m] of DPI) {
    const s = Math.round(108 * m);
    await write(path.join(AND, 'mipmap-' + d, 'ic_launcher_foreground.png'),
      svg({ w: s, h: s, glyph: s * (47 / 108) }));
  }

  /* ---- Android notification icon. Android throws away every colour in
     this file and keeps the alpha, so it must be white on transparent or
     it arrives as a grey square. ---- */
  for (const [d, m] of DPI) {
    const s = Math.round(24 * m);
    await write(path.join(AND, 'drawable-' + d, 'ic_stat_sprout.png'),
      svg({ w: s, h: s, fg: '#FFFFFF', stroke: STROKE_SMALL, glyph: s * 0.875 }));
  }

  /* ---- Android splash, both orientations ---- */
  const PORT = [[320, 480], [480, 800], [720, 1280], [960, 1600], [1280, 1920]];
  for (let i = 0; i < DPI.length; i++) {
    const [w, h] = PORT[i];
    await write(path.join(AND, 'drawable-port-' + DPI[i][0], 'splash.png'),
      svg({ w: w, h: h, bg: FIELD, glyph: Math.min(w, h) * 0.28 }));
    await write(path.join(AND, 'drawable-land-' + DPI[i][0], 'splash.png'),
      svg({ w: h, h: w, bg: FIELD, glyph: Math.min(w, h) * 0.28 }));
  }
  await write(path.join(AND, 'drawable', 'splash.png'),
    svg({ w: 480, h: 320, bg: FIELD, glyph: 320 * 0.28 }));

  /* ---- iOS. Apple masks the corners itself and rejects an alpha channel,
     so this is a flat square. ---- */
  await write(path.join(IOS, 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
    svg({ w: 1024, h: 1024, bg: FIELD, glyph: 1024 * 0.646 }), true);

  /* The 2732 square is aspect-filled, so on a portrait phone only the
     middle ~46% of its width is ever on screen. The glyph is sized against
     that visible strip rather than the file, or it arrives enormous. */
  for (const n of ['', '-1', '-2']) {
    await write(path.join(IOS, 'Splash.imageset', 'splash-2732x2732' + n + '.png'),
      svg({ w: 2732, h: 2732, bg: FIELD, glyph: 2732 * 0.46 * 0.28 }), true);
  }

  /* ---- The adaptive icon's background is a colour resource, not an image,
     and Capacitor ships it as white. Left alone it puts a white disc behind
     a foreground drawn for the deep field, which is the one failure the
     preview sheet cannot show you because the sheet composites the intended
     colour itself. Written here so it can never drift from FIELD. ---- */
  const bgXml = path.join(AND, 'values', 'ic_launcher_background.xml');
  fs.writeFileSync(bgXml,
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<resources>\n' +
    '    <color name="ic_launcher_background">' + FIELD + '</color>\n' +
    '</resources>\n');
  written.push(path.relative(ROOT, bgXml));

  /* ---- Play Console wants a flat 512 square and applies its own mask ---- */
  await write(path.join(STORE, 'play-icon-512.png'),
    svg({ w: 512, h: 512, bg: FIELD, glyph: 512 * 0.646 }));

  console.log('Wrote ' + written.length + ' images:');
  const byDir = {};
  written.forEach(function (f) {
    const d = path.dirname(f).replace(/(android\/app\/src\/main\/res|ios\/App\/App\/Assets\.xcassets)\//, '');
    byDir[d] = (byDir[d] || 0) + 1;
  });
  Object.keys(byDir).sort().forEach(function (d) { console.log('  ' + byDir[d] + '\t' + d); });
}

main().catch(function (e) { console.error(e); process.exit(1); });
