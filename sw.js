/* ==========================================================================
   Sprout — service worker
   --------------------------------------------------------------------------
   The app is a fixed set of static files with all state in localStorage, so
   there is nothing to sync and nothing user-specific to cache. That makes the
   whole thing precacheable in one go.

   Strategy is stale-while-revalidate: answer from cache immediately (so the
   app opens instantly and works with no connection), then refresh the entry
   in the background so the next load picks up any edits. Plain cache-first
   would pin whatever shipped first and make hand-edits to the source
   invisible until the cache name changed, which is a nasty surprise while
   developing.

   Only registered over http/https — see registerSW() in js/app.js. On
   file:// the browser refuses to register at all.
   ========================================================================== */

/* Bumped for the Viridium overhaul: new stylesheet, new icon system, four
   new typefaces. Any visitor still holding sprout-v1 would otherwise be
   served the old shell from cache and never see a line of it. */
/* v6: the voice. Every view file carries user-facing copy and all of them
   changed, so a visitor holding v5 would read the old wording indefinitely.

   v5: the display face. PP Hatton replaces Italiana, self-hosted in two
   weights, and two new files join the precache list. A returning visitor
   holding v4 would otherwise be served a shell asking for a font the old
   cache has never heard of. */
const CACHE = 'sprout-v41-viridium';

/* Fonts live in their own cache, kept deliberately apart from the app shell.
   Two reasons. The shell cache is wiped on every version bump, and there is
   no sense re-downloading four typefaces because a CSS comment changed. And
   Google serves these from a second origin with immutable, hash-named URLs,
   so a cached entry can never go stale — the only way it changes is if the
   URL changes, at which point it is a different entry. */
/* Still three faces from Google — Cormorant, Jost and Sacramento. The
   display face left this cache when it became ours: it is in ASSETS above,
   versioned with the shell, and no longer at the mercy of a second origin. */
const FONT_CACHE = 'sprout-fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* Everything index.html pulls in, plus the two entry points. Keep in step
   with the <script> list in index.html. */
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  /* The display face. Self-hosted, so unlike the Google faces it can be
     precached by name at install — which is what makes a first offline load
     look like the app rather than like its fallback stack. */
  'css/fonts/hatton-ultralight.woff2',
  'css/fonts/hatton-medium.woff2',
  'js/data/lookups.js',
  'js/data/plants.js',
  'js/data/problems.js',
  'js/ui.js',
  'js/store.js',
  'js/photos.js',
  'js/schedule.js',
  'js/plan.js',
  'js/tour.js',
  'js/weather.js',
  'js/views/today.js',
  'js/views/greenhouse.js',
  'js/views/room.js',
  'js/views/plan.js',
  'js/views/plant.js',
  'js/views/discover.js',
  'js/views/diagnose.js',
  'js/views/profile.js',
  'js/views/settings.js',
  'js/views/diary.js',
  'js/onboard.js',
  'js/app.js'
];

self.addEventListener('install', function (e) {
  /* addAll() is atomic — one 404 rejects the whole install and leaves the
     old worker in charge. Cache entries individually so a single missing
     file degrades to "that one asset is not offline" instead of killing
     offline support entirely. */
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () {
          console.warn('[sw] could not precache', url);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n === CACHE || n === FONT_CACHE) return null;
        return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* ---- Typefaces: cache-first, on first use ----
     This branch has to come before the same-origin guard, which is why the
     app previously worked offline while looking nothing like itself: the
     shell was cached, the four typefaces were not, so a second-day offline
     visit fell back to system serif and the whole Viridium direction — which
     is carried almost entirely by the type — collapsed.

     They cannot be precached at install. Google returns a different woff2
     manifest depending on what the requesting browser supports, so the real
     file URLs are not knowable until the CSS has been parsed. First online
     load fills the cache; every load after that is instant and offline-safe.

     Cached even when `res.ok` is false. A cross-origin stylesheet or font is
     fetched no-cors, which yields an opaque response with status 0 — and the
     shell's `res.ok` test, sensible for our own files, would silently reject
     every one of these. Opaque responses replay from cache perfectly well;
     we just cannot read them, which we never need to. */
  if (FONT_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(
      caches.open(FONT_CACHE).then(function (cache) {
        return cache.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res) cache.put(req, res.clone());
            return res;
          }).catch(function () {
            /* Offline on a first visit. Resolving undefined lets the browser
               fall back to its own network error for this one subresource,
               which degrades to system type rather than a failed page. */
            return undefined;
          });
        });
      })
    );
    return;
  }

  // Everything else: same-origin only.
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {

        const fresh = fetch(req).then(function (res) {
          // Opaque/error responses are not worth persisting.
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () {
          /* Offline. If this was a navigation we still owe the browser a
             document, so fall back to the shell — the hash router will sort
             out which view to draw once it boots. */
          return hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined);
        });

        return hit || fresh;
      });
    })
  );
});
