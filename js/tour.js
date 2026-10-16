/* ==========================================================================
   Sprout — the plan walkthrough
   --------------------------------------------------------------------------
   "Watch me build one" draws a two-room flat on the real planner, with a
   ghost finger doing what a reader's thumb would. It used to be an
   animation on a canvas of its own, with mock-ups of the panels, which
   described the controls but never showed where they were; this is the
   planner itself, so the reader sees the very buttons they are about to
   use, and the walkthrough cannot drift from the app.

   Every tap and drag is a pointer event dispatched where a thumb would
   land. Nothing on screen is drawn by this file except the finger, the
   tour's veil and its card. If the planner changes, the run either follows
   it or stops on the step that no longer fits, and the selectors it drives
   are listed in CLAUDE.md for that reason.

   It runs on the guided tour's sample (Store.beginSample), so nothing it
   draws is ever stored, and an app closed half way reopens on the reader's
   own garden. The sample is never handed over: the end, Skip and Back all
   land on the reader's own plan with tracing armed, because a sample flat
   is not their home and keeping it would only be more to undo.
   ========================================================================== */

window.Tour = (function () {
  'use strict';

  const P = 24;                       // px per grid cell, matching ViewPlan
  const WINDOW = 1;

  let root = null, shield = null, hole = null, finger = null, card = null;
  let run = 0, paused = false, stepMode = false, gate = null, at = -1, driving = false;
  let onHandover = null, veilOn = false, lit = null, litLast = null, raf = null;
  let fx = 0, fy = 0;
  let seedId = null;

  function Stopped() {}
  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ======================================================================
     Time. Every wait honours Pause, and a run that has been ended stops at
     its next wait rather than carrying on into the reader's own plan.
     ====================================================================== */

  function sleep(ms) {
    const my = run;
    return new Promise(function (res, rej) {
      let left = ms, last = performance.now();
      (function tick() {
        if (my !== run) return rej(new Stopped());
        const now = performance.now();
        if (!paused) left -= now - last;
        last = now;
        if (left <= 0) return res();
        requestAnimationFrame(tick);
      })();
    });
  }
  function until(fn, ms) {
    const t0 = performance.now(), my = run;
    return new Promise(function (res, rej) {
      (function poll() {
        if (my !== run) return rej(new Stopped());
        const v = fn();
        if (v) return res(v);
        if (performance.now() - t0 > (ms || 5000)) return rej(new Error('Timed out waiting'));
        setTimeout(poll, 50);
      })();
    });
  }
  function visible(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' ? el : null;
  }

  /* ======================================================================
     The finger
     ====================================================================== */

  function place(x, y, down) {
    fx = x; fy = y;
    finger.style.transform = 'translate(' + x + 'px,' + y + 'px)' + (down ? ' scale(.82)' : '');
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  /* A reader who has asked not to be animated at gets the finger where it
     is going, at once. */
  function glide(x, y, ms, each, down) {
    const x0 = fx, y0 = fy, my = run, len = reduced() ? 0 : ms;
    return new Promise(function (res, rej) {
      let el = 0, last = performance.now();
      (function tick() {
        if (my !== run) return rej(new Stopped());
        const now = performance.now();
        if (!paused) el += now - last;
        last = now;
        const k = len ? Math.min(1, el / len) : 1, e = ease(k);
        place(x0 + (x - x0) * e, y0 + (y - y0) * e, down);
        if (each) each(fx, fy);
        if (k >= 1) return res();
        requestAnimationFrame(tick);
      })();
    });
  }
  /* What a thumb at this point would land on, looking through the shield
     and the card, which are only there to keep the reader's own taps out.
     pointer-events, not visibility: under reduced motion every element
     carries a short transition, and visibility waits for it to finish. */
  function hit(x, y) {
    root.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    root.style.pointerEvents = '';
    return el;
  }
  function pev(type, el, x, y) {
    el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch',
      isPrimary: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1
    }));
  }
  /* Where a real pointer's later events go once captured. The canvas and
     the dial redraw their own children mid-drag, and an event sent to a
     child that has just been replaced reaches nothing. */
  function captureOf(el) { return (el.closest && (el.closest('#pl-canvas') || el.closest('#pl-dial'))) || el; }
  function ring(x, y) {
    const r = document.createElement('div');
    r.className = 'tour-ring';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    root.appendChild(r);
    setTimeout(function () { r.remove(); }, 600);
  }
  function centre(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

  /* Scrolled into view only when the card or the header would hide it. The
     header is measured: on a narrow phone it wraps taller, and a wall's
     number under it takes the header's tap instead. */
  async function reveal(el) {
    const r = el.getBoundingClientRect(), top = card ? card.getBoundingClientRect().top : innerHeight;
    const head = document.querySelector('.topbar'), below = head ? Math.max(0, head.getBoundingClientRect().bottom) + 8 : 70;
    if (r.top < below || r.bottom > top - 8) {
      el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      await sleep(650);
    }
  }
  async function tapAt(x, y) {
    await glide(x, y, 620);
    await sleep(120);
    place(x, y, true);
    const el = hit(x, y);
    pev('pointerdown', el, x, y);
    await sleep(110);
    pev('pointerup', captureOf(el), x, y);
    place(x, y, false);
    ring(x, y);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }));
    await sleep(160);
  }
  function outside(el) { return !el.closest('#pl-stage') && !el.closest('#sheet'); }
  async function tap(sel) {
    const el = await until(function () { return visible(sel); });
    const out = outside(el);
    if (out) { light(el); await sleep(300); }
    await reveal(el);
    const c = centre(el);
    await tapAt(c[0], c[1]);
    if (out) { await sleep(250); light(null); }
  }
  async function drag(x1, y1, x2, y2, ms) {
    await glide(x1, y1, 620);
    await sleep(140);
    place(x1, y1, true);
    const el = hit(x1, y1), cap = captureOf(el);
    pev('pointerdown', el, x1, y1);
    await sleep(120);
    await glide(x2, y2, ms || 1100, function (x, y) { pev('pointermove', cap, x, y); }, true);
    await sleep(120);
    pev('pointerup', cap, x2, y2);
    place(x2, y2, false);
    await sleep(200);
  }
  /* Typed without focus: a focused field brings the phone's keyboard up
     over the very thing the reader is watching. The field wears its focus
     line instead, and takes the letters as input events, which is all the
     planner listens for. */
  async function type(sel, text) {
    const el = await until(function () { return visible(sel); });
    const out = outside(el);
    if (out) { light(el.id === 'pl-room-name' ? el.parentElement : el); await sleep(300); }
    await reveal(el);
    const c = centre(el);
    await tapAt(c[0], c[1]);
    el.classList.add('tour-typing');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    for (let i = 0; i < text.length; i++) {
      await sleep(70 + Math.random() * 60);
      el.value += text[i];
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await sleep(250);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.classList.remove('tour-typing');
    if (out) { await sleep(250); light(null); }
  }

  /* A grid cell's place on screen, read from the canvas as it is drawn now. */
  function cell(x, y) {
    const svg = document.getElementById('pl-canvas'), p = svg.createSVGPoint();
    p.x = x * P; p.y = y * P;
    const q = p.matrixTransform(svg.getScreenCTM());
    return [q.x, q.y];
  }
  async function dragCells(a, b, ms) { const p = cell(a[0], a[1]), q = cell(b[0], b[1]); await drag(p[0], p[1], q[0], q[1], ms); }
  async function tapCell(x, y) { const p = cell(x, y); await tapAt(p[0], p[1]); }
  /* A side's number badge on the plan, for the selected room. Checked, not
     assumed: the badges redraw as the panel settles, and a tap that lands
     mid-redraw changes nothing. Two more tries, then a plain stop. */
  async function tapWall(i, name) {
    function isWindow() {
      const r = Store.get().rooms.filter(function (x) { return x.name === name; })[0];
      return r && r.shape && r.shape.win[i] === WINDOW;
    }
    for (let n = 0; n < 3 && !isWindow(); n++) {
      await sleep(350);
      await tap('#pl-canvas [data-edge="' + i + '"]');
      await sleep(250);
    }
    if (!isWindow()) throw new Error('Side ' + (i + 1) + ' of ' + name + ' did not become a window');
  }
  /* The dial, turned by its rim from N to a little west of it. */
  async function turnDial() {
    const dial = await until(function () { return visible('#pl-dial'); });
    const r = dial.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width * 0.38;
    function at(deg) { const a = deg * Math.PI / 180; return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)]; }
    const start = at(0);
    await glide(start[0], start[1], 600);
    place(fx, fy, true);
    const el = hit(fx, fy), cap = captureOf(el);
    pev('pointerdown', el, fx, fy);
    const my = run, len = reduced() ? 0 : 1100;
    let el0 = 0, last = performance.now();
    await new Promise(function (res, rej) {
      (function tick() {
        if (my !== run) return rej(new Stopped());
        const now = performance.now();
        if (!paused) el0 += now - last;
        last = now;
        const k = len ? Math.min(1, el0 / len) : 1, p = at(-35 * ease(k));
        place(p[0], p[1], true);
        pev('pointermove', cap, fx, fy);
        if (k >= 1) return res();
        requestAnimationFrame(tick);
      })();
    });
    pev('pointerup', cap, fx, fy);
    place(fx, fy, false);
  }

  /* ======================================================================
     The veil: the guided tour's lit window over what the finger is
     working, the plan itself unless a control below it is the one in hand.
     ====================================================================== */

  function light(el) { lit = el; }
  function track() {
    if (!root) return;
    const backdrop = document.getElementById('sheet-backdrop');
    const sheetUp = !!backdrop && !backdrop.hidden;
    const target = lit && document.body.contains(lit) ? lit : document.getElementById('pl-stage');
    hole.classList.toggle('is-on', veilOn && !sheetUp && !!target);
    if (veilOn && target) {
      if (target !== litLast) {
        hole.classList.add('is-glide');
        setTimeout(function () { if (hole) hole.classList.remove('is-glide'); }, 440);
        litLast = target;
      }
      const r = target.getBoundingClientRect(), pad = target.id === 'pl-stage' ? 0 : 6;
      hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (r.height + pad * 2) + 'px';
    }
    raf = requestAnimationFrame(track);
  }

  /* ======================================================================
     The script: one short flat, start to finish
     ====================================================================== */

  const BEATS = [
    { title: 'Trace your home', say: 'Start from an empty plan.',
      go: async function () { await tap('#pl-trace'); } },
    { title: 'Freehand', say: 'No floorplan to hand, so draw it freehand.',
      go: async function () { await tap('#pl-coach-self'); await sleep(500); } },
    /* Two cells below the tools row, so its buttons never sit over a wall
       the finger has to tap. */
    { title: 'Drag out a room', say: 'Each square on the grid is half a metre.',
      go: async function () { await sleep(300); await dragCells([15, 16], [23, 23], 1300); await sleep(500); } },
    { title: 'Name it', say: 'Use the name you call it at home.',
      go: async function () { await type('#pl-room-name', 'Living room'); await sleep(300); } },
    { title: 'Mark the windows', say: 'Tap a numbered side to switch it to a window.',
      go: async function () { await tapWall(0, 'Living room'); await sleep(600); } },
    { title: 'The next room', say: 'Draw it against the first, so the two share a wall.',
      go: async function () {
        await tapCell(31.5, 26.5); await sleep(300);
        await tap('#pl-add-room'); await sleep(450);
        await dragCells([23, 16], [30, 22], 1100); await sleep(400);
        await type('#pl-room-name', 'Bedroom');
        await tapWall(1, 'Bedroom'); await sleep(500);
      } },
    { title: 'Set north', say: 'Turn the dial until N points north, and I can read the light in every room.',
      go: async function () {
        await tapCell(31.5, 26.5); await sleep(250);
        await tap('#pl-rose'); await sleep(900);
        await turnDial(); await sleep(400);
        await tap('[data-act="pl-north-confirm"]'); await sleep(900);
      } },
    /* One of the reader's plants, which the sample holds ready, rather than
       a new one: adding a plant opens the full plant form, which belongs to
       the greenhouse and would carry the finger off the plan. */
    { title: 'Add a plant', say: 'Pick one of yours and I\'ll stand it where the light suits it best.',
      go: async function () {
        await tapCell(26.5, 19); await sleep(400);
        await tap('#pl-quick-add'); await sleep(400);
        await tap('[data-quick-plant="' + seedId + '"]'); await sleep(700);
      } },
    { title: 'Where it should stand', say: 'Tap it, and I\'ll shade the floor by how well each spot suits it.',
      go: async function () {
        window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); await sleep(500);
        const p = Store.getPlant(seedId);
        if (!p || !p.pos) throw new Error('The plant did not reach the plan');
        await tapCell(p.pos.x, p.pos.y); await sleep(2200);
      } }
  ];

  /* ======================================================================
     The card: the guided tour's own (.gd-card), so the two read as one
     ====================================================================== */

  function say(beat, n) {
    card.querySelector('.gd-count').textContent = 'Your plan · ' + n + ' of ' + BEATS.length;
    card.querySelector('.gd-title').textContent = beat.title;
    card.querySelector('.gd-body').textContent = beat.say;
    card.querySelector('.gd-meter i').style.width = ((n - 1) / (BEATS.length - 1) * 100).toFixed(1) + '%';
    card.classList.remove('is-out');
  }
  /* Pause while it plays itself; Next when it holds after each step, which
     is how it runs for a reader who has asked for less motion. */
  function syncControl(holding) {
    const b = card && card.querySelector('[data-tr="ctl"]');
    if (!b) return;
    b.textContent = stepMode ? 'Next' : paused ? 'Resume' : 'Pause';
    b.disabled = stepMode && !holding;
  }
  function finishBar() {
    const bar = card.querySelector('.gd-bar');
    bar.className = 'gd-bar is-finish';
    bar.innerHTML = '<button class="btn btn-ghost btn-sm" data-tr="again">Watch again</button>' +
      '<button class="btn btn-sm" data-tr="own">' + UI.icon('plus') + 'Start my own plan</button>';
  }

  /* ======================================================================
     While it drives, the reader's keyboard has no say. A field that takes
     focus is let go at once (a sheet focuses its first one), so no keyboard
     opens over the demo, and real key presses go nowhere. The demo's own
     typing is untrusted input events, which pass. Escape is the exception:
     it is how a keyboard leaves, and Android's Back arrives as one.
     ====================================================================== */

  document.addEventListener('focusin', function (e) {
    if (driving && e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.target.blur();
  }, true);
  ['keydown', 'keypress', 'keyup', 'beforeinput', 'paste', 'compositionstart'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (!root || !e.isTrusted) return;
      if (t === 'keydown' && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close('own'); return; }
      if (driving) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
  });

  /* ======================================================================
     Way in, way out
     ====================================================================== */

  /* The reader's hemisphere, stated, so the dial never stops to ask which
     side of the equator the sample is on; the welcome flags are set so no
     first-run sheet opens over it. */
  function begin() {
    const hemisphere = Store.hemisphere();
    Store.beginSample({
      profile: { hemisphere: hemisphere },
      settings: { onboarded: true, seenWelcome: true, reshapeTipDone: true }
    });
    /* Watered today, so Today's badge does not move under the veil. */
    seedId = Store.addPlant({ speciesId: 'monstera-deliciosa', acquired: null, lastWatered: UI.toISO(UI.today()) }).id;
    ViewPlan.reset();
    App.render();
  }

  function mount() {
    root = document.createElement('div');
    root.className = 'tour';
    root.innerHTML =
      '<div class="tour-shield" aria-hidden="true"></div>' +
      '<div class="tour-hole" aria-hidden="true"></div>' +
      '<div class="tour-finger" aria-hidden="true"></div>' +
      '<div class="gd-card is-out" role="dialog" aria-live="polite" aria-label="How the plan works">' +
        '<div class="gd-count"></div><h3 class="gd-title"></h3><p class="gd-body"></p>' +
        '<div class="gd-bar"><button class="gd-skip" data-tr="skip">Skip</button><span class="grow"></span>' +
          '<button class="btn btn-ghost btn-sm" data-tr="ctl">Pause</button></div>' +
        '<div class="gd-meter"><i style="width:0"></i></div>' +
      '</div>';
    document.body.appendChild(root);
    shield = root.querySelector('.tour-shield');
    hole = root.querySelector('.tour-hole');
    finger = root.querySelector('.tour-finger');
    card = root.querySelector('.gd-card');

    root.addEventListener('click', function (e) {
      const b = e.target.closest('[data-tr]');
      if (!b) return;
      const k = b.getAttribute('data-tr');
      if (k === 'skip' || k === 'own') close('own');
      else if (k === 'again') { const h = onHandover; close('quiet'); open(h); }
      else if (k === 'ctl') {
        if (stepMode) { if (gate) { const g = gate; gate = null; g(); syncControl(false); } }
        else { paused = !paused; syncControl(); }
      }
    });
    /* app.js hands Android's Back here as an Escape on this root. */
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') close('own'); });
    /* Anything that changes the page mid-run (a notification tapped, the
       phone's own back gesture) ends the sample before the reader sees
       their garden through it. */
    window.addEventListener('hashchange', onRoute);

    fx = innerWidth * 0.7; fy = innerHeight * 0.75;
    place(fx, fy, false);
    raf = requestAnimationFrame(track);
  }
  function onRoute() { close('route'); }

  async function play() {
    const my = ++run;
    paused = false; at = -1; driving = true; veilOn = true;
    stepMode = reduced();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    finger.classList.add('is-on');
    syncControl(false);
    try {
      for (let i = 0; i < BEATS.length; i++) {
        at = i;
        say(BEATS[i], i + 1);
        syncControl(false);
        await sleep(700);
        await BEATS[i].go();
        await sleep(500);
        if (stepMode && i < BEATS.length - 1) {
          syncControl(true);
          await new Promise(function (res) { gate = res; });
          if (my !== run) return;
        }
      }
      if (my !== run) return;
      driving = false; veilOn = false;
      finger.classList.remove('is-on');
      card.querySelector('.gd-count').textContent = 'Your plan · done';
      card.querySelector('.gd-meter i').style.width = '100%';
      card.querySelector('.gd-title').textContent = 'Your turn';
      card.querySelector('.gd-body').textContent = 'That\'s the planner. Now draw yours.';
      finishBar();
    } catch (e) {
      if (e instanceof Stopped) return;
      /* A step that no longer fits the planner: say so plainly and offer
         the way out, rather than leaving a finger frozen over the plan. */
      driving = false; veilOn = false;
      finger.classList.remove('is-on');
      card.querySelector('.gd-title').textContent = 'That step didn\'t work';
      card.querySelector('.gd-body').textContent = 'Start your own plan and I\'ll guide you from the planner\'s steps.';
      finishBar();
      if (window.console) console.warn('Tour stopped on step ' + (at + 1) + ':', e);
    }
  }

  /* 'own' hands over to the reader's plan with tracing armed; 'route' has
     already left the plan, so only the sample goes; 'quiet' is Watch again,
     which opens a fresh sample straight after. */
  function close(how) {
    if (!root) return;
    run++;
    driving = false; veilOn = false; gate = null; paused = false;
    window.removeEventListener('hashchange', onRoute);
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    root.remove();
    root = shield = hole = finger = card = null;
    lit = litLast = null;
    if (UI.sheetIsOpen()) UI.closeSheet();
    Store.endSample();
    ViewPlan.reset();
    if (how === 'quiet') return;
    if (how === 'route') { App.refresh(); return; }
    App.render();
    if (typeof onHandover === 'function') onHandover();
  }

  /* Never over the guided tour's sample, which is already a sample, and
     never twice at once. */
  function open(handover) {
    if (root || Store.inSample()) return;
    onHandover = handover || null;
    begin();
    mount();
    play();
  }

  function isOn() { return !!root; }

  /* The invitation belongs only on a plan with nothing on it: once a room
     exists the reader has worked it out and does not need asking again. */
  function shouldOffer() {
    return !Store.get().rooms.some(function (r) { return !!r.shape; });
  }

  return { open: open, isOn: isOn, shouldOffer: shouldOffer };
})();
