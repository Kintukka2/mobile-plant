/* ==========================================================================
   Guide — "Show me around"
   --------------------------------------------------------------------------
   The guided tour a new reader is offered on the welcome sheet, and that
   You offers again behind its question mark. Two parts:

   The hand-over. Before the first card, Sprout says what is about to
   happen while it happens: the screen deepens, Sprout blooms in, a floor
   plan of the sample home draws itself (walls, windows lit gold, each room
   filling with the light it gets, six real plants potted into their
   rooms), then the plan rushes past and the app rises underneath with the
   sample home already showing. A tap anywhere, or Skip, goes straight to
   the reveal; under reduced motion it is two lines and a crossfade.

   The tour. One card per tab (Today, Greenhouse, Discover, Diagnose), then
   the reader's own plan, where Finish the tour lets the leaves go and
   leaves them on it: the empty plan already offers its own walkthrough.
   The overlay only dims, frames and talks; every page under it is the real
   one. Back, Skip, the arrow keys and Esc work, and each mark in the row of
   tab icons on a card jumps to that page.

   The sample home is shown through Store.beginSample(), never written: the
   reader's own garden is not touched, no reminder is scheduled for a
   sample plant, and an app closed mid-tour reopens on their own plants.
   The last card, on the plan, is theirs again.

   Not to be confused with Tour (js/tour.js), the planner's own walkthrough.

   Sprout's face appears in the hand-over only, which is Sprout talking to
   the reader; the cards sit beside care data and carry none.
   ========================================================================== */

window.Guide = (function () {
  'use strict';

  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return reduce.matches; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced() ? Math.min(ms, 40) : ms); }); }

  /* The rating screen's leaves (Rate's fall()): the same colours, shape and
     flight, for the hand-over's reveal and for Finish the tour. */
  const LEAF_TOKENS = ['--emerald-glow', '--emerald-lit', '--mint', '--mint-2', '--gold', '--gold-lit'];
  function leaves(cx, cy, r, waves) {
    if (reduced() || !Element.prototype.animate) return;
    const layer = document.createElement('div');
    layer.className = 'gd-leaves';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const cs = getComputedStyle(document.documentElement);
    const colours = LEAF_TOKENS.map(function (t) { return cs.getPropertyValue(t).trim(); }).filter(Boolean);
    function wave(n) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const size = 9 + Math.random() * 9;
        const x0 = cx + Math.cos(ang) * r * 0.92 - size / 2;
        const y0 = cy + Math.sin(ang) * r * 0.92 - size / 2;
        const out = 30 + Math.random() * 90;
        const x1 = x0 + Math.cos(ang) * out, y1 = y0 + Math.sin(ang) * out - 30;
        const sway = 18 + Math.random() * 26, drop = 260 + Math.random() * 240;
        const spin = (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 360);
        const el = document.createElement('i');
        el.style.width = el.style.height = size + 'px';
        el.style.background = colours[Math.floor(Math.random() * colours.length)];
        layer.appendChild(el);
        const pos = function (x, y, rot, sc) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + sc + ')'; };
        el.animate([
          { transform: pos(x0, y0, 0, 0.3), opacity: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
          { transform: pos(x1, y1, spin * 0.25, 1), opacity: 1, offset: 0.22, easing: 'ease-in-out' },
          { transform: pos(x1 + sway, y1 + drop * 0.35, spin * 0.5, 1), opacity: 1, offset: 0.5, easing: 'ease-in-out' },
          { transform: pos(x1 - sway, y1 + drop * 0.7, spin * 0.78, 0.95), opacity: 0.85, offset: 0.78, easing: 'ease-in' },
          { transform: pos(x1 + sway * 0.4, y1 + drop, spin, 0.9), opacity: 0 }
        ], { duration: 2600 + Math.random() * 1600, delay: Math.random() * 160, fill: 'both' }).onfinish = function () { el.remove(); };
      }
    }
    waves.forEach(function (n, k) { setTimeout(function () { wave(n); }, k * 220); });
    setTimeout(function () { layer.remove(); }, 4800);
  }

  /* ======================================================================
     The sample home
     ====================================================================== */

  /* Four rooms and six plants, dated so Today has real jobs on it: two
     waterings due now, a few coming up. Built on the reader's own profile
     (name, pets, hemisphere), so seasons and pet warnings read as theirs. */
  const DUE = { 'demo-monstera': 0, 'demo-pothos': 0, 'demo-calathea': 1, 'demo-fig': 2, 'demo-lily': 3, 'demo-snake': 6 };

  function sampleState() {
    const s = JSON.parse(JSON.stringify(Store.get()));
    const south = Store.hemisphere() === 'south';
    function ago(n) { return UI.toISO(UI.addDays(UI.today(), -n)); }
    function plant(id, speciesId, roomId, o) {
      return Object.assign({
        id: id, speciesId: speciesId, nickname: '', roomId: roomId, pos: null,
        acquired: ago(200), potCm: 15, potMaterial: 'plastic', drainage: 'good',
        potPending: false, coverPhotoId: null, lastWatered: ago(3),
        lastFertilised: ago(9), lastRepotted: null, waterOffset: 0,
        archived: false, createdAt: ago(200)
      }, o || {});
    }
    s.rooms = [
      { id: 'demo-living', name: 'Living room', icon: 'sofa', light: 'bright-indirect', aspect: south ? 'N' : 'S', humid: 'medium', notes: '', shape: null },
      { id: 'demo-bed', name: 'Bedroom', icon: 'bed', light: 'medium', aspect: 'E', humid: 'medium', notes: '', shape: null },
      { id: 'demo-bath', name: 'Bathroom', icon: 'bath', light: 'low', aspect: null, humid: 'high', notes: '', shape: null },
      { id: 'demo-kitchen', name: 'Kitchen', icon: 'hob', light: 'direct', aspect: south ? 'NW' : 'SW', humid: 'medium', notes: '', shape: null }
    ];
    s.plants = [
      plant('demo-monstera', 'monstera-deliciosa', 'demo-living', { nickname: 'Monty', potCm: 24, potMaterial: 'terracotta' }),
      plant('demo-pothos', 'epipremnum-aureum', 'demo-bath', { potCm: 14 }),
      plant('demo-fig', 'ficus-lyrata', 'demo-living', { potCm: 30 }),
      plant('demo-lily', 'spathiphyllum-wallisii', 'demo-bed', { potCm: 17, potMaterial: 'glazed' }),
      plant('demo-snake', 'dracaena-trifasciata', 'demo-bed', { potCm: 20, potMaterial: 'terracotta' }),
      plant('demo-calathea', 'calathea-orbifolia', 'demo-bath', { potCm: 16 })
    ];
    s.logs = [
      { id: 'demo-l1', plantId: 'demo-monstera', date: ago(12), kind: 'note', text: 'New leaf unfurling, the first with holes.' },
      { id: 'demo-l2', plantId: 'demo-fig', date: ago(20), kind: 'water' },
      { id: 'demo-l3', plantId: 'demo-calathea', date: ago(4), kind: 'note', text: 'Two lower leaves going yellow.' }
    ];
    s.plan = Object.assign({}, s.plan, { north: null, northConfirmed: false, backdrop: null, done: false });
    s.weather = null;
    s.settings = Object.assign({}, s.settings, {
      onboarded: true, seenWelcome: true, dismissed: [],
      /* The location and reminder asks belong to the reader's own garden. */
      locationAsk: UI.toISO(UI.addDays(UI.today(), 60))
    });
    return s;
  }

  function showSample() {
    if (Store.inSample()) return;
    Store.beginSample(sampleState());
    /* Dates are set after it is showing, from the real intervals, so "due
       today" is due today whatever the season and hemisphere make them. */
    Object.keys(DUE).forEach(function (id) {
      const p = Store.getPlant(id);
      const iv = p && Schedule.wateringInterval(p);
      if (!iv || iv.resting) return;
      p.lastWatered = UI.toISO(UI.addDays(UI.today(), DUE[id] - iv.days));
    });
  }
  function hideSample() { Store.endSample(); }

  /* ======================================================================
     The hand-over
     ====================================================================== */

  /* The sample home as drawn: the same rooms and plants as above, so what
     the reader watches being built is what the tour then shows.
     Coordinates are in the plan's own 300 × 220 box. */
  const ROOMS = [
    { name: 'Living room', x: 6,   y: 6,   w: 164, h: 114, light: 'bright' },
    { name: 'Kitchen',     x: 170, y: 6,   w: 124, h: 114, light: 'direct' },
    { name: 'Bedroom',     x: 6,   y: 120, w: 174, h: 94,  light: 'medium' },
    { name: 'Bathroom',    x: 180, y: 120, w: 114, h: 94,  light: 'low' }
  ];
  const POTS = [
    { sp: 'monstera-deliciosa',     x: 52,  y: 70 },
    { sp: 'ficus-lyrata',           x: 118, y: 52 },
    { sp: 'spathiphyllum-wallisii', x: 54,  y: 170 },
    { sp: 'dracaena-trifasciata',   x: 120, y: 182 },
    { sp: 'epipremnum-aureum',      x: 208, y: 180 },
    { sp: 'calathea-orbifolia',     x: 258, y: 158 }
  ];
  /* Walls with a gap for each door, so it reads as a home and not a grid. */
  const WALLS = 'M170 6V58M170 84V120M6 120H64M92 120H206M232 120H294M180 120V150M180 176V214';
  const WINDOWS = ['M34 6H112', 'M196 6H262', 'M294 34V86', 'M6 146V192', 'M234 214H266'];

  let hand = null, skipped = false, wake = null;

  function hold(ms) {
    if (skipped) return Promise.resolve();
    return new Promise(function (r) { const t = setTimeout(r, ms); wake = function () { clearTimeout(t); r(); }; });
  }
  function anim(el, frames, opts) {
    if (!el || skipped || !el.animate) return Promise.resolve();
    const a = el.animate(frames, Object.assign({ fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)' }, opts));
    return a.finished.catch(function () {});
  }

  function planSVG() {
    return '<svg class="gdi-plan" viewBox="0 0 300 220" aria-hidden="true">' +
      ROOMS.map(function (r) {
        return '<rect class="gdi-fill is-' + r.light + '" x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '"/>';
      }).join('') +
      '<path class="gdi-wall gdi-outer" pathLength="1" d="M6 6H294V214H6Z"/>' +
      '<path class="gdi-wall gdi-inner" pathLength="1" d="' + WALLS + '"/>' +
      WINDOWS.map(function (d) { return '<path class="gdi-win" pathLength="1" d="' + d + '"/>'; }).join('') +
      ROOMS.map(function (r) {
        return '<text class="gdi-label" x="' + (r.x + 10) + '" y="' + (r.y + 18) + '">' + UI.esc(r.name.toUpperCase()) + '</text>';
      }).join('') +
    '</svg>';
  }

  /* Placed against the drawing, which sits 8px in from the card's edge. */
  function potsHTML() {
    return POTS.map(function (p) {
      return '<span class="gdi-pot" style="left:calc(8px + (100% - 16px) * ' + (p.x / 300).toFixed(4) + ');' +
        'top:calc(8px + (100% - 16px) * ' + (p.y / 220).toFixed(4) + ')">' +
        '<img src="' + UI.attr(Store.speciesPhoto(p.sp)) + '" alt=""></span>';
    }).join('');
  }

  function mountHand() {
    hand = document.createElement('div');
    hand.className = 'gdi';
    hand.setAttribute('role', 'dialog');
    hand.setAttribute('aria-live', 'polite');
    hand.setAttribute('aria-label', 'Building a sample home');
    hand.innerHTML =
      '<div class="gdi-ground"></div>' +
      '<div class="gdi-cast">' +
        '<div class="gdi-faces">' + UI.sprout('base', 'gdi-face is-a') + UI.sprout('home-planner', 'gdi-face is-b') + '</div>' +
        '<p class="gdi-say"></p>' +
        '<p class="gdi-sub"></p>' +
        '<div class="gdi-stage">' + planSVG() + potsHTML() + '</div>' +
        '<p class="gdi-status"></p>' +
      '</div>' +
      '<button type="button" class="gdi-skip">Skip</button>';
    document.body.appendChild(hand);
    hand.addEventListener('click', skipHand);
    hand.addEventListener('keydown', function (e) { if (e.key === 'Escape') skipHand(); });
  }

  function skipHand() {
    if (skipped || !hand) return;
    skipped = true;
    hand.querySelectorAll('*').forEach(function (el) { if (el.getAnimations) el.getAnimations().forEach(function (a) { a.finish(); }); });
    if (wake) wake();
  }

  /* Words arrive one at a time, each rising out of a blur, so the line is
     read at the pace it is said. */
  function sayWords(el, text, gap) {
    el.innerHTML = text.split(' ').map(function (w) { return '<span class="gdi-w">' + UI.esc(w) + '</span>'; }).join(' ');
    const words = el.querySelectorAll('.gdi-w');
    words.forEach(function (w, i) {
      anim(w, [{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
        { duration: 620, delay: i * gap });
    });
    return hold(words.length * gap + 620);
  }

  function status(text) {
    const el = hand.querySelector('.gdi-status');
    if (skipped) { el.textContent = text; return Promise.resolve(); }
    return anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in' }).then(function () {
      el.textContent = text;
      return anim(el, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
    });
  }

  async function handOver() {
    skipped = false;
    mountHand();
    const ground = hand.querySelector('.gdi-ground');
    const faceA = hand.querySelector('.gdi-face.is-a'), faceB = hand.querySelector('.gdi-face.is-b');
    const say = hand.querySelector('.gdi-say'), sub = hand.querySelector('.gdi-sub');
    const stage = hand.querySelector('.gdi-stage');

    if (reduced()) {
      say.textContent = 'Let me show you what Sprout is about.';
      sub.textContent = 'I\'ll build a sample home with a few plants, then give you a quick tour.';
      hand.classList.add('is-still');
      showSample();
      await new Promise(function (r) { setTimeout(r, 2600); });
      return reveal();
    }

    /* The ground deepens, and Sprout blooms in. */
    anim(ground, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
    anim(hand.querySelector('.gdi-skip'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 900 });
    await hold(260);
    await anim(faceA, [
      { opacity: 0, transform: 'scale(.55) translateY(24px)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'scale(1.06) translateY(-4px)', filter: 'blur(0)', offset: 0.7 },
      { opacity: 1, transform: 'none', filter: 'blur(0)' }
    ], { duration: 900 });
    await sayWords(say, 'Let me show you what Sprout is about.', 95);
    await hold(900);

    /* The planner's face crossfades in, the line steps out of the way, and
       the plan begins to draw. The sample home goes in now, behind an
       opaque ground, so the reveal never shows a page half-built. */
    showSample();
    anim(faceA, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in-out' });
    anim(faceB, [{ opacity: 0, transform: 'rotate(-6deg) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 520 });
    hand.classList.add('is-building');
    anim(say, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 360, easing: 'ease-in' });
    await hold(260);
    say.style.display = 'none';
    anim(stage, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600 });
    await sayWords(sub, 'I\'ll build a sample home with a few plants, then give you a quick tour.', 70);

    status('Drawing the rooms');
    await anim(stage.querySelector('.gdi-outer'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)' });
    await anim(stage.querySelector('.gdi-inner'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)' });
    stage.querySelectorAll('.gdi-label').forEach(function (t, i) {
      anim(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: i * 90 });
    });

    status('Letting the light in');
    stage.querySelectorAll('.gdi-win').forEach(function (w, i) {
      anim(w, [{ strokeDashoffset: 1, opacity: 0.3 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 420, delay: i * 110, easing: 'ease-out' });
    });
    await hold(380);
    stage.querySelectorAll('.gdi-fill').forEach(function (r, i) {
      anim(r, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: i * 140, easing: 'ease-out' });
    });
    await hold(900);

    status('Potting six plants');
    stage.querySelectorAll('.gdi-pot').forEach(function (p, i) {
      anim(p, [
        { opacity: 0, transform: 'translate(-50%,-50%) scale(0) rotate(-20deg)' },
        { opacity: 1, transform: 'translate(-50%,-50%) scale(1.18) rotate(4deg)', offset: 0.6 },
        { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(0)' }
      ], { duration: 560, delay: i * 170 });
    });
    await hold(6 * 170 + 520);
    await status('All set');
    await hold(650);
    return reveal();
  }

  /* The plan rushes past, the ground lifts, leaves go up, and Today rises
     underneath on its own entrance, already holding the sample home. */
  async function reveal() {
    skipped = false;
    showSample();
    if (location.hash !== '#/today') App.go('/today'); else App.render();
    window.scrollTo(0, 0);
    hand.style.pointerEvents = 'none';
    anim(hand.querySelector('.gdi-skip'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    leaves(innerWidth / 2, innerHeight * 0.52, 40, [36]);
    anim(hand.querySelector('.gdi-cast'), [{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(1.9)', filter: 'blur(8px)' }],
      { duration: reduced() ? 300 : 820, easing: 'cubic-bezier(.65,0,.35,1)' });
    await anim(hand.querySelector('.gdi-ground'), [{ opacity: 1 }, { opacity: 0 }],
      { duration: reduced() ? 400 : 900, delay: reduced() ? 0 : 160, easing: 'ease-in-out' });
    hand.remove(); hand = null;
    start(true);
  }

  /* ======================================================================
     The tour
     ====================================================================== */

  function find(sel) { return typeof sel === 'function' ? sel() : document.querySelector(sel); }
  function visible(el) { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  async function waitFor(sel, ms) {
    const until = Date.now() + (ms || 3000);
    while (Date.now() < until) {
      const el = find(sel);
      if (visible(el)) return el;
      await new Promise(function (r) { setTimeout(r, 60); });
    }
    return null;
  }
  function frameTick() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }

  /* Scrolls and resolves once the page has stopped moving, rather than
     after a guessed delay: lighting a target before a smooth scroll lands
     is what made the light chase the page. */
  async function scrollToY(y) {
    y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    if (Math.abs(window.scrollY - y) < 3) return;
    window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
    let last = -1, still = 0;
    const until = Date.now() + 1400;
    await frameTick(); await frameTick();
    while (Date.now() < until && still < 4) {
      const now = window.scrollY;
      still = Math.abs(now - last) < 0.5 ? still + 1 : 0;
      last = now;
      await frameTick();
    }
  }
  function pinned(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  }
  function scrollToEl(el, maxH) {
    /* The tab bar does not scroll, so scrolling to it only moves the page. */
    if (pinned(el)) return Promise.resolve();
    const r = el.getBoundingClientRect();
    /* A tall target is lit from its top, under the title bar, so the card
       has the rest of the screen below it. */
    const y = maxH ? r.top + window.scrollY - 128 : r.top + window.scrollY - (innerHeight - r.height) / 2;
    return scrollToY(y);
  }

  /* A page change is a cross-fade: the old page fades out, the route
     changes, and the new one comes in on the app's own entrance. */
  function veil(on) {
    const v = document.getElementById('view');
    if (!v) return Promise.resolve();
    if (on) {
      v.style.transition = 'opacity 150ms var(--ease-io)';
      v.style.opacity = '0';
      return wait(160);
    }
    v.style.transition = 'none'; v.style.opacity = '';
    void v.offsetWidth; v.style.transition = '';
    return Promise.resolve();
  }
  function navigated(ms) {
    return new Promise(function (r) {
      let done = false;
      function fin() {
        if (done) return; done = true;
        window.removeEventListener('hashchange', fin);
        frameTick().then(r);
      }
      window.addEventListener('hashchange', fin);
      setTimeout(fin, ms || 600);
    });
  }
  async function crossfade(act) {
    await veil(true);
    const nav = navigated();
    const before = location.hash;
    act();
    /* App.go renders in place when the route is already showing, so only a
       real route change has to be waited for. */
    if (location.hash !== before) await nav;
    window.scrollTo(0, 0);
    await veil(false);
  }
  function goto(path, extra) {
    return crossfade(function () { if (extra) extra(); App.go(path); });
  }

  function sectionTitled(text) {
    const h = [].slice.call(document.querySelectorAll('#view .section-title')).filter(function (x) {
      return x.textContent.trim().toLowerCase().indexOf(text) === 0;
    })[0];
    return h ? h.closest('.section') : null;
  }
  function tab(path) {
    return document.querySelector('#tabbar .tab[data-path="' + path + '"]') ||
           document.querySelector('#side-nav [data-path="' + path + '"]');
  }

  let root = null, hole = null, card = null, finger = null, chip = null;
  let at = -1, token = 0, current = null, capH = null, trackT = 0;

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'gd is-on';
    root.innerHTML = '<div class="gd-block"></div><div class="gd-hole is-none"></div>' +
      '<div class="gd-card is-out" role="dialog" aria-live="polite" aria-label="Guided tour"></div>' +
      '<div class="gd-finger" aria-hidden="true"></div>' +
      '<div class="gd-chip" aria-live="polite"></div>';
    document.body.appendChild(root);
    hole = root.querySelector('.gd-hole');
    card = root.querySelector('.gd-card');
    finger = root.querySelector('.gd-finger');
    chip = root.querySelector('.gd-chip');
    card.addEventListener('click', onCard);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', reframe);
    window.addEventListener('scroll', reframe, true);
  }
  function unmount() {
    if (!root) return;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', reframe);
    window.removeEventListener('scroll', reframe, true);
    root.remove();
    root = hole = card = finger = chip = null;
    current = null;
  }

  function frame(el, pad, maxH) {
    current = el || null;
    capH = maxH || null;
    if (!el) {
      hole.classList.add('is-none');
      hole.style.left = '50%'; hole.style.top = '50%'; hole.style.width = '0px'; hole.style.height = '0px';
      return;
    }
    hole.classList.remove('is-open');
    const p = pad == null ? 8 : pad;
    const r = el.getBoundingClientRect();
    const top = Math.max(6, r.top - p), left = Math.max(6, r.left - p);
    const end = maxH ? Math.min(r.bottom, r.top + maxH) : r.bottom;
    const bottom = Math.min(innerHeight - 6, end + p), right = Math.min(innerWidth - 6, r.right + p);
    hole.classList.remove('is-none');
    hole.style.left = left + 'px'; hole.style.top = top + 'px';
    hole.style.width = Math.max(0, right - left) + 'px'; hole.style.height = Math.max(0, bottom - top) + 'px';
    hole.dataset.pad = p;
  }
  /* The whole screen lit, with no ring, so a page is seen whole. */
  function openFull() {
    current = null;
    hole.classList.remove('is-none');
    hole.classList.add('is-open');
    hole.style.left = '0px'; hole.style.top = '0px';
    hole.style.width = innerWidth + 'px'; hole.style.height = innerHeight + 'px';
  }
  /* The card docks to whichever side of the lit window has room. */
  function place() {
    card.classList.remove('is-center');
    card.style.top = '';
    if (!current) { card.classList.add('is-center'); return; }
    const h = card.offsetHeight, vh = innerHeight, gap = 14;
    const below = vh - (parseFloat(hole.style.top) + parseFloat(hole.style.height));
    const above = parseFloat(hole.style.top);
    let top;
    if (below >= h + gap * 2 && below >= above) top = vh - below + gap;
    else if (above >= h + gap * 2) top = above - gap - h;
    else top = below > above ? vh - h - gap : gap;          // nothing fits: dock and overlap
    card.style.top = Math.max(gap, Math.min(vh - h - gap, top)) + 'px';
  }
  function reframe() {
    if (!root || !current || !current.isConnected) return;
    hole.classList.add('is-track');
    frame(current, Number(hole.dataset.pad), capH);
    clearTimeout(trackT);
    trackT = setTimeout(function () { if (hole) hole.classList.remove('is-track'); }, 160);
  }

  /* The fingertip comes in from just below the control as it fades up,
     moving with the light, and both arrive together. */
  function fingerTo(el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (!finger.classList.contains('is-on')) {
      finger.classList.add('is-snap');
      finger.style.transform = 'translate(' + x + 'px,' + (y + 44) + 'px)';
      void finger.offsetWidth;
      finger.classList.remove('is-snap');
    }
    finger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    finger.classList.add('is-on');
  }
  /* The tab is lit and pressed where the reader can see it, then the new
     page cross-fades in and is shown whole, with its name, before the light
     closes in on the part the card explains. */
  async function arrive(label) {
    openFull();
    chip.textContent = label;
    chip.classList.add('is-on');
    await wait(800);
    chip.classList.remove('is-on');
  }
  async function goTab(path, target, label) {
    const t = tab(path);
    if (t && location.hash !== '#' + path) {
      frame(t, 6);
      fingerTo(t);
      await wait(560);
      finger.classList.add('is-press');
      await wait(160);
      await crossfade(function () { t.click(); });
      finger.classList.remove('is-press');
    } else {
      await goto(path);
    }
    finger.classList.remove('is-on');
    await waitFor(target);
    await arrive(label);
    return waitFor(target);
  }

  const PAGES = [
    { key: 'today', ico: 'home', label: 'Today' }, { key: 'greenhouse', ico: 'leaf', label: 'Greenhouse' },
    { key: 'discover', ico: 'search', label: 'Discover' }, { key: 'diagnose', ico: 'stethoscope', label: 'Diagnose' },
    { key: 'plan', ico: 'grid', label: 'Your plan' }
  ];
  function label(key) { return PAGES.filter(function (p) { return p.key === key; })[0].label; }

  let fromHandOver = false;
  const STOPS = [
    {
      page: 'today', title: 'What needs doing today', maxH: 300,
      body: 'Every watering and feed that\'s due, worked out for each plant from its species, pot, room and the season. Tick a job off and the next date sets itself.',
      before: async function () {
        /* After the hand-over, Today is already up with the sample home on
           it; from a jump back, it has to be brought back. */
        if (fromHandOver) { fromHandOver = false; await wait(500); }
        else await goto('/today', showSample);
        await arrive('Today');
      },
      target: function () { return sectionTitled('needs you') || document.querySelector('.greeting-card'); }
    },
    {
      page: 'greenhouse', title: 'Every plant, room by room', maxH: 300,
      body: 'I can calculate the light level of each room, most accurately from the planner. That helps me figure out what each plant needs. Move a plant and I\'ll update its care schedule.',
      before: function () { showSample(); return goTab('/greenhouse', '#view .grid-rooms', 'Greenhouse'); },
      target: '#view .grid-rooms'
    },
    {
      page: 'discover', maxH: 300,
      title: function () { return window.PLANT_DATA.length + ' plants, each with a care sheet'; },
      body: 'Light, water, feeding, toxicity and propagation for every plant. Suggestions are based on you and your rooms.',
      before: function () { showSample(); return goTab('/discover', '#dc-recs', 'Discover'); },
      target: '#dc-recs'
    },
    {
      page: 'diagnose', title: 'Plant looking sick?', maxH: 300,
      body: 'Pick a plant and tell me what you can see. Then I\'ll tell you the likely causes, with the steps to fix each one.',
      before: function () { showSample(); return goTab('/diagnose', '#view .stack', 'Diagnose'); },
      target: '#view .stack'
    },
    {
      /* The reader's own plan: the sample goes as the page changes. One way
         out, because the empty plan behind the card already offers its own
         walkthrough and tracing, so the tour steps aside and leaves the
         reader on it. */
      page: 'plan', title: 'Let\'s get started', last: true,
      body: 'Now that I\'ve shown you what you can do in Sprout, let\'s get you started. I work best when you map out your home in my planner. Draw your rooms and mark the windows, and I\'ll work out how much light each room gets and where each plant will thrive.',
      before: async function () {
        await goto('/plan', hideSample);
        await waitFor('#view .plan-main');
        await arrive('Your plan');
      },
      target: '#view .plan-main', maxH: 420,
      next: 'Finish the tour'
    }
  ];

  function routeStrip(s) {
    const i = PAGES.map(function (p) { return p.key; }).indexOf(s.page);
    return '<div class="gd-route">' + PAGES.map(function (p, k) {
      return '<button type="button" class="gd-r' + (k === i ? ' is-on' : k < i ? ' is-done' : '') + '" data-gd="go" data-gd-page="' + p.key + '" ' +
        'aria-label="' + UI.attr(p.label) + '"' + (k === i ? ' aria-current="step"' : '') + '>' + UI.icon(p.ico) + '</button>' +
        (PAGES[k + 1] && PAGES[k + 1].key === 'plan' ? '<span class="gd-route-gap"></span>' : '');
    }).join('') + '</div>';
  }

  function render(s, i) {
    const title = typeof s.title === 'function' ? s.title() : s.title;
    card.innerHTML =
      routeStrip(s) +
      '<div class="gd-count">' + UI.esc(label(s.page) + ' · ' + (i + 1) + ' of ' + STOPS.length) + '</div>' +
      '<h3 class="gd-title">' + UI.esc(title) + '</h3>' +
      '<p class="gd-body">' + UI.esc(s.body) + '</p>' +
      (s.last
        ? '<div class="gd-bar is-finish"><button class="btn btn-sm" data-gd="next">' + UI.esc(s.next) + '</button></div>'
        : '<div class="gd-bar">' +
            '<button class="gd-skip" data-gd="skip">Skip</button><span class="grow"></span>' +
            (i > 0 ? '<button class="btn btn-ghost btn-sm" data-gd="back">Back</button>' : '') +
            '<button class="btn btn-sm" data-gd="next">Next</button>' +
          '</div>') +
      '<div class="gd-meter"><i style="width:' + Math.round((i / (STOPS.length - 1)) * 100) + '%"></i></div>';
  }

  /* One thing at a time, each overlapping the next a little: the card
     leaves, the page moves, the light settles, and the card comes back
     while the light is still landing. */
  async function show(i) {
    const my = ++token;
    at = i;
    const s = STOPS[i];
    card.classList.add('is-out');
    await wait(150);
    if (my !== token) return;
    await s.before();
    if (my !== token) return;
    const el = await waitFor(s.target);
    if (el) await scrollToEl(el, s.maxH);
    if (my !== token) return;
    frame(el, s.pad, s.maxH);
    render(s, i);
    place();
    await wait(el ? 260 : 80);
    if (my !== token) return;
    hole.classList.remove('is-pulse'); void hole.offsetWidth; if (el) hole.classList.add('is-pulse');
    card.classList.remove('is-out');
  }

  function next() {
    if (STOPS[at].last) {
      leaves(innerWidth / 2, innerHeight * 0.4, Math.min(innerWidth, 420) * 0.3, [54, 26]);
      finish();
      return;
    }
    show(at + 1);
  }
  function back() { if (at > 0) show(at - 1); }
  function skip() { show(STOPS.length - 1); }
  function jump(page) {
    const i = STOPS.map(function (x) { return x.page; }).indexOf(page);
    if (i >= 0 && i !== at) show(i);
  }

  function finish() {
    token++;
    const wasSample = Store.inSample();
    hideSample();
    unmount();
    if (wasSample) App.render();
  }

  function onCard(e) {
    const b = e.target.closest('[data-gd]');
    if (!b) return;
    const a = b.getAttribute('data-gd');
    if (a === 'next') next();
    else if (a === 'back') back();
    else if (a === 'skip') skip();
    else if (a === 'go') jump(b.getAttribute('data-gd-page'));
  }
  /* Esc goes to the last card rather than closing, so the reader is never
     left on a page of somebody else's plants; on the last card it ends. */
  function onKey(e) {
    if (!root) return;
    if (e.key === 'Escape') { if (STOPS[at].last) finish(); else skip(); }
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') back();
    else return;
    e.stopPropagation(); e.preventDefault();
  }

  function start(afterHandOver) {
    if (UI.sheetIsOpen && UI.sheetIsOpen()) UI.closeSheet();
    fromHandOver = !!afterHandOver;
    mount();
    show(0);
  }

  /* ======================================================================
     Ways in
     ====================================================================== */

  /* Show me around: the hand-over, which starts the tour when it lands. */
  function play() {
    if (hand || root) return;
    handOver();
  }

  /* From You's question mark. It asks first, because the tour shows a
     sample home for its length. */
  function offer() {
    UI.openSheet('Take the tour again?',
      '<p class="muted" style="margin:0 0 18px;line-height:1.6">I\'ll show you round each tab on a sample home, then bring your own plants back.</p>' +
      '<div class="stack" style="gap:8px">' +
        '<button class="btn btn-lg" id="gd-again">Show me around</button>' +
        '<button class="btn btn-ghost" id="gd-not">Not now</button>' +
      '</div>',
      function (sheet) {
        sheet.querySelector('#gd-again').addEventListener('click', function () {
          UI.closeSheet();
          setTimeout(play, 260);
        });
        sheet.querySelector('#gd-not').addEventListener('click', function () { UI.closeSheet(); });
      });
  }

  return { play: play, offer: offer, isOn: function () { return !!(hand || root); } };
})();
