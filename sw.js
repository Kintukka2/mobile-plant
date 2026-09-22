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
const CACHE = 'sprout-v52-viridium';

/* Fonts live in their own cache, kept deliberately apart from the app shell.
   Two reasons. The shell cache is wiped on every version bump, and there is
   no sense re-downloading four typefaces because a CSS comment changed. And
   Google serves these from a second origin with immutable, hash-named URLs,
   so a cached entry can never go stale — the only way it changes is if the
   URL changes, at which point it is a different entry. */
/* There is no font cache any more, and no second origin to need one. All
   four faces are ours, in ASSETS below, versioned with the shell. The old
   'sprout-fonts-v1' cache is deliberately no longer spared on activate, so
   a returning visitor's copies of the Google files are evicted rather than
   left behind for good. */

/* Everything index.html pulls in, plus the two entry points. Keep in step
   with the <script> list in index.html. */
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  /* Type, precached by name so a first offline load looks like the app
     rather than like its fallback stack. That was already true of the
     display face and is now true of all of them.

     This is the first-paint set only, not every file in css/fonts. The
     Cormorant italic and every latin-ext subset are shipped but left out
     here: nothing on the splash or the first screen needs them, and the
     same-origin handler below caches each one the first time it is used.
     Precaching the lot would put another 140KB in front of a reader who
     may only be trying the web version. */
  'css/fonts/hatton-ultralight.woff2',
  'css/fonts/hatton-medium.woff2',
  'css/fonts/cormorant-var.woff2',
  'css/fonts/jost-var.woff2',
  'css/fonts/sacramento-400.woff2',
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
  'js/notify.js',
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
        if (n === CACHE) return null;
        return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ==========================================================================
   Reminders
   --------------------------------------------------------------------------
   This worker knows nothing about plants, and that is the design. A worker
   cannot read localStorage, where all of Sprout's state lives, so it could
   never work out what is due. js/notify.js writes a digest to IndexedDB
   instead — one finished sentence per day — and all of this has to do is
   look up today and show it.

   Whatever wakes the device is still to be decided: a push service with a
   server that knows only which mornings to ping, or a native shell using
   the OS scheduler. Either arrives here, and neither changes a line of it.
   ========================================================================== */

const NDB = 'sprout', NSTORE = 'kv';

function idb(mode) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(NDB, 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains(NSTORE)) req.result.createObjectStore(NSTORE);
    };
    req.onsuccess = function () { resolve(req.result.transaction(NSTORE, mode).objectStore(NSTORE)); };
    req.onerror = function () { reject(req.error); };
  });
}
function idbGet(key) {
  return idb('readonly').then(function (os) {
    return new Promise(function (resolve) {
      const r = os.get(key);
      r.onsuccess = function () { resolve(r.result || null); };
      r.onerror = function () { resolve(null); };
    });
  }).catch(function () { return null; });
}
function idbPut(key, value) {
  return idb('readwrite').then(function (os) { os.put(value, key); }).catch(function () {});
}

/* Local, not UTC: a reminder belongs to the reader's morning, and toISO in
   js/ui.js keys the digest the same way. */
function todayKey() {
  const d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

self.addEventListener('push', function (e) {
  e.waitUntil(idbGet('digest.v1').then(function (d) {
    const key = todayKey();
    const m = d && d.days && d.days[key];
    if (m) {
      return self.registration.showNotification(m.title, {
        body: m.body || undefined,
        tag: 'sprout-care',
        data: { waterIds: m.waterIds || [], date: key },
        actions: (m.waterIds && m.waterIds.length) ? [{ action: 'water', title: 'Watered' }] : []
      });
    }
    /* A push has to end in something visible. Swallow it and the browser
       posts its own "this site was updated in the background", and enough
       of those cost the permission outright — so on a quiet day this says
       so quietly rather than letting the platform say it worse. */
    return self.registration.showNotification('Nothing needs you today', {
      tag: 'sprout-care',
      body: 'I\'ll say so when something does.'
    });
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const data = e.notification.data || {};
  const ids = data.waterIds || [], date = data.date || todayKey();

  /* Watered, straight from the lock screen. With a page open it is applied
     at once; with none, it is parked and drained on the next load, because
     only the page can reach the store. */
  if (e.action === 'water' && ids.length) {
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      if (cs.length) { cs[0].postMessage({ type: 'sprout-care', ids: ids, kind: 'water', date: date }); return; }
      return idbGet('pending.v1').then(function (list) {
        list = list || [];
        list.push({ ids: ids, kind: 'water', date: date });
        return idbPut('pending.v1', list);
      });
    }));
    return;
  }

  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (let i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    if (self.clients.openWindow) return self.clients.openWindow('./#/today');
  }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

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
