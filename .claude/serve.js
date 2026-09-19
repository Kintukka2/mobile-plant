/* ==========================================================================
   Sprout — static file server
   --------------------------------------------------------------------------
   Serves the app for local testing on any machine with a Node runtime:
   Windows, macOS, Linux, or a cloud session.

   Node built-ins only. The app has no dependencies and neither does the
   thing that serves it, so there is nothing to install.

     node .claude/serve.js            → http://localhost:8787/
     PORT=3000 node .claude/serve.js  → another port
     HOST=0.0.0.0 node .claude/serve.js

   HOST is loopback by default. Binding it wider exposes the app to anything
   that can reach the box, which is occasionally what you want in a container
   and never what you want on a laptop — so it is opt-in, per run.
   ========================================================================== */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';

/* The repo currently ships no images — the
   icons are inline SVG data URIs — but the image types stay listed so that
   adding one is not also a debugging session about why it downloads instead
   of rendering. */
const TYPES = {
  '.html':        'text/html; charset=utf-8',
  '.css':         'text/css; charset=utf-8',
  '.js':          'application/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json':        'application/json; charset=utf-8',
  '.svg':         'image/svg+xml',
  '.png':         'image/png',
  '.jpg':         'image/jpeg',
  '.jpeg':        'image/jpeg',
  '.ico':         'image/x-icon',
  '.woff2':       'font/woff2'
};

/* Compared with a trailing separator attached, so a sibling directory whose
   name merely starts with the repo's own cannot be walked into: with a root
   of /home/you/plant-app, a bare prefix test would happily serve
   /home/you/plant-app-secrets. */
const ROOT_PREFIX = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;

function send(res, status, type, body, headOnly) {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    /* Never cache in development. The service worker is aggressive by design
       — it is the whole offline story — and a dev server that also caches
       means editing a file and seeing the old one, twice over. */
    'Cache-Control': 'no-store'
  });
  res.end(headOnly ? undefined : body);
}

const server = http.createServer(function (req, res) {
  const headOnly = req.method === 'HEAD';

  if (req.method !== 'GET' && !headOnly) {
    send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed', false);
    return;
  }

  /* The second argument is a base for parsing only; nothing about the
     request's Host header is trusted or used to resolve the file. */
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    send(res, 400, 'text/plain; charset=utf-8', 'Bad request', headOnly);
    return;
  }

  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const full = path.resolve(ROOT, '.' + pathname);

  if (full !== ROOT && !full.startsWith(ROOT_PREFIX)) {
    send(res, 403, 'text/plain; charset=utf-8', 'Forbidden', headOnly);
    console.log('403 ' + pathname);
    return;
  }

  fs.stat(full, function (err, stat) {
    if (err || !stat.isFile()) {
      send(res, 404, 'text/plain; charset=utf-8', 'Not found: ' + pathname, headOnly);
      console.log('404 ' + pathname);
      return;
    }
    fs.readFile(full, function (readErr, buf) {
      if (readErr) {
        send(res, 500, 'text/plain; charset=utf-8', 'Read error', headOnly);
        console.log('500 ' + pathname);
        return;
      }
      const type = TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream';
      send(res, 200, type, buf, headOnly);
      console.log('200 ' + pathname);
    });
  });
});

server.listen(PORT, HOST, function () {
  console.log('Serving ' + ROOT + ' on http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + '/');
});

/* A container stops the process with SIGTERM rather than Ctrl-C. Without
   this the port can stay held by a half-dead process and the next run fails
   with EADDRINUSE for no visible reason. */
['SIGINT', 'SIGTERM'].forEach(function (sig) {
  process.on(sig, function () {
    server.close(function () { process.exit(0); });
  });
});
