/* ==========================================================================
   Sprout — the rating screen
   --------------------------------------------------------------------------
   One full screen that asks for a store rating, and nothing else. Built on
   the Spot Me rating screen in the UI-Design repo: the same order of parts
   (a line, five stars in laurels, the face inside a ring that fills, one
   button at the foot) and the same two-tap flow, redrawn in the house
   materials. The laurels are monoline, in the mark's own stroke; the stars
   are champagne, the one metallic; the ring is a frame around the plate,
   because the character is always framed.

   Nothing opens this yet. Where it appears and how often is a separate
   decision, so for now it is reached by hand: `Rate.open()` from the
   console, or `?rate` on the URL, which app.js reads on boot.

   The ask itself is the platform's. A store only lets an app *request* its
   review sheet, and both stores decide on their own whether to show it,
   quietly and without saying so. So the first tap asks, the screen thanks
   the reader either way, and a quiet link to the store page stays under the
   button for the times the sheet never came. There is deliberately no
   "are you enjoying Sprout?" step in front of the button: both stores'
   review guidelines forbid asking for an opinion before offering the
   rating, and a screen that only shows the stars to the happy ones is the
   kind of thing that gets a listing pulled.
   ========================================================================== */

window.Rate = (function () {
  'use strict';

  const PLAY_ID = 'com.sproutevergreen.app';
  /* Not on the App Store yet. When it is, its numeric id goes here and the
     store link turns on for iPhone readers by itself. */
  const APP_STORE_ID = null;

  const POSE = 'new-growth';
  const RESTING = 0.8;            // how full the frame sits before the tap

  /* The frame, drawn in a 300 box clockwise from the top centre, so the
     unfilled fifth is the stretch just left of the top and the badge rests
     at the top-left corner, where Spot Me keeps its heart. */
  const FRAME = 'M150 6H264A30 30 0 0 1 294 36V264A30 30 0 0 1 264 294H36A30 30 0 0 1 6 264V36A30 30 0 0 1 36 6H150';

  /* One laurel branch: the stem, then each leaf as [x, y, angle, length,
     half-width], bottom to top, which is also the order they draw in. */
  const STEM = 'M136.1 247.0Q123.1 243.0 118.1 235.0L111.0 233.8L104.1 232.0L97.3 229.8L90.7 227.1L84.3 223.9L78.1 220.2L72.2 216.2L66.7 211.7L61.4 206.8L56.5 201.6L52.0 196.0L47.9 190.2L44.3 184.0L41.1 177.6L38.3 171.0L36.1 164.2L34.3 157.3L33.0 150.3L32.3 143.1L32.0 136.0L32.3 128.9L33.0 121.7L34.3 114.7L36.1 107.8L38.3 101.0L41.1 94.4L44.3 88.0L47.9 81.8L52.0 76.0L56.5 70.4L61.4 65.2L66.7 60.3L72.2 55.8L78.1 51.8L84.3 48.1L90.7 44.9L97.3 42.2L104.1 40.0L111.0 38.2L118.1 37.0';
  const LEAVES = [
    [106.9, 232.8, -207.4, 39, 10], [97.3, 229.8, -119.7, 33, 9],
    [78.7, 220.6, -189.8, 40, 11],  [70.5, 214.9, -102.1, 33, 9],
    [55.6, 200.5, -172.2, 41, 11],  [49.5, 192.6, -84.4, 34, 9],
    [39.6, 174.3, -154.6, 42, 11],  [36.3, 164.9, -66.8, 35, 9],
    [32.4, 144.6, -136.9, 43, 11],  [32.0, 134.6, -49.2, 36, 9],
    [34.5, 114.0, -119.3, 44, 12],  [37.1, 104.4, -31.6, 37, 10],
    [45.7, 85.5, -101.7, 45, 12],   [51.2, 77.1, -13.9, 38, 10],
    [65.0, 61.7, -84.0, 46, 12],    [72.8, 55.4, 3.7, 38, 10],
    [90.7, 44.9, -66.4, 47, 12],    [100.0, 41.3, 21.3, 39, 10],
    [118.1, 37.0, -8.0, 48, 13]
  ];
  const STAR = 'M0 -40L10.6 -14.6L38 -12.4L17.1 5.6L23.5 32.4L0 18L-23.5 32.4L-17.1 5.6L-38 -12.4L-10.6 -14.6Z';

  /* The four greens and both champagnes, so the falling leaves are the
     palette and nothing else. Read from the cascade, not written out, so
     Conservatory's deeper greens fall in Conservatory. */
  const LEAF_TOKENS = ['--emerald-glow', '--emerald-lit', '--mint', '--mint-2', '--gold', '--gold-lit'];

  const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  let root = null, opts = {}, asked = false, raf = 0, timers = [], returnFocus = null;

  /* ---------- Copy ---------- */

  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  function count(n, one, many) {
    return (n < WORDS.length ? WORDS[n] : String(n)) + ' ' + (n === 1 ? one : many);
  }

  /* What the two of them have done together, as a fact rather than a
     compliment: a reader reminded of six plants and forty waterings has
     already decided how they feel before the button asks. */
  function tally() {
    const plants = Store.activePlants().length;
    const waters = Store.get().logs.filter(function (l) { return l.kind === 'water'; }).length;
    if (!plants) return 'A small favour';
    return count(plants, 'plant', 'plants') + (waters ? ' · ' + count(waters, 'watering', 'waterings') : ' and counting');
  }

  function name() { return (Store.get().profile.name || '').trim(); }

  function askText() {
    const n = name();
    return (n ? UI.esc(n) + ', a' : 'A') + ' rating is how other plant people find me. It takes a moment, and it means more than you\'d think.';
  }

  function thanksTitle() {
    const n = name();
    return 'Thank you' + (n ? ', ' + UI.esc(n) : '');
  }

  const THANKS_TEXT = 'That helps more than you know, and I\'ll be right here with your plants.';

  /* ---------- Store ---------- */

  function platform() {
    const C = window.Capacitor;
    if (C && C.getPlatform) return C.getPlatform();
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'web';
  }

  function storeUrl() {
    const p = platform();
    if (p === 'android') return 'https://play.google.com/store/apps/details?id=' + PLAY_ID;
    if (p === 'ios' && APP_STORE_ID) return 'https://apps.apple.com/app/id' + APP_STORE_ID + '?action=write-review';
    return null;
  }

  /* The in-app sheet where the shell carries the plugin for it
     (@capacitor-community/in-app-review registers as InAppReview), and the
     store page where it does not. A browser has neither, and gets the
     thanks without the ask. */
  function requestReview() {
    const plugins = window.Capacitor && Capacitor.Plugins;
    const review = plugins && plugins.InAppReview;
    if (review && review.requestReview) {
      review.requestReview().catch(function () { openStore(); });
      return;
    }
    if (platform() !== 'web') openStore();
  }

  function openStore() {
    const url = storeUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  /* ---------- Drawing ---------- */

  function leaf(l, i) {
    const len = l[3], hw = l[4], a = (len * 0.26).toFixed(1), b = (len * 0.77).toFixed(1);
    return '<path class="rate-leaf" pathLength="1" style="--i:' + i + '" transform="translate(' + l[0] + ' ' + l[1] + ') rotate(' + l[2] + ')" ' +
      'd="M0 0C' + a + ' ' + -hw + ' ' + b + ' ' + -hw + ' ' + len + ' 0C' + b + ' ' + hw + ' ' + a + ' ' + hw + ' 0 0Z"/>';
  }

  function laurel() {
    const branch = '<path class="rate-stem" pathLength="1" d="' + STEM + '"/>' + LEAVES.map(leaf).join('');
    const stars = [145, 252, 359, 466, 573].map(function (x, i) {
      return '<g transform="translate(' + x + ' 138)"><path class="rate-star" style="--i:' + i + '" d="' + STAR + '"/></g>';
    }).join('');
    return '<svg class="rate-laurel" viewBox="0 0 718 270" role="img" aria-label="Five stars">' +
      '<g>' + branch + '</g>' +
      '<g transform="translate(718 0) scale(-1 1)">' + branch + '</g>' +
      stars + '</svg>';
  }

  function frame() {
    return '<div class="rate-frame" id="rate-frame">' +
      UI.sprout(POSE, 'rate-plate') +
      '<svg class="rate-ring" viewBox="0 0 300 300" aria-hidden="true">' +
        '<path class="rate-ring-track" d="' + FRAME + '"/>' +
        '<path class="rate-ring-fill" id="rate-fill" d="' + FRAME + '"/>' +
      '</svg>' +
      /* The mark rides the tip of the fill, the way the heart rides Spot
         Me's ring. Same three paths as everywhere else the mark appears. */
      '<span class="rate-bud" id="rate-bud" aria-hidden="true">' +
        '<svg viewBox="0 0 100 100"><path d="M50 84V40"/><path d="M50 58C36 58 28 49 28 36c14 0 22 9 22 22Z"/><path d="M50 46c14 0 22-9 22-22-14 0-22 9-22 22Z"/></svg>' +
      '</span>' +
    '</div>';
  }

  function markup() {
    return '<div class="rate-top">' +
        '<button class="icon-btn rate-close" type="button" data-rate="close" aria-label="Close">' + UI.icon('x') + '</button>' +
        '<div class="rate-brand" aria-hidden="true">Sprout</div>' +
        '<span></span>' +
      '</div>' +
      '<div class="rate-intro">' +
        '<p class="rate-eyebrow">' + UI.esc(tally()) + '</p>' +
        '<h2 class="rate-title" id="rate-title">Help me grow</h2>' +
        '<p class="rate-text" id="rate-text">' + askText() + '</p>' +
      '</div>' +
      '<div class="rate-hero">' + laurel() + '<div class="rate-stage">' + frame() + '</div></div>' +
      '<div class="rate-actions">' +
        '<button class="btn btn-lg btn-block rate-cta" type="button" data-rate="cta">' + UI.icon('star') + '<span class="btn-label" id="rate-cta-label">Leave a rating</span></button>' +
        '<button class="rate-alt" type="button" data-rate="store" hidden>No sheet appeared? Open the store page</button>' +
      '</div>';
  }

  /* ---------- The frame's fill ---------- */

  let fillPath = null, budEl = null, fillLen = 0, fillAt = 0;

  function setFill(p) {
    fillAt = p;
    fillPath.style.strokeDasharray = fillLen + ' ' + fillLen;
    fillPath.style.strokeDashoffset = String(fillLen * (1 - p));
    const pt = fillPath.getPointAtLength(fillLen * p);
    budEl.style.left = (pt.x / 3) + '%';
    budEl.style.top = (pt.y / 3) + '%';
  }

  const EXPO_OUT = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const IN_OUT = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function fillTo(to, ms, ease, done) {
    cancelAnimationFrame(raf);
    const from = fillAt;
    if (reduceMotion.matches) { setFill(to); if (done) done(); return; }
    const start = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - start) / ms);
      setFill(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    })(start);
  }

  /* ---------- The celebration ---------- */

  /* Leaves, not confetti. They leave the frame from all round it, carried
     outward a little, then fall the way leaves do: slowly, swaying, turning
     over, and gone before they reach the button. */
  function fall(n) {
    if (reduceMotion.matches || !Element.prototype.animate) return;
    let layer = root.querySelector('.rate-leaves');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'rate-leaves';
      layer.setAttribute('aria-hidden', 'true');
      root.appendChild(layer);
    }
    const cs = getComputedStyle(root);
    const colours = LEAF_TOKENS.map(function (t) { return cs.getPropertyValue(t).trim(); }).filter(Boolean);
    const box = root.getBoundingClientRect();
    const f = root.querySelector('#rate-frame').getBoundingClientRect();
    const cx = f.left + f.width / 2 - box.left, cy = f.top + f.height / 2 - box.top, r = f.width / 2;

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

      const at = function (x, y, rot, s) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + s + ')'; };
      el.animate([
        { transform: at(x0, y0, 0, 0.3), opacity: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
        { transform: at(x1, y1, spin * 0.25, 1), opacity: 1, offset: 0.22, easing: 'ease-in-out' },
        { transform: at(x1 + sway, y1 + drop * 0.35, spin * 0.5, 1), opacity: 1, offset: 0.5, easing: 'ease-in-out' },
        { transform: at(x1 - sway, y1 + drop * 0.7, spin * 0.78, 0.95), opacity: 0.85, offset: 0.78, easing: 'ease-in' },
        { transform: at(x1 + sway * 0.4, y1 + drop, spin, 0.9), opacity: 0 }
      ], { duration: 2600 + Math.random() * 1600, delay: Math.random() * 160, fill: 'both' }).onfinish = function () {
        el.remove();
      };
    }
  }

  /* ---------- Flow ---------- */

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function swapCopy(title, text) {
    const t = root.querySelector('#rate-title'), p = root.querySelector('#rate-text');
    const apply = function () { t.innerHTML = title; p.innerHTML = text; root.classList.remove('is-swapping'); };
    if (reduceMotion.matches) { apply(); return; }
    root.classList.add('is-swapping');
    later(apply, 260);
  }

  function ask() {
    asked = true;
    requestReview();
    root.classList.add('is-asked');
    root.querySelector('#rate-cta-label').textContent = 'Back to my plants';
    root.querySelector('[data-rate="store"]').hidden = !storeUrl();
    swapCopy(thanksTitle(), THANKS_TEXT);
    fillTo(1, 1300, IN_OUT, function () {
      root.classList.add('is-complete');
      fall(54);
      later(function () { if (root) fall(26); }, 220);
    });
    if (typeof opts.onRequest === 'function') opts.onRequest();
  }

  function open(options) {
    if (root) return;
    opts = options || {};
    asked = false;
    returnFocus = document.activeElement;

    root = document.createElement('div');
    root.className = 'rate';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'rate-title');
    root.innerHTML = markup();
    document.body.appendChild(root);

    fillPath = root.querySelector('#rate-fill');
    budEl = root.querySelector('#rate-bud');
    fillLen = fillPath.getTotalLength();
    setFill(0);

    root.addEventListener('click', function (e) {
      const act = e.target.closest('[data-rate]');
      if (!act) return;
      const a = act.getAttribute('data-rate');
      if (a === 'cta') { if (asked) close('rated'); else ask(); }
      else if (a === 'store') openStore();
      else if (a === 'close') close(asked ? 'rated' : 'dismissed');
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(asked ? 'rated' : 'dismissed');
    });

    /* The frame fills to its resting point once the stars are in, so the
       eye travels down the screen in the order it is meant to be read. */
    later(function () { if (root) fillTo(RESTING, 1500, EXPO_OUT); }, reduceMotion.matches ? 0 : 900);
    /* Focus goes to the screen itself rather than the button, so a screen
       reader starts at the title and nothing draws a ring round the CTA
       before anyone has touched a key. */
    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
  }

  function close(outcome) {
    if (!root || root.classList.contains('is-closing')) return;
    const el = root, done = opts.onClose;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout); timers = [];
    el.classList.add('is-closing');
    setTimeout(function () {
      el.remove();
      if (root === el) root = null;
      if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
      if (typeof done === 'function') done(outcome || 'dismissed');
    }, reduceMotion.matches ? 0 : 420);
  }

  return { open: open, close: close, isOpen: function () { return !!root; } };
})();
