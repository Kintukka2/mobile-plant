/* ==========================================================================
   Sprout — first-run introduction
   --------------------------------------------------------------------------
   The five questions Profile asks, asked once, on the splash. The splash
   used to dissolve into a sheet that opened with a wall of copy and two
   form fields; the questions now come one at a time on the same deep field
   the wordmark arrived on, so the first minute with the app is one
   continuous scene rather than an animation and then a form.

   Nothing here is a route. It lives inside #splash, which is fixed and
   sits over the app, and it hands the element back to app.js to lift when
   the last answer is in. Every answer is saved as it is given, so leaving
   half way keeps what was said, and every one of them is editable in
   Profile afterwards — this is the same data with a better first asking.

   There is a way back. Two of the answers move on by themselves, and one of
   those is the hemisphere, which inverts every light reading and every
   season when it is wrong: a mis-tap that could not be undone until the
   reader found it in Profile was the costliest thing on this screen.
   ========================================================================== */

window.Onboard = (function () {
  'use strict';

  const EXPERIENCE = LOOKUPS.EXPERIENCE, PETS = LOOKUPS.PETS;

  const STEPS = ['name', 'pets', 'exp', 'hemi', 'loc'];

  let root = null, stage = null, dotsEl = null, backEl = null, skipEl = null,
      at = -1, finished = false, onDone = null, busy = false;

  function shouldRun() {
    const s = Store.get().settings;
    return !s.seenWelcome && !s.onboarded;
  }

  /* ---------- Steps ---------- */

  function stepName() {
    const name = Store.get().profile.name || '';
    /* The introduction comes before the first question, not after the
       last. Five questions in the first person from someone who has not yet
       said who they are, and then "Hi, I'm Sprout" on the sheet after them,
       was the right greeting in the wrong place. */
    return '<p class="ob-lede">I\'m Sprout. Five quick questions, then we can start on your plants.</p>' +
      '<h2 class="ob-q">What should I call you?</h2>' +
      '<input class="ob-input" id="ob-name" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" placeholder="Your name" value="' + UI.attr(name) + '">' +
      '<div class="ob-actions"><button class="btn btn-lg" data-ob="next">Continue</button></div>';
  }

  function stepPets() {
    const pets = Store.get().profile.pets || [];
    return '<h2 class="ob-q">Any pets at home?</h2>' +
      '<div class="ob-chips">' + PETS.map(function (p) {
        return '<button type="button" class="chip ob-chip' + (pets.indexOf(p.key) !== -1 ? ' is-on' : '') + '" data-ob-pet="' + p.key + '">' + UI.icon(p.ico) + UI.esc(p.label) + '</button>';
      }).join('') + '</div>' +
      '<p class="ob-hint">I\'ll warn you before you add anything that would hurt them. A surprising number of the popular plants would.</p>' +
      '<div class="ob-actions"><button class="btn btn-lg" data-ob="next">Continue</button></div>';
  }

  function stepExp() {
    const cur = Store.get().profile.experience;
    return '<h2 class="ob-q">How are you with plants?</h2>' +
      '<div class="ob-opts">' + EXPERIENCE.map(function (e) {
        return '<button type="button" class="ob-opt' + (e.key === cur ? ' is-on' : '') + '" data-ob-exp="' + e.key + '">' + UI.esc(e.label) + '</button>';
      }).join('') + '</div>' +
      '<p class="ob-hint">There is no wrong answer.</p>';
  }

  function stepHemi() {
    const set = Store.get().profile.hemisphere, guess = LOOKUPS.hemisphereFromTimeZone();
    function opt(key, label) {
      const on = set ? set === key : false, hint = !set && guess === key;
      return '<button type="button" class="ob-opt' + (on ? ' is-on' : '') + (hint ? ' is-hinted' : '') + '" data-ob-hemi="' + key + '">' + label +
        (hint ? '<small>Your device suggests this</small>' : '') + '</button>';
    }
    return '<h2 class="ob-q">Which side of the equator are you on?</h2>' +
      '<div class="ob-opts">' + opt('north', 'Northern hemisphere') + opt('south', 'Southern hemisphere') + '</div>' +
      '<p class="ob-hint">It decides which way your bright windows face, and which months are the growing season.</p>';
  }

  function stepLoc() {
    return '<h2 class="ob-q">Can I use your location?</h2>' +
      '<p class="ob-hint" style="margin-top:0">For a local forecast, so I can offer to stretch or shorten watering before a wet or dry spell. I round it to about a kilometre and send that to Open-Meteo, nowhere else.</p>' +
      '<div class="ob-actions">' +
        '<button class="btn btn-lg" data-ob="locate">' + UI.icon('pin') + 'Use my location</button>' +
        /* A no here is the same no as the card on Today, so it holds there
           too rather than being asked again the next morning. */
        '<button class="btn btn-ghost" data-ob="loc-later">Not now</button>' +
      '</div>' +
      '<p class="ob-hint ob-note" id="ob-loc-note" hidden></p>';
  }

  const RENDER = { name: stepName, pets: stepPets, exp: stepExp, hemi: stepHemi, loc: stepLoc };

  /* ---------- Flow ---------- */

  function dots() {
    dotsEl.innerHTML = STEPS.map(function (s, i) {
      return '<span class="ob-dot' + (i === at ? ' is-on' : i < at ? ' is-done' : '') + '"></span>';
    }).join('');
  }

  /* One step leaves upward and blurs; the next arrives from below. The
     swap waits for the exit so the two are never on screen together. */
  function go(i) {
    if (busy || finished) return;
    busy = true;
    const swap = function () {
      at = i;
      stage.innerHTML = '<div class="ob-step">' + RENDER[STEPS[i]]() + '</div>';
      dots();
      backEl.hidden = i === 0;
      /* On the last question "Not now" already is the skip, so a second
         way out under it would only be a second word for the same tap. */
      skipEl.hidden = i === STEPS.length - 1;
      busy = false;
      const input = stage.querySelector('#ob-name');
      if (input) setTimeout(function () { input.focus(); }, 500);
    };
    const cur = stage.querySelector('.ob-step');
    if (!cur) { swap(); return; }
    cur.classList.add('is-leaving');
    setTimeout(swap, 380);
  }

  function next() {
    if (at + 1 >= STEPS.length) finish(); else go(at + 1);
  }

  /* Answers are already saved, so stepping back only re-asks: the step
     renders with what was chosen lit, and choosing again overwrites it. */
  function back() {
    if (!root || finished || busy || at <= 0) return;
    if (STEPS[at] === 'name') saveName();
    go(at - 1);
  }

  function saveName() {
    const input = stage.querySelector('#ob-name');
    if (input) Store.updateProfile({ name: input.value.trim() });
  }

  function finish() {
    if (finished) return;
    finished = true;
    Store.updateSettings({ onboarded: true });
    root.classList.add('is-leaving');
    if (typeof onDone === 'function') setTimeout(onDone, 380);
  }

  function locate() {
    const note = stage.querySelector('#ob-loc-note'), btn = stage.querySelector('[data-ob="locate"]');
    note.hidden = false; note.textContent = 'Asking for your location…';
    if (btn) btn.disabled = true;
    Weather.locateMe(function (err, place) {
      if (finished) return;
      if (err) { note.textContent = err.message + ' You can set it later in Profile.'; if (btn) btn.disabled = false; return; }
      Store.updateProfile({ location: { label: place.label, lat: place.lat, lon: place.lon } });
      Store.setWeather(null);
      if (window.App && App.syncWeather) App.syncWeather(true);
      note.textContent = 'Set to ' + place.label + '.';
      setTimeout(finish, 520);
    });
  }

  /* Single choices move on by themselves after a beat. The beat is bound
     to the step it was given on, so a Back tapped inside it is not undone
     by the advance landing a moment later. */
  function advanceFrom(step) {
    setTimeout(function () { if (at === step) next(); }, 460);
  }

  /* ---------- Mount ---------- */

  function start(splash, done) {
    onDone = done;
    const inner = splash.querySelector('.splash-inner');
    if (inner) inner.classList.add('is-quiet');

    root = document.createElement('div');
    root.className = 'ob';
    root.innerHTML =
      '<button class="ob-back" data-ob="back" aria-label="Back" hidden>' + UI.icon('back') + '</button>' +
      '<div class="ob-brand" aria-hidden="true">Sprout</div>' +
      '<div class="ob-stage" id="ob-stage"></div>' +
      '<div class="ob-dots" id="ob-dots"></div>' +
      '<button class="ob-skip" data-ob="finish">Skip the rest</button>';
    splash.appendChild(root);
    stage = root.querySelector('#ob-stage');
    dotsEl = root.querySelector('#ob-dots');
    backEl = root.querySelector('.ob-back');
    skipEl = root.querySelector('.ob-skip');

    root.addEventListener('click', function (e) {
      const t = e.target;
      const act = t.closest('[data-ob]');
      if (act) {
        const a = act.getAttribute('data-ob');
        if (a === 'next') { if (STEPS[at] === 'name') saveName(); next(); }
        else if (a === 'back') back();
        else if (a === 'locate') locate();
        else if (a === 'finish') { if (STEPS[at] === 'name') saveName(); finish(); }
        else if (a === 'loc-later') { Store.snoozeLocationAsk(); finish(); }
        return;
      }
      const pet = t.closest('[data-ob-pet]');
      if (pet) {
        const key = pet.getAttribute('data-ob-pet'), pets = (Store.get().profile.pets || []).slice(), i = pets.indexOf(key);
        if (i === -1) pets.push(key); else pets.splice(i, 1);
        Store.updateProfile({ pets: pets });
        pet.classList.toggle('is-on', i === -1);
        return;
      }
      /* Single choices move on by themselves after a beat: a Continue button
         under a list of one-tap answers is a second tap for no reason. */
      const exp = t.closest('[data-ob-exp]');
      if (exp) {
        stage.querySelectorAll('[data-ob-exp]').forEach(function (b) { b.classList.toggle('is-on', b === exp); });
        Store.updateProfile({ experience: exp.getAttribute('data-ob-exp') });
        advanceFrom(at); return;
      }
      const hemi = t.closest('[data-ob-hemi]');
      if (hemi) {
        stage.querySelectorAll('[data-ob-hemi]').forEach(function (b) { b.classList.toggle('is-on', b === hemi); b.classList.remove('is-hinted'); });
        Store.updateProfile({ hemisphere: hemi.getAttribute('data-ob-hemi') });
        advanceFrom(at); return;
      }
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'ob-name') { e.preventDefault(); saveName(); next(); }
    });

    /* Let the wordmark settle out before the first question arrives. */
    setTimeout(function () { go(0); }, 420);
  }

  /* app.js hands Android's Back button here while the introduction is up. */
  function isOpen() { return !!root && !finished; }

  return { shouldRun: shouldRun, start: start, back: back, isOpen: isOpen };
})();
