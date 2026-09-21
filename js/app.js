/* ==========================================================================
   Sprout — router & app init
   --------------------------------------------------------------------------
   Hash routing, because the app has to work when opened straight off the
   filesystem. Every view is a plain object registered on `window`:

   `params` is the path after the view name: `{ id, extra, tail }` for
   `#/name/id/extra/tail`. Four segments rather than three because a
   multi-step flow needs a step in the URL — Diagnose's ranked causes are a
   page of their own at /diagnose/:plant/:symptom/causes, and a step that is
   only a variable inside a view cannot be reached by the back button.

     {
       title(params)    -> string for the topbar
       sub(params)      -> optional smaller line under it
       actions(params)  -> optional HTML for the top-right buttons
       onAction(act)    -> handles clicks on those buttons
       back             -> true to show the back arrow
       render(params)   -> HTML string
       mount(root, params) -> wire up listeners
     }
   ========================================================================== */

window.App = (function () {

  const VIEWS = {
    today:      function () { return window.ViewToday; },
    greenhouse: function () { return window.ViewGreenhouse; },
    room:       function () { return window.ViewRoom; },
    plan:       function () { return window.ViewPlan; },
    plant:      function () { return window.ViewPlant; },
    discover:   function () { return window.ViewDiscover; },
    species:    function () { return window.ViewSpecies; },
    diagnose:   function () { return window.ViewDiagnose; },
    profile:    function () { return window.ViewProfile; },
    settings:   function () { return window.ViewSettings; },
    diary:      function () { return window.ViewDiary; }
  };

  const TABS = [
    { key: 'today',      label: 'Today',      icon: 'home',        path: '/today' },
    { key: 'greenhouse', label: 'Greenhouse', icon: 'leaf',        path: '/greenhouse' },
    { key: 'discover',   label: 'Discover',   icon: 'search',      path: '/discover' },
    { key: 'diagnose',   label: 'Diagnose',   icon: 'stethoscope', path: '/diagnose' },
    { key: 'profile',    label: 'You',        icon: 'user',        path: '/profile' }
  ];

  let current = { name: 'today', id: null, extra: null, tail: null };
  let currentView = null;
  let firstRender = true;

  /* ---------- Theme ----------
     Two palettes on one token set: Viridium (the emerald-black default) and
     Conservatory (daylight ivory). The value is mirrored in the <meta
     theme-color> so the OS chrome around an installed PWA matches, which is
     the difference between the app feeling native and feeling embedded.

     index.html applies the stored value inline before first paint; this is
     the runtime half that handles switching. */

  const THEMES = {
    viridium:     { next: 'conservatory', label: 'Daylight',  icon: 'sun',  color: '#0A1410' },
    conservatory: { next: 'viridium',     label: 'Nightfall', icon: 'moon', color: '#F7F3EC' }
  };

  function themeName() {
    const t = document.documentElement.getAttribute('data-theme');
    return THEMES[t] ? t : 'viridium';
  }

  function setTheme(name, announce) {
    if (!THEMES[name]) name = 'viridium';
    document.documentElement.setAttribute('data-theme', name);
    document.documentElement.style.background = '';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEMES[name].color);

    try { localStorage.setItem('sprout.theme', name); } catch (e) { /* non-fatal */ }

    renderThemeToggle();
    if (announce) UI.toast(name === 'conservatory' ? 'Conservatory — daylight' : 'Viridium — nightfall');
  }

  function toggleTheme() { setTheme(THEMES[themeName()].next, true); }

  /* The button advertises the theme you would move *to*, not the one you are
     in — a control labelled with the current state reads as a status line
     and people stop pressing it. */
  function renderThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const t = THEMES[themeName()];
    btn.innerHTML = UI.icon(t.icon) + '<span>' + UI.esc(t.label) + '</span>';
    btn.setAttribute('aria-label', 'Switch to the ' + t.label.toLowerCase() + ' theme');
  }

  /* ---------- Routing ---------- */

  function parse() {
    const raw = String(location.hash || '').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(function (s) { return s.length; });
    const name = parts[0] || 'today';
    /* An unknown view name is reported as unknown rather than quietly
       rewritten to 'today'. The old fallback made the not-found state below
       unreachable dead code, and meant a stale or mistyped link dropped you
       on the home screen with no explanation — the reader assumes the link
       was fine and that the app lost their plant. Saying "nothing here" is
       both truer and shorter to recover from. An empty hash is still Today,
       because that is the front door, not a mistake. */
    return {
      name: VIEWS[name] ? name : null,
      id: parts[1] ? decodeURIComponent(parts[1]) : null,
      extra: parts[2] ? decodeURIComponent(parts[2]) : null,
      tail: parts[3] ? decodeURIComponent(parts[3]) : null
    };
  }

  function go(path) {
    const target = '#' + (path.charAt(0) === '/' ? path : '/' + path);
    if (location.hash === target) { render(); return; }
    location.hash = target;
  }

  function back(fallback) {
    if (window.history.length > 1) window.history.back();
    else go(fallback || '/today');
  }

  /* Re-render the current route in place — used after any data change.

     `keepScroll` is the whole difference between a re-render and a
     navigation, and it matters most on Diagnose. Ticking a clue calls
     refresh(), the clue checklist sits some 1200px down a long page, and
     render() finished with an unconditional scrollTo(0, 0) — so every single
     tick threw the reader back to the top and they had to scroll the same
     1200px again to reach the next box. Fifteen clues, fifteen returns to
     the top. The same yank happened everywhere refresh() is called: marking
     a plant watered from halfway down its care tab, toggling a preference
     near the bottom of Profile, deleting a diary entry.

     Only navigation should reset the scroll, because only navigation is a
     new page. */
  function refresh() { render(true); }

  function route() { return current; }

  /* ---------- Rendering ---------- */

  function render(keepScroll) {
    current = parse();
    const view = current.name ? VIEWS[current.name]() : null;
    /* Read before the DOM is replaced. Once innerHTML is gone the document
       may be shorter than the current offset and the browser will have
       clamped scrollY on its own. */
    const wasAt = keepScroll ? window.scrollY || window.pageYOffset || 0 : 0;

    /* Views attach their click handlers straight to this element in mount()
       and never take them off again. Setting innerHTML replaces the children
       but leaves those listeners bolted to the container, so every re-render
       would stack another one — and a single tap on "watered" would write two
       log entries, then three. Swapping in a fresh, empty clone lets the old
       view's handlers die with the node they were attached to. */
    const stale = document.getElementById('view');
    const root = stale.cloneNode(false);
    stale.parentNode.replaceChild(root, stale);

    if (!view) {
      root.innerHTML = UI.empty('compass', 'Nothing here',
        'That address does not point at anything in your greenhouse.',
        '<button class="btn" data-go="/today">Back to Today</button>');
      root.querySelector('[data-go]').addEventListener('click', function () { go('/today'); });

      /* The header has to be reset by hand. Everything below this branch is
         skipped, so without these four lines the topbar would still be
         announcing whichever plant you were looking at when the bad link
         fired — a title over a not-found page, which reads like a rendering
         bug rather than a wrong turn. */
      document.getElementById('view-title').textContent = 'Not found';
      const subEl = document.getElementById('view-sub');
      subEl.textContent = '';
      subEl.hidden = true;
      document.getElementById('topbar-actions').innerHTML = '';
      document.getElementById('btn-back').hidden = false;

      renderNav();
      /* Bail out, but never leave the splash covering the app — a missing
         view is a bug the user still has to be able to navigate out of. */
      if (firstRender) { firstRender = false; dismissSplash(); }
      return;
    }

    currentView = view;
    const params = { id: current.id, extra: current.extra, tail: current.tail };

    /* Drawn rooms carry a derived light and aspect. Settle them before any
       view reads a room, so the greenhouse, the schedule and the plan can
       never disagree about the same wall. Cheap: a few polygons. */
    if (window.Plan) Plan.sync();

    // Views can bail out to another route (e.g. a deleted plant).
    if (typeof view.guard === 'function' && view.guard(params) === false) return;

    document.getElementById('view-title').textContent =
      (typeof view.title === 'function' ? view.title(params) : view.title) || '';

    const subEl = document.getElementById('view-sub');
    const sub = typeof view.sub === 'function' ? view.sub(params) : (view.sub || '');
    subEl.textContent = sub || '';
    subEl.hidden = !sub;

    const actionsEl = document.getElementById('topbar-actions');
    actionsEl.innerHTML = (typeof view.actions === 'function' ? view.actions(params) : view.actions) || '';

    const backBtn = document.getElementById('btn-back');
    const showBack = typeof view.back === 'function' ? view.back(params) : !!view.back;
    backBtn.hidden = !showBack;

    root.innerHTML = typeof view.render === 'function' ? view.render(params) : '';

    /* The view fades up as a block; its immediate children then rise in
       sequence behind it. Two layers of the same gesture at different
       scales is what separates "things appeared" from "the page composed
       itself". Views that manage their own entrance opt out with
       `stagger: false`. */
    /* Not on an in-place refresh, though. The entrance belongs to arriving
       at a page, and replaying it every time a checkbox is ticked turns a
       one-bit change into the whole screen dissolving and rising again —
       which reads as the app reloading rather than responding, and puts a
       300ms wait in front of the answer the tick was asking for. */
    if (view.stagger !== false && !keepScroll) root.classList.add('reveal');

    if (!keepScroll) {
      // Retrigger the entrance animation, which innerHTML alone will not do.
      root.style.animation = 'none';
      void root.offsetWidth;
      root.style.animation = '';
    }

    if (typeof view.mount === 'function') view.mount(root, params);

    renderNav();
    /* Navigation lands at the top; a refresh stays where the reader was.
       Set unconditionally rather than skipped when wasAt is 0, because a
       re-render can leave the browser's restored offset somewhere else
       entirely. */
    window.scrollTo(0, wasAt);

    /* Segmented controls that scroll have to be nudged to their selected key
       after every render, because innerHTML gives back a strip at scrollLeft
       0 regardless of which tab is lit. Done here rather than in each view's
       mount() on purpose: it is a property of the .tabs component, not of any
       one screen, and the two views that use it today would be two views that
       could each forget. Ordered after scrollTo so the strip's own scroll
       survives the page reset. */
    UI.syncTabScroll(root);

    if (firstRender) { firstRender = false; dismissSplash(); }
  }

  /* ---------- Splash ----------
     The splash exists to hide one specific ugliness: the wordmark is set in
     the display face, and until that file arrives it renders in the fallback
     serif at the wrong width, so the first thing the user sees is the brand
     snapping into shape. document.fonts.ready resolves once the faces are
     in, and the 1.6s ceiling means a dead network costs a moment's wait
     rather than a permanently covered app.

     It has less to cover than it used to. The display face is served from
     this origin now and precached with the shell, so it is the three Google
     faces the ceiling is really there for. */
  function dismissSplash() {
    const el = document.getElementById('splash');
    if (!el) return;

    let done = false;
    function finish() {
      el.classList.add('is-out');
      // Remove the node outright; it is fixed and would trap clicks.
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }
    /* On a first run the splash does not lift here. Onboard takes the
       element over and asks its questions on the same field, and the
       dissolve waits for the last answer; the welcome sheet follows it. */
    function lift() {
      if (done) return;
      done = true;
      if (window.Onboard && Onboard.shouldRun()) {
        Onboard.start(el, function () {
          finish();
          setTimeout(function () { ViewProfile.welcomeSheet(); }, 420);
        });
        return;
      }
      finish();
    }

    const ready = (document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();

    /* Two clocks, and the floor is the one that matters now.

       The hold used to be 420ms after the fonts resolved, which on a warm
       cache is almost immediately — and the entrance runs to about 2.1s.
       So the splash was being pulled away in the middle of its own
       animation: the last letters of SPROUT had not landed, the script was
       still half wiped, and the rule had not drawn. The screen looked
       unfinished because it *was* unfinished, every single time the cache
       was warm.

       MIN_MS is measured from when this runs rather than from fonts-ready,
       so the entrance always completes and gets a beat to be looked at
       before the dissolve starts. MAX_MS is unchanged in purpose — a dead
       network costs a moment's wait rather than a permanently covered app —
       and moved up to clear the floor. */
    const MIN_MS = 2300;
    const MAX_MS = 3600;
    const startedAt = Date.now();

    function liftAfterFloor() {
      setTimeout(lift, Math.max(0, MIN_MS - (Date.now() - startedAt)));
    }

    ready.then(liftAfterFloor);
    setTimeout(lift, MAX_MS);
  }

  /* ---------- Navigation chrome ---------- */

  function renderNav() {
    const overdue = Schedule.overdueCount();

    /* A plus rather than a count: there is nothing to tally, the point is
       that a step is missing. Rooms are what the light and humidity of every
       schedule hang off, so a greenhouse with none is the one setup gap
       worth marking on the furniture rather than waiting for the reader to
       wander into the tab and find an empty state. It clears itself the
       moment a first room exists. */
    const noRooms = !Store.get().rooms.length;

    function badge(key, cls) {
      if (key === 'today' && overdue) return '<span class="' + cls + '">' + overdue + '</span>';
      if (key === 'greenhouse' && noRooms) return '<span class="' + cls + ' is-hint">+</span>';
      return '';
    }

    document.getElementById('tabbar').innerHTML = TABS.map(function (t) {
      const on = t.key === current.name || isChildOf(t.key, current.name);
      return '<button class="tab' + (on ? ' is-active' : '') + '" data-path="' + UI.attr(t.path) + '">' +
        UI.icon(t.icon) +
        badge(t.key, 'tab-badge') +
        '<span>' + UI.esc(t.label) + '</span>' +
      '</button>';
    }).join('');

    document.getElementById('side-nav').innerHTML = TABS.map(function (t) {
      const on = t.key === current.name || isChildOf(t.key, current.name);
      return '<button class="side-link' + (on ? ' is-active' : '') + '" data-path="' + UI.attr(t.path) + '">' +
        UI.icon(t.icon) + '<span>' + UI.esc(t.label) + '</span>' +
        badge(t.key, 'side-count') +
      '</button>';
    }).join('');

    renderWeatherChip();
  }

  /* Detail routes highlight their parent tab. */
  function isChildOf(tabKey, routeName) {
    if (tabKey === 'greenhouse') return routeName === 'room' || routeName === 'plant' || routeName === 'plan';
    if (tabKey === 'discover')   return routeName === 'species';
    return false;
  }

  function renderWeatherChip() {
    const chip = document.getElementById('weather-chip');
    if (!chip) return;
    const line = Weather.currentLine();
    if (!line) { chip.hidden = true; return; }
    const loc = Store.get().profile.location;
    chip.hidden = false;
    chip.innerHTML =
      '<span class="weather-chip-ico">' + UI.icon(line.ico) + '</span>' +
      '<div class="weather-chip-body">' +
        '<div class="weather-chip-t">' + UI.deg(line.temp) + '</div>' +
        '<div class="weather-chip-l truncate">' +
          UI.esc(loc ? loc.label : line.label) +
        '</div>' +
      '</div>';
  }

  /* ---------- Weather refresh ---------- */

  function syncWeather(force) {
    const p = Store.get().profile;
    if (!p.location || !Store.get().settings.weatherSync) return;
    Weather.refresh(function (err, data, fromCache) {
      if (err) { console.warn('Weather unavailable:', err.message); return; }
      renderWeatherChip();
      /* Only redraw Today, since that is where the forecast is shown — and
         via refresh(), because the forecast arriving is an update to the
         page the reader is already on, not a move to a new one. Calling
         render() here scrolled them back to the top a second or two after
         they opened the app, for no reason they could see. */
      if (current.name === 'today' && !fromCache) refresh();
    }, force);
  }

  /* ---------- Global wiring ---------- */

  function wire() {
    // Nav (both sets of buttons live outside the view root).
    document.addEventListener('click', function (e) {
      const nav = e.target.closest && e.target.closest('[data-path]');
      if (nav) { go(nav.getAttribute('data-path')); return; }

      const act = e.target.closest && e.target.closest('#topbar-actions [data-act]');
      if (act && currentView && typeof currentView.onAction === 'function') {
        currentView.onAction(act.getAttribute('data-act'), act);
      }
    });

    document.getElementById('btn-back').innerHTML = UI.icon('back');
    document.getElementById('btn-back').addEventListener('click', function () { back('/greenhouse'); });

    // Sheet dismissal: close button, backdrop click, Escape.
    const closeBtn = document.getElementById('sheet-close');
    closeBtn.innerHTML = UI.icon('x');
    closeBtn.addEventListener('click', UI.closeSheet);

    document.getElementById('sheet-backdrop').addEventListener('click', function (e) {
      if (e.target.id === 'sheet-backdrop') UI.closeSheet();
    });

    /* The plate, not the body. UI.liftSheetActions() moves a sheet's trailing
       button row out of #sheet-body and into #sheet-foot so the primary
       action stays pinned — which put every Cancel button outside the element
       this delegate was bound to, and a click on one reached nothing. It
       looked like a dead button on one screen; it was dead on every sheet
       whose actions get lifted, which is all of them bar the confirm dialog,
       and that one only works because it binds its Cancel directly.
       #sheet contains both the body and the footer, so the row is covered
       wherever it ends up. */
    document.getElementById('sheet').addEventListener('click', function (e) {
      const cancel = e.target.closest && e.target.closest('[data-act="sheet-cancel"]');
      if (cancel) UI.closeSheet();
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    document.addEventListener('keydown', function (e) {
      /* Escape unwinds one layer at a time, outermost first. The lightbox
         listens for its own Escape so it can animate out, so all this needs
         to do is stand down while one is open rather than close the sheet
         underneath it. */
      if (e.key === 'Escape') {
        if (document.querySelector('.lightbox')) return;
        if (UI.sheetIsOpen()) UI.closeSheet();
        return;
      }

      /* Keyboard shortcuts, desktop only in practice: digits jump between
         the primary views, T switches theme. Suppressed whenever a field
         has focus or a modal is up, so typing a note never navigates. */
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (UI.sheetIsOpen()) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= TABS.length) { go(TABS[n - 1].path); return; }
      if (e.key === 't' || e.key === 'T') toggleTheme();
    });

    /* Wrapped, not passed straight in. render() now takes a keepScroll flag,
       and a listener handed the function directly would call it with the
       HashChangeEvent as its first argument — an object, therefore truthy,
       so every navigation in the app would quietly behave as an in-place
       refresh and land the reader halfway down the new page. The kind of
       bug that survives review because both halves look right on their own. */
    window.addEventListener('hashchange', function () { render(); });

    /* Another tab changed the data — pick up the change. refresh() rather
       than render(): the reader here has not asked for anything and may not
       even be looking at this tab, so their position is theirs to keep. */
    window.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf('sprout.') === 0) { Store.load(); refresh(); }
    });

    // Coming back to the tab after a while: re-check the forecast and dates.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { syncWeather(false); refresh(); }
    });
  }

  /* ---------- Service worker ----------
     Registration is impossible on file:// — attempt it only when served. */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.info('Offline caching unavailable:', err.message);
    });
  }

  /* ---------- Boot ---------- */

  function init() {
    Store.load();
    wire();
    renderThemeToggle();

    if (!location.hash) location.hash = '#/today';
    render();

    syncWeather(false);
    registerSW();
    if (window.Notify) Notify.init();

    /* Only when the introduction is not about to run: on a first run the
       splash hands over to Onboard, which opens this sheet itself at the end. */
    if (!Store.get().settings.seenWelcome && !(window.Onboard && Onboard.shouldRun())) {
      setTimeout(function () { ViewProfile.welcomeSheet(); }, 380);
    }
  }

  return {
    init: init, go: go, back: back, render: render, refresh: refresh,
    route: route, renderNav: renderNav, syncWeather: syncWeather,
    renderWeatherChip: renderWeatherChip,
    theme: themeName, setTheme: setTheme, toggleTheme: toggleTheme
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  try {
    App.init();
  } catch (e) {
    console.error(e);

    /* The splash is a fixed, opaque overlay. If init() throws before the
       first render it never gets lifted, and the failure presents as a
       frozen logo with no way past it. Tear it down by hand here so the
       error at least becomes visible and legible. */
    const splash = document.getElementById('splash');
    if (splash && splash.parentNode) splash.parentNode.removeChild(splash);

    document.getElementById('view').innerHTML =
      '<div class="empty"><span class="empty-mark">' + UI.icon('warn') + '</span>' +
      '<h3>Something went wrong</h3>' +
      '<p>' + UI.esc(e.message) + '</p>' +
      '<button class="btn btn-ghost" onclick="location.reload()">Reload</button></div>';
  }
});
