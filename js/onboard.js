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

  /* Location comes before the hemisphere, and a shared location answers
     it: latitude decides the hemisphere (Store.updateProfile), so the
     question is only asked of someone who said no or whose phone could not
     find them. It is last for that reason, and the introduction ends a
     step early when it is not needed. */
  const STEPS = ['name', 'pets', 'exp', 'plants', 'watered', 'loc', 'hemi'];

  /* "Watered" follows the plants step only when there is something on it:
     it asks about the plants just added, and with none it has nothing to
     ask. Skipped in both directions and left out of the dots. */
  function live(step) { return step !== 'watered' || added.length > 0; }

  let root = null, stage = null, dotsEl = null, backEl = null, skipEl = null,
      at = -1, finished = false, onDone = null, busy = false;

  /* "None" is an answer, not an empty list, so it is remembered for the
     length of the introduction: stepping back to the question shows it lit.
     It saves the same thing as no pets, which is all the app needs. */
  let petsNone = false;

  /* The plants added on the plants step, so stepping back to it shows them
     and a remove takes out the right one. */
  let added = [];

  /* The date each of those plants was last watered, picked on the watered
     step, by plant id, so stepping back to it shows them filled in. No
     entry means "start today", which is also what a plant nobody dated is. */
  let wateredPick = {};

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
    return '<p class="ob-lede">I\'m Sprout. A few quick questions first, then on to your plants.</p>' +
      '<h2 class="ob-q">What should I call you?</h2>' +
      '<input class="ob-input" id="ob-name" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" placeholder="Your name" value="' + UI.attr(name) + '">' +
      '<div class="ob-actions"><button class="btn btn-lg" data-ob="next">Continue</button></div>';
  }

  function stepPets() {
    const pets = Store.get().profile.pets || [];
    return '<h2 class="ob-q">Any pets at home?</h2>' +
      '<div class="ob-chips">' + PETS.map(function (p) {
        return '<button type="button" class="chip ob-chip' + (pets.indexOf(p.key) !== -1 ? ' is-on' : '') + '" data-ob-pet="' + p.key + '">' + UI.icon(p.ico) + UI.esc(p.label) + '</button>';
      }).join('') +
        /* None is an answer like the others, and only Continue moves on. It
           used to move on by itself, which took the reader past the screen
           before they had a chance to see that they had tapped the wrong
           one. */
        '<button type="button" class="chip ob-chip' + (petsNone && !pets.length ? ' is-on' : '') + '" data-ob-pets-none="1">None</button>' +
      '</div>' +
      '<p class="ob-hint">I\'ll warn you about any plant that\'s toxic to them.</p>' +
      '<div class="ob-actions"><button class="btn btn-lg" data-ob="next">Continue</button></div>';
  }

  function stepExp() {
    const cur = Store.get().profile.experience;
    return '<h2 class="ob-q">How are you with plants?</h2>' +
      '<div class="ob-opts">' + EXPERIENCE.map(function (e) {
        return '<button type="button" class="ob-opt' + (e.key === cur ? ' is-on' : '') + '" data-ob-exp="' + e.key + '">' + UI.esc(e.label) + '</button>';
      }).join('') + '</div>' +
      '<p class="ob-hint">You can change this later.</p>';
  }

  /* The plants the reader already has, by species and nothing else. The
     form's other questions (pot, room, dates) all have defaults, and a room
     cannot be chosen before one exists, so the plants wait unplaced and
     arrive in the plan's tray, ready to be dragged in once the home is
     drawn. Asking here is what lets the rest of the first run fit the
     answer: someone with plants is sent to place them, someone without is
     sent to draw the home that tells me what would grow in it. */
  function stepPlants() {
    return '<h2 class="ob-q">Any plants already?</h2>' +
      '<p class="ob-hint" style="margin-top:0">Add the ones you have and I\'ll get started.</p>' +
      '<input class="ob-search" id="ob-sp" type="search" autocomplete="off" placeholder="Search ' + window.PLANT_DATA.length + ' plants">' +
      '<div class="ob-sp-list" id="ob-sp-list">' + speciesRows('') + '</div>' +
      '<div class="ob-actions">' + plantsButton() + '</div>';
  }

  /* The list is the whole record of what has been added. A row
     counts its plants and carries a minus and a plus; there are no chips
     below it, which grew with every plant until they pushed the screen
     apart. With no search typed, the species already added come first, so
     every one of them can be found to take one away. */
  let touched = [];
  function countOf(spId) {
    return added.filter(function (id) { const p = Store.getPlant(id); return p && p.speciesId === spId; }).length;
  }
  const MINUS = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
  /* The rows on screen stay where they are while the reader taps plus and
     minus; the order is only worked out again when the list is drawn
     afresh, on arriving at the step or changing the search. */
  let shown = null;
  function speciesRows(q, keep) {
    let list = ViewGreenhouse.searchSpecies(q);
    if (keep && shown && shown.q === q) {
      list = shown.ids.map(function (id) { return list.filter(function (sp) { return sp.id === id; })[0]; }).filter(Boolean);
    } else if (!q) {
      /* In the order they were first added, and kept there at zero, so a
         row the reader is tapping minus on does not jump away mid-tap. */
      const have = touched.map(function (id) { return list.filter(function (sp) { return sp.id === id; })[0]; }).filter(Boolean);
      list = have.concat(list.filter(function (sp) { return touched.indexOf(sp.id) === -1; }).slice(0, Math.max(0, 6 - have.length)));
    } else {
      list = list.slice(0, 8);
    }
    shown = { q: q, ids: list.map(function (sp) { return sp.id; }) };
    if (!list.length) return '<p class="ob-hint" style="margin:10px auto">No match: pick its closest relative instead.</p>';
    return list.map(function (sp) {
      const n = countOf(sp.id);
      return '<div class="ob-sp-row' + (n ? ' is-on' : '') + '">' +
        '<button type="button" class="ob-sp-main" data-ob-sp="' + UI.attr(sp.id) + '" aria-label="Add a ' + UI.attr(sp.common) + '">' +
        '<span class="dx-opt-thumb">' + UI.plantTile(Store.speciesPhoto(sp.id), sp.id, sp.common) + '</span>' +
        '<span class="ob-sp-text"><span class="ob-sp-t">' + UI.esc(sp.common) + '</span>' +
          /* No toxicity warning here. The introduction should not open on a
             hazard before the reader has even arrived; the plant's page, the
             add form and the species page all say it, where the reader is
             deciding about that one plant. */
          '<span class="ob-sp-d">' + UI.esc(sp.botanical) + '</span>' +
        '</span>' +
        '</button>' +
        '<span class="ob-sp-n">' +
          (n ? '<button type="button" class="ob-sp-step" data-ob-sp-less="' + UI.attr(sp.id) + '" aria-label="One fewer ' + UI.attr(sp.common) + '">' + MINUS + '</button>' +
               '<span class="ob-sp-count">\u00D7' + n + '</span>' : '') +
          '<button type="button" class="ob-sp-step" data-ob-sp="' + UI.attr(sp.id) + '" aria-label="One more ' + UI.attr(sp.common) + '">' + UI.icon('plus') + '</button>' +
        '</span>' +
      '</div>';
    }).join('');
  }

  function plantsButton() {
    return added.length
      ? '<button class="btn btn-lg" data-ob="next">Continue with ' + UI.esc(UI.plural(added.length, 'plant')) + '</button>'
      : '<button class="btn btn-ghost" data-ob="next">None yet</button>';
  }

  function syncPlants() {
    const q = stage.querySelector('#ob-sp');
    const list = stage.querySelector('#ob-sp-list'), top = list.scrollTop;
    list.innerHTML = speciesRows(q ? q.value : '', true);
    list.scrollTop = top;
    stage.querySelector('.ob-actions').innerHTML = plantsButton();
    /* The first plant in brings the watered step into the run, and the
       last one out takes it away again, so the dots follow. */
    dots();
  }

  function addSpecies(id) {
    /* Unknown, not today: these were already at home, so the date they
       arrived is not the reader's to have to remember, and dating them today
       would hold back their first feed as if they had just been bought. */
    if (touched.indexOf(id) === -1) touched.push(id);
    const p = Store.addPlant({ speciesId: id, acquired: null });
    added.push(p.id);
    syncPlants();
  }

  function removeSpecies(id) {
    Store.deletePlant(id);
    added = added.filter(function (x) { return x !== id; });
    delete wateredPick[id];
    syncPlants();
  }

  /* Added with no last watering, every plant from the step before would
     be due today, so a reader with eight plants opened Today to sixteen
     jobs and an instruction to water things they watered yesterday. A date
     per plant spreads the first waterings over the days they really fall
     on; a plant left without one keeps "start today", which is the honest
     schedule for one nobody can date. */
  function stepWatered() {
    const many = added.length > 1;
    return '<h2 class="ob-q">Watered any of these this week?</h2>' +
      '<p class="ob-hint" style="margin-top:0">I\'ll start each plant\'s care schedule from your answer. If you can\'t remember, I\'ll start today.</p>' +
      '<div class="ob-wt-list">' +
        (many ? wateredRow('all', 'All of them') : '') +
        added.map(function (id) {
          const p = Store.getPlant(id);
          return p ? wateredRow(id, Store.displayName(p)) : '';
        }).join('') +
      '</div>' +
      '<div class="ob-actions"><button class="btn btn-lg" data-ob="next">Continue</button></div>';
  }

  /* The answer is a date, picked on Sprout's own calendar rather than the
     browser's, which looked like a different app. Sixty
     days back is plenty for "last watered", and nothing after today can be
     picked. A row left empty starts that plant today. */
  const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dayLabel(iso) {
    const d = UI.fromISO(iso);
    return d ? DAYS_SHORT[d.getDay()] + ' ' + UI.fmtDate(d) : '';
  }
  function wateredRow(id, name) {
    const date = (id === 'all' ? allPick() : wateredPick[id]) || '';
    return '<div class="ob-wt-row' + (id === 'all' ? ' is-all' : '') + '">' +
      '<span class="ob-wt-nm">' + UI.esc(name) + '</span>' +
      '<button type="button" class="ob-wt-field' + (date ? ' is-set' : '') + '" data-ob-wt-open="' + UI.attr(id) + '" data-ob-wt-name="' + UI.attr(name) + '">' +
        UI.icon('calendar') + '<span>' + UI.esc(date ? dayLabel(date) : 'Pick a date') + '</span>' +
      '</button>' +
    '</div>';
  }

  let cal = null;   // { id, name, sel, view } while the calendar is open
  function calHtml() {
    const today = UI.today(), min = UI.addDays(today, -60);
    const y = cal.view.getFullYear(), m = cal.view.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;      // weeks start on Monday
    const days = new Date(y, m + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), iso = UI.toISO(dt);
      const off = dt > today || dt < min;
      cells += '<button type="button" class="ob-cal-d' + (iso === UI.toISO(today) ? ' is-today' : '') + (iso === cal.sel ? ' is-on' : '') + '" ' +
        'data-ob-cal-d="' + iso + '"' + (off ? ' disabled' : '') + '>' + d + '</button>';
    }
    const canPrev = new Date(y, m, 0) >= min, canNext = new Date(y, m + 1, 1) <= today;
    return '<div class="ob-cal-card" role="dialog" aria-label="When was it last watered?">' +
      '<p class="ob-cal-for">' + UI.esc(cal.name) + '</p>' +
      '<div class="ob-cal-head">' +
        '<button type="button" class="ob-cal-nav" data-ob-cal-nav="-1" aria-label="Previous month"' + (canPrev ? '' : ' disabled') + '>' + UI.icon('back') + '</button>' +
        '<h3 class="ob-cal-m">' + MONTHS_FULL[m] + ' <span>' + y + '</span></h3>' +
        '<button type="button" class="ob-cal-nav is-next" data-ob-cal-nav="1" aria-label="Next month"' + (canNext ? '' : ' disabled') + '>' + UI.icon('back') + '</button>' +
      '</div>' +
      '<div class="ob-cal-wk"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>' +
      '<div class="ob-cal-grid">' + cells + '</div>' +
      '<div class="ob-cal-foot">' +
        '<button type="button" class="ob-cal-link" data-ob-cal-clear>Clear</button>' +
        '<button type="button" class="ob-cal-link" data-ob-cal-pick="' + UI.toISO(today) + '">Today</button>' +
      '</div>' +
    '</div>';
  }
  function openCal(id, name) {
    const sel = (id === 'all' ? allPick() : wateredPick[id]) || null;
    const base = sel ? UI.fromISO(sel) : UI.today();
    cal = { id: id, name: name, sel: sel, view: new Date(base.getFullYear(), base.getMonth(), 1) };
    let layer = root.querySelector('.ob-cal');
    if (!layer) { layer = document.createElement('div'); layer.className = 'ob-cal'; root.appendChild(layer); }
    layer.innerHTML = calHtml();
    void layer.offsetWidth;
    layer.classList.add('is-on');
  }
  function drawCal() { const layer = root.querySelector('.ob-cal'); if (layer && cal) layer.innerHTML = calHtml(); }
  function closeCal() {
    const layer = root && root.querySelector('.ob-cal');
    cal = null;
    if (!layer) return;
    layer.classList.remove('is-on');
    setTimeout(function () { if (!cal && layer.parentNode) layer.remove(); }, 260);
  }
  function pickCal(iso) {
    if (!cal) return;
    const id = cal.id;
    cal.sel = iso; drawCal();
    setWatered(id, iso);
    /* A beat on the lit day, so the choice is seen before the calendar goes. */
    setTimeout(closeCal, iso ? 220 : 0);
  }

  /* The "All of them" row shows a date only while every plant shares it. */
  function allPick() {
    const first = wateredPick[added[0]];
    return first && added.every(function (id) { return wateredPick[id] === first; }) ? first : null;
  }

  /* A date, or null for Clear, which puts the plant back to starting today. */
  function setWatered(id, iso) {
    const ids = id === 'all' ? added.slice() : [id];
    ids.forEach(function (pid) {
      if (!iso) {
        delete wateredPick[pid];
        Store.updatePlant(pid, { lastWatered: null });
      } else {
        wateredPick[pid] = iso;
        Store.updatePlant(pid, { lastWatered: iso });
      }
    });
    stage.querySelector('.ob-wt-list').innerHTML =
      (added.length > 1 ? wateredRow('all', 'All of them') : '') +
      added.map(function (pid) { const p = Store.getPlant(pid); return p ? wateredRow(pid, Store.displayName(p)) : ''; }).join('');
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
      '<p class="ob-hint" style="margin-top:0">I round it to about a kilometre and send it only to Open-Meteo, for a forecast that lets me offer to stretch or shorten watering before a wet or dry spell.</p>' +
      '<div class="ob-actions">' +
        '<button class="btn btn-lg" data-ob="locate">' + UI.icon('pin') + 'Use my location</button>' +
        /* A no here is the same no as the card on Today, so it holds there
           too rather than being asked again the next morning. */
        '<button class="btn btn-ghost" data-ob="loc-later">Not now</button>' +
      '</div>' +
      '<p class="ob-hint ob-note" id="ob-loc-note" hidden></p>';
  }

  const RENDER = { name: stepName, pets: stepPets, exp: stepExp, plants: stepPlants, watered: stepWatered, loc: stepLoc, hemi: stepHemi };

  /* ---------- Flow ---------- */

  function dots() {
    dotsEl.innerHTML = STEPS.map(function (s, i) {
      if (!live(s)) return '';
      return '<span class="ob-dot' + (i === at ? ' is-on' : i < at ? ' is-done' : '') + '"></span>';
    }).join('');
  }

  /* One step leaves upward and blurs; the next arrives from below. The
     swap waits for the exit so the two are never on screen together. */
  function go(i) {
    if (busy || finished) return;
    if (cal) closeCal();
    busy = true;
    const swap = function () {
      at = i;
      stage.innerHTML = '<div class="ob-step">' + RENDER[STEPS[i]]() + '</div>';
      dots();
      backEl.hidden = i === 0;
      /* On the location question "Not now" already is the skip, so a
         second way out under it would only be a second word for the tap. */
      skipEl.hidden = STEPS[i] === 'loc';
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
    let i = at + 1;
    while (i < STEPS.length && !live(STEPS[i])) i++;
    if (i >= STEPS.length) finish(); else go(i);
  }

  /* Answers are already saved, so stepping back only re-asks: the step
     renders with what was chosen lit, and choosing again overwrites it. */
  function back() {
    if (!root || finished || busy || at <= 0) return;
    if (STEPS[at] === 'name') saveName();
    let i = at - 1;
    while (i > 0 && !live(STEPS[i])) i--;
    go(i);
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
      if (err) { note.textContent = err.message + ' You can set it later in You, from the top of Today.'; if (btn) btn.disabled = false; return; }
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
      /* The sprig rather than the wordmark: the first thing on screen is
         the mark the reader will see on the home screen and the store. */
      '<div class="ob-brand" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M50 84V40"/><path d="M50 58C36 58 28 49 28 36c14 0 22 9 22 22Z"/><path d="M50 46c14 0 22-9 22-22-14 0-22 9-22 22Z"/></svg></div>' +
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
        else if (a === 'loc-later') {
          Store.snoozeLocationAsk();
          if (Store.get().profile.hemisphere) finish(); else next();
        }
        return;
      }
      const pet = t.closest('[data-ob-pet]');
      if (pet) {
        const key = pet.getAttribute('data-ob-pet'), pets = (Store.get().profile.pets || []).slice(), i = pets.indexOf(key);
        if (i === -1) pets.push(key); else pets.splice(i, 1);
        Store.updateProfile({ pets: pets });
        pet.classList.toggle('is-on', i === -1);
        petsNone = false;
        const none = stage.querySelector('[data-ob-pets-none]');
        if (none) none.classList.remove('is-on');
        return;
      }
      if (t.closest('[data-ob-pets-none]')) {
        petsNone = true;
        Store.updateProfile({ pets: [] });
        stage.querySelectorAll('[data-ob-pet]').forEach(function (b) { b.classList.remove('is-on'); });
        t.closest('[data-ob-pets-none]').classList.add('is-on');
        return;
      }
      const layer = t.closest('.ob-cal');
      if (layer) {
        const d = t.closest('[data-ob-cal-d]');
        if (d && !d.disabled) { pickCal(d.getAttribute('data-ob-cal-d')); return; }
        const nav = t.closest('[data-ob-cal-nav]');
        if (nav && !nav.disabled) { cal.view = new Date(cal.view.getFullYear(), cal.view.getMonth() + Number(nav.getAttribute('data-ob-cal-nav')), 1); drawCal(); return; }
        if (t.closest('[data-ob-cal-clear]')) { pickCal(null); return; }
        const pk = t.closest('[data-ob-cal-pick]');
        if (pk) { pickCal(pk.getAttribute('data-ob-cal-pick')); return; }
        if (!t.closest('.ob-cal-card')) closeCal();
        return;
      }
      const open = t.closest('[data-ob-wt-open]');
      if (open) { openCal(open.getAttribute('data-ob-wt-open'), open.getAttribute('data-ob-wt-name')); return; }
      const sp = t.closest('[data-ob-sp]');
      if (sp) { addSpecies(sp.getAttribute('data-ob-sp')); return; }
      const less = t.closest('[data-ob-sp-less]');
      if (less) {
        /* The most recent of that species goes, with its watered answer. */
        const spId = less.getAttribute('data-ob-sp-less');
        const last = added.slice().reverse().filter(function (id) { const p = Store.getPlant(id); return p && p.speciesId === spId; })[0];
        if (last) removeSpecies(last);
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

    root.addEventListener('input', function (e) {
      if (e.target.id !== 'ob-sp') return;
      stage.querySelector('#ob-sp-list').innerHTML = speciesRows(e.target.value);
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cal) { e.preventDefault(); e.stopPropagation(); closeCal(); return; }
      if (e.key === 'Enter' && e.target.id === 'ob-name') { e.preventDefault(); saveName(); next(); }
    });

    /* Let the wordmark settle out before the first question arrives. */
    setTimeout(function () { go(0); }, 420);
  }

  /* app.js hands Android's Back button here while the introduction is up. */
  function isOpen() { return !!root && !finished; }

  return { shouldRun: shouldRun, start: start, back: back, isOpen: isOpen };
})();
