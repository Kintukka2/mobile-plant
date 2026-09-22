/* ==========================================================================
   Sprout — reminders
   --------------------------------------------------------------------------
   The web cannot schedule a notification on the device for later. The one
   API that could was abandoned, so a morning reminder needs something
   outside the page. Sprout takes the native route: the shell in native/
   hands the schedule to the operating system, and no server exists at all.
   The browser version is the try-before-you-install one and says so rather
   than offering a reminder it can never deliver.
   A service worker cannot read localStorage — only IndexedDB — so it can
   never compute what is due. Instead the app writes a **digest** to
   IndexedDB on every save: one finished sentence per day for the next
   month. Whatever wakes the device then only has to look up today and show
   what it finds. No schedule logic outside this file, and nothing to keep
   in step.

   That the digest is a projection is deliberate. It assumes the reader
   waters when asked, and it is rewritten every time anything is saved, so
   it stays true as long as the app is being opened. On the one day it might
   drift — a week of silence — it is still the best guess available, and the
   notification only ever invites you in to look at the real numbers.
   ========================================================================== */

window.Notify = (function () {
  'use strict';

  const DB = 'sprout';
  const STORE = 'kv';
  const DIGEST_KEY = 'digest.v1';
  const PENDING_KEY = 'pending.v1';
  const HORIZON = 30;          // days of projection; iOS caps pending local notifications at 64

  /* ======================================================================
     IndexedDB — one tiny key/value store, shared with sw.js
     ====================================================================== */

  function open() {
    return new Promise(function (resolve, reject) {
      if (!self.indexedDB) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      /* Neither fires if an older connection is still holding the database,
         and a promise that never settles is worse than one that fails. */
      req.onblocked = function () { reject(new Error('indexedDB blocked')); };
      setTimeout(function () { reject(new Error('indexedDB timed out')); }, 3000);
    });
  }

  /* Every path closes the connection, including the one where opening the
     transaction throws. A leaked connection blocks the next version upgrade
     for good, and the symptom is an open() that simply never settles. */
  function put(key, value) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        let tx;
        try { tx = db.transaction(STORE, 'readwrite'); }
        catch (e) { db.close(); reject(e); return; }
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = function () { db.close(); resolve(true); };
        tx.onerror = function () { db.close(); reject(tx.error); };
        tx.onabort = function () { db.close(); reject(tx.error); };
      });
    });
  }

  function get(key) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        let tx;
        try { tx = db.transaction(STORE, 'readonly'); }
        catch (e) { db.close(); reject(e); return; }
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
        tx.oncomplete = function () { db.close(); };
        tx.onabort = function () { db.close(); reject(tx.error); };
      });
    });
  }

  /* ======================================================================
     Copy
     ====================================================================== */

  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function num(n) { return n <= 10 ? WORDS[n] : String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Up to three by name, then a count: a lock screen has room for a line,
     not a register. */
  function names(list) {
    if (list.length <= 1) return list[0] || '';
    if (list.length === 2) return list[0] + ' and ' + list[1];
    if (list.length === 3) return list[0] + ', ' + list[1] + ' and ' + list[2];
    return list[0] + ', ' + list[1] + ' and ' + num(list.length - 2) + ' more';
  }

  /* One plant is named, several are counted — a list of five names in a
     title is unreadable, and a bare count for one plant is colder than it
     needs to be. Water and feed falling on the same day make one line, not
     two notifications.

     The one-contraction-a-line rule bends here on purpose: a five-word
     title has nowhere natural to put one, and "Monny's thirsty" breaks on
     every plant whose name already ends in s. The warmth is carried by
     naming the plant instead. */
  function compose(water, feed) {
    if (!water.length && !feed.length) return null;
    const all = water.concat(feed.filter(function (n) { return water.indexOf(n) === -1; }));
    let title;
    if (water.length && feed.length) {
      /* One plant wanting both is still one plant. Counting the two jobs
         instead — "one to water and one to feed" — reads as two plants, and
         then the reader goes looking for the other one. */
      title = all.length === 1
        ? all[0] + ' wants water and a feed'
        : cap(num(water.length)) + ' to water and ' + num(feed.length) + ' to feed';
    } else if (water.length) {
      title = water.length === 1 ? water[0] + ' is thirsty today'
                                 : cap(num(water.length)) + ' of your plants are thirsty';
    } else {
      title = feed.length === 1 ? feed[0] + ' is due a feed'
                                : cap(num(feed.length)) + ' of your plants are due a feed';
    }
    /* No body for a single plant: the title already said its name, and a
       notification that repeats itself reads as a mistake. */
    return { title: title, body: all.length > 1 ? names(all) : '' };
  }

  /* ======================================================================
     The digest
     ====================================================================== */

  function iso(d) { return UI.toISO(d); }

  /* Walk each plant forward from its next due date in steps of its current
     interval. The interval shifts with the season and the weather, so the
     far end of the month is a guess — but every save rewrites this, and a
     wake-up on roughly the right morning is what it is for. */
  function build() {
    const days = {};
    function mark(date, kind, name, id) {
      const k = iso(date);
      if (!days[k]) days[k] = { water: [], feed: [], waterIds: [] };
      days[k][kind].push(name);
      if (kind === 'water') days[k].waterIds.push(id);
    }

    const today = UI.today();
    const last = UI.addDays(today, HORIZON);

    Store.activePlants().forEach(function (p) {
      const name = Store.displayName(p);

      const w = Schedule.waterDue(p);
      if (w && w.interval > 0) {
        let at = UI.addDays(today, Math.max(0, w.days));
        while (at <= last) { mark(at, 'water', name, p.id); at = UI.addDays(at, w.interval); }
      }

      const f = Schedule.fertiliseDue(p);
      if (f && !f.dormant && f.interval > 0) {
        let at = UI.addDays(today, Math.max(0, f.days));
        while (at <= last) { mark(at, 'feed', name, p.id); at = UI.addDays(at, f.interval); }
      }
    });

    const out = {};
    Object.keys(days).forEach(function (k) {
      const d = days[k];
      const msg = compose(d.water, d.feed);
      if (msg) out[k] = { title: msg.title, body: msg.body, waterIds: d.waterIds };
    });

    const s = Store.get().settings;
    return {
      v: 1,
      builtAt: new Date().toISOString(),
      hour: typeof s.remindHour === 'number' ? s.remindHour : 8,
      on: !!s.remind,
      days: out
    };
  }

  /* Called from Store.save(), so it must never throw and never block. */
  /* Coalesced: dragging a room calls save() on every pointer move, and each
     one would otherwise rebuild a month of projections. */
  let queued = false;
  function sync() {
    if (queued) return;
    queued = true;
    setTimeout(function () {
      queued = false;
      let d;
      try { d = build(); } catch (e) { return; }
      /* Written on both runtimes. The shell does not read it, but one code
         path is worth more than the few bytes it costs there. */
      try { put(DIGEST_KEY, d).catch(function () {}); } catch (e) { /* private mode */ }
      if (isNative()) scheduleNative(d);
    }, 400);
  }

  function digest() { return get(DIGEST_KEY).catch(function () { return null; }); }
  function todayMessage() {
    const d = build();
    return d.days[iso(UI.today())] || null;
  }

  /* ======================================================================
     Permission and the test send
     ====================================================================== */

  function supported() {
    if (isNative()) return true;
    return typeof Notification !== 'undefined' && 'serviceWorker' in navigator &&
           (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }
  function state() {
    if (isNative()) return nativeState;
    if (!supported()) return 'unsupported';
    return Notification.permission;          // 'default' | 'granted' | 'denied'
  }

  /* Only ever called from a tap on the toggle. A permission prompt on first
     open is the fastest way to be denied for good. */
  function ask() {
    const N = notifier();
    if (N) {
      return N.requestPermissions().then(function (r) {
        nativeState = (r && r.display) === 'granted' ? 'granted' : 'denied';
        return nativeState;
      }).catch(function () { return 'denied'; });
    }
    if (!supported()) return Promise.resolve('unsupported');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    return Notification.requestPermission();
  }

  function show(msg) {
    if (!msg) return Promise.resolve(false);
    const N = notifier();
    if (N) {
      /* A second out, so the reader watches it arrive rather than finding
         it already sitting there. Id 1 is outside the date range above, so
         a test never displaces a real morning. */
      return N.schedule({ notifications: [{
        id: 1, title: msg.title, body: msg.body || '',
        schedule: { at: new Date(Date.now() + 1000) },
        actionTypeId: (msg.waterIds && msg.waterIds.length) ? ACTION_TYPE : '',
        extra: { waterIds: msg.waterIds || [], date: iso(UI.today()) }
      }] }).then(function () { return true; }).catch(function () { return false; });
    }
    if (!supported() || Notification.permission !== 'granted') return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.showNotification(msg.title, {
        body: msg.body || undefined,
        tag: 'sprout-care',
        data: { waterIds: msg.waterIds || [] },
        actions: (msg.waterIds && msg.waterIds.length) ? [{ action: 'water', title: 'Watered' }] : []
      }).then(function () { return true; });
    }).catch(function () { return false; });
  }

  /* ======================================================================
     The native shell
     ----------------------------------------------------------------------
     Everything above is shared. This hands the same digest to the OS as a
     list of notifications it will fire whether the app is running or not,
     which is what makes a server unnecessary.
     ====================================================================== */

  const ACTION_TYPE = 'SPROUT_CARE';
  /* iOS keeps at most 64 pending local notifications and silently drops the
     rest, so the month-long horizon is capped below that with room spare. */
  const MAX_PENDING = 60;

  function plugins() {
    const C = window.Capacitor;
    if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return null;
    return C.Plugins || null;
  }
  function notifier() {
    const p = plugins();
    return (p && p.LocalNotifications) || null;
  }
  function isNative() { return !!notifier(); }

  /* Permission is async on the shell but the Profile card renders in one
     pass, so the last known answer is kept here and refreshed behind it. */
  let nativeState = 'default';

  function refreshNative() {
    const N = notifier();
    if (!N || !N.checkPermissions) return Promise.resolve(nativeState);
    return N.checkPermissions().then(function (r) {
      const next = (r && r.display) === 'granted' ? 'granted'
                 : (r && r.display) === 'denied' ? 'denied' : 'default';
      const changed = next !== nativeState;
      nativeState = next;
      if (changed && window.App) App.refresh();
      return next;
    }).catch(function () { return nativeState; });
  }

  /* The date is the id. Rescheduling the same morning then replaces its
     notification instead of stacking a second one behind it, and 20260924
     sits well inside the 32-bit id both platforms expect. */
  function idFor(key) { return Number(key.replace(/-/g, '')); }
  function isOurs(id) { return id >= 20000101 && id <= 20991231; }

  function scheduleNative(d) {
    const N = notifier();
    if (!N) return Promise.resolve(false);
    return Promise.resolve(N.getPending ? N.getPending() : { notifications: [] })
      .then(function (r) {
        const mine = ((r && r.notifications) || []).filter(function (n) { return isOurs(n.id); });
        if (!mine.length) return null;
        return N.cancel({ notifications: mine.map(function (n) { return { id: n.id }; }) });
      })
      .then(function () {
        if (!d.on || nativeState !== 'granted') return false;
        const now = Date.now(), list = [];
        Object.keys(d.days).sort().forEach(function (k) {
          if (list.length >= MAX_PENDING) return;
          const at = UI.fromISO(k);
          if (!at) return;
          at.setHours(d.hour, 0, 0, 0);
          /* Today counts only if its hour is still ahead. Scheduling a time
             that has passed fires the moment the app is opened, which is
             the reader being told about their morning in the evening. */
          if (at.getTime() <= now) return;
          const m = d.days[k];
          list.push({
            id: idFor(k),
            title: m.title,
            body: m.body || '',
            /* Inexact on purpose. A reminder wants to arrive in the
               morning, not at 8:00:00, and exact alarms cost a permission
               on Android that this does not need. */
            schedule: { at: at, allowWhileIdle: false },
            actionTypeId: (m.waterIds && m.waterIds.length) ? ACTION_TYPE : '',
            extra: { waterIds: m.waterIds || [], date: k }
          });
        });
        if (!list.length) return false;
        return N.schedule({ notifications: list }).then(function () { return true; });
      })
      .catch(function () { return false; });
  }

  function initNative() {
    const N = notifier(), p = plugins();
    if (!N) return;
    if (N.registerActionTypes) {
      N.registerActionTypes({ types: [{ id: ACTION_TYPE, actions: [{ id: 'water', title: 'Watered' }] }] })
        .catch(function () {});
    }
    if (N.addListener) {
      N.addListener('localNotificationActionPerformed', function (e) {
        const extra = (e && e.notification && e.notification.extra) || {};
        if (e && e.actionId === 'water' && (extra.waterIds || []).length) {
          const n = apply([{ ids: extra.waterIds, kind: 'water', date: extra.date }]);
          if (n) {
            UI.toast(n === 1 ? 'Logged one watering' : 'Logged ' + num(n) + ' waterings', 'leaf');
            if (window.App) App.refresh();
          }
          return;
        }
        if (window.App) App.go('/today');
      });
    }
    /* Coming back after a week away, the projection has moved on and the
       schedule with it. Rebuilding on resume is cheap and keeps the two
       from drifting apart. */
    if (p && p.App && p.App.addListener) {
      p.App.addListener('appStateChange', function (st2) { if (st2 && st2.isActive) sync(); });
    }
    refreshNative().then(function () { sync(); });
  }

  /* ======================================================================
     Actions taken on the notification itself
     ----------------------------------------------------------------------
     The worker cannot reach localStorage, so a Watered tap with no page
     open is parked in IndexedDB and applied the next time the app loads.
     With a page open the worker messages it instead and it lands at once.
     ====================================================================== */

  function drain() {
    return get(PENDING_KEY).then(function (list) {
      if (!list || !list.length) return 0;
      return put(PENDING_KEY, []).then(function () {
        return apply(list);
      });
    }).catch(function () { return 0; });
  }

  function apply(list) {
    let n = 0;
    (list || []).forEach(function (item) {
      (item.ids || []).forEach(function (id) {
        if (!Store.getPlant(id)) return;
        Store.addLog({ plantId: id, kind: item.kind || 'water', date: item.date });
        n++;
      });
    });
    return n;
  }

  function listen() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', function (e) {
      const d = e.data;
      if (!d || d.type !== 'sprout-care') return;
      const n = apply([{ ids: d.ids, kind: d.kind, date: d.date }]);
      if (n) {
        UI.toast(n === 1 ? 'Logged one watering' : 'Logged ' + num(n) + ' waterings', 'leaf');
        if (window.App) App.refresh();
      }
    });
  }

  function init() {
    if (isNative()) initNative();
    listen();
    drain().then(function (n) {
      if (n && window.App) {
        UI.toast(n === 1 ? 'Logged one watering' : 'Logged ' + num(n) + ' waterings', 'leaf');
        App.refresh();
      }
    });
    sync();
  }

  return {
    init: init, sync: sync, digest: digest, todayMessage: todayMessage,
    compose: compose, supported: supported, state: state, ask: ask, show: show,
    isNative: isNative
  };
})();
