/* ==========================================================================
   Copy the shipped web app into www/ for Capacitor to bundle.
   --------------------------------------------------------------------------
   The app above this directory has no build step and is not getting one.
   This is the wrapper's build step, not the app's: it copies the files the
   service worker precaches into a folder Capacitor understands, and nothing
   it produces is ever read by the web version.

   Node built-ins only, to keep the wrapper installable with one npm command
   and nothing else.

   The list below is the same set as ASSETS in ../sw.js. Adding a js file to
   the app means adding it there anyway; if it is missing here the app runs
   in the shell with a piece torn out, so this throws rather than shipping a
   half-copied bundle.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'www');

/* Whole directories, copied as they are. */
const DIRS = ['css', 'js'];

/* Single files at the top level. brand.html is deliberately absent: it is a
   document for whoever works on Sprout, not part of the app, exactly as it
   is absent from the service worker's ASSETS. */
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  DIRS.forEach(function (d) {
    const from = path.join(ROOT, d);
    if (!fs.existsSync(from)) throw new Error('missing directory: ' + d);
    fs.cpSync(from, path.join(OUT, d), { recursive: true });
  });

  FILES.forEach(function (f) {
    const from = path.join(ROOT, f);
    if (!fs.existsSync(from)) throw new Error('missing file: ' + f);
    fs.cpSync(from, path.join(OUT, f));
  });

  /* A sanity check worth the four lines: every script index.html asks for
     has to have arrived, or the shell boots to a blank screen and the
     reason is three layers down in a native log. */
  const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const srcs = (html.match(/<script src="([^"]+)"/g) || [])
    .map(function (t) { return t.replace(/.*src="/, '').replace(/"$/, ''); })
    .filter(function (u) { return u.indexOf('http') !== 0; });

  srcs.forEach(function (u) {
    if (!fs.existsSync(path.join(OUT, u))) throw new Error('index.html wants ' + u + ', which was not copied');
  });

  console.log('Copied ' + srcs.length + ' scripts and ' + FILES.length + ' top-level files into native/www');
}

main();
