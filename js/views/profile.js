/* ==========================================================================
   Sprout — You
   --------------------------------------------------------------------------
   Your name, your pets (which drives the toxicity warnings), your location
   (which drives the weather sync and, via latitude, the hemisphere), plus
   storage diagnostics and a proper backup/restore.
   ========================================================================== */

window.ViewProfile = (function () {

  /* `ico` is an icon name for UI.icon(), not a glyph. The two marks are
     deliberately different shapes — a paw and a head in profile — because
     at 13px two paws would make the rows indistinguishable, and this is the
     one control in the app where picking the wrong row means a warning you
     needed never arrives. */
  /* Both tables live in LOOKUPS because the first-run introduction asks the
     same two questions on the splash, and two copies of a list of answers
     would drift the first time one was edited. */
  const PETS = LOOKUPS.PETS;
  const EXPERIENCE = LOOKUPS.EXPERIENCE;

  function expToIndex(key) {
    for (let i = 0; i < EXPERIENCE.length; i++) {
      if (EXPERIENCE[i].key === key) return i + 1;
    }
    return Math.ceil(EXPERIENCE.length / 2);   /* nothing stored — rest in the middle */
  }

  /* The thumb's position as a percentage of the rail, for the filled part of
     the track. The ends land exactly on 0 and 100 so the fill never stops a
     pixel short of a thumb parked at either end. */
  function expFill(index) {
    return Math.round(((index - 1) / (EXPERIENCE.length - 1)) * 100) + '%';
  }

  /* One span per character with a staggered delay, so the reading resolves
     left to right the way the splash wordmark does. Spaces are kept as
     their own spans with white-space:pre, or a wrapped line would lose them. */
  function letters(text) {
    return String(text).split('').map(function (ch, i) {
      return '<span style="animation-delay:' + (i * 14) + 'ms">' + UI.esc(ch) + '</span>';
    }).join('');
  }

  function expReading(key) {
    for (let i = 0; i < EXPERIENCE.length; i++) {
      if (EXPERIENCE[i].key === key) return EXPERIENCE[i].label;
    }
    return 'Slide to tell me';
  }

  function title() { return 'You'; }

  /* Same slot as the + on Today, so the one control in the top-right corner
     of a tab is always the thing that tab defers to.

     Sliders rather than the gear: UI's gear is a circle with eight radial
     spokes, which is the same construction as its sun — and the sun is the
     daylight-theme button sitting in the sidebar on the very same screen.
     Two identical marks doing different jobs is worse than a less
     conventional glyph. */
  function actions() {
    return '<button class="icon-btn" data-act="settings" aria-label="Settings">' +
      UI.icon('sliders') + '</button>';
  }

  function onAction(act) { if (act === 'settings') App.go('/settings'); }
  function sub() {
    const p = Store.get().profile;
    return p.location ? p.location.label : 'Profile & settings';
  }

  /* ======================================================================
     Location & weather
     ====================================================================== */

  function locationSheet() {
    const hemi = Store.hemisphere();
    const hemiSet = !Store.hemisphereIsGuess();

    const body =
      '<p class="dim small" style="margin:0 0 16px;line-height:1.6">' +
        'I use this for two things: your local forecast, so I can offer to stretch or shorten watering before ' +
        'a wet or dry spell, and your latitude — which tells me which hemisphere you\'re in, and therefore ' +
        'which months are the growing season and which way a bright window faces.' +
      '</p>' +

      '<div class="field">' +
        '<button class="btn btn-block" id="loc-me">' + UI.icon('pin') + 'Use my current location</button>' +
      '</div>' +

      '<div class="row" style="gap:10px;margin:14px 0"><hr class="divider" style="flex:1;margin:0">' +
        '<span class="tiny muted">or search</span><hr class="divider" style="flex:1;margin:0"></div>' +

      '<label class="field"><span class="label">Town or city</span>' +
        '<input class="input input-search" id="loc-q" type="search" autocomplete="off" ' +
          'placeholder="Sydney, Manchester, Lisbon…"></label>' +

      '<div id="loc-results" class="stack" style="gap:6px"></div>' +

      /* The third answer, for a reader who does not want to hand over a town
         at all. It buys the half of this sheet that does not need a
         forecast: seasons and window aspects both turn on the hemisphere
         alone. The hint says plainly what is given up, because an option
         offered beside two better ones has to be honest about being the
         lesser one. */
      '<div class="row" style="gap:10px;margin:18px 0 12px"><hr class="divider" style="flex:1;margin:0">' +
        '<span class="tiny muted">or general location</span><hr class="divider" style="flex:1;margin:0"></div>' +

      '<div class="row-wrap" id="loc-hemi">' +
        '<button type="button" class="chip' + (hemiSet && hemi === 'north' ? ' is-on' : '') + '" ' +
          'data-loc-hemi="north">Northern hemisphere</button>' +
        '<button type="button" class="chip' + (hemiSet && hemi === 'south' ? ' is-on' : '') + '" ' +
          'data-loc-hemi="south">Southern hemisphere</button>' +
      '</div>' +
      '<p class="hint">Enough for your seasons and which way a bright window faces. No forecast, ' +
        'so no offers to stretch or shorten watering before a spell of weather.</p>' +

      '<p class="hint" id="loc-note">I round it to about a kilometre, then send that to Open-Meteo for ' +
        'the forecast. Nowhere else, and there\'s no account behind any of it.</p>';

    UI.openSheet('Your location', body, function (root) {
      const input = root.querySelector('#loc-q');
      const list = root.querySelector('#loc-results');
      const note = root.querySelector('#loc-note');
      let timer = null;

      function choose(place) {
        Store.updateProfile({ location: { label: place.label, lat: place.lat, lon: place.lon } });
        Store.setWeather(null);
        UI.closeSheet();
        UI.toast('Location set to ' + place.label, 'leaf');
        App.refresh();
        App.syncWeather(true);
      }

      root.querySelector('#loc-hemi').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-loc-hemi]');
        if (!btn) return;
        const pick = btn.getAttribute('data-loc-hemi');
        Store.updateProfile({ hemisphere: pick });
        UI.closeSheet();
        UI.toast(pick === 'south' ? 'Southern hemisphere it is' : 'Northern hemisphere it is', 'leaf');
        App.refresh();
      });

      root.querySelector('#loc-me').addEventListener('click', function () {
        note.textContent = 'Asking your browser for your location…';
        Weather.locateMe(function (err, place) {
          if (err) { note.textContent = err.message; return; }
          choose(place);
        });
      });

      input.addEventListener('input', function () {
        clearTimeout(timer);
        const q = input.value.trim();
        if (q.length < 2) { list.innerHTML = ''; return; }
        note.textContent = 'Searching…';
        timer = setTimeout(function () {
          Weather.searchPlace(q, function (err, places) {
            if (err) {
              note.textContent = err.message + ' Everything else works without it.';
              return;
            }
            note.textContent = places.length ? 'Pick the closest match.' : 'No match — try a larger nearby town.';
            list.innerHTML = places.map(function (p, i) {
              return '<button class="dx-opt" data-place="' + i + '" style="margin:0">' +
                '<span class="dx-opt-ico">' + UI.icon('pin') + '</span>' +
                '<span style="min-width:0"><span class="dx-opt-t">' + UI.esc(p.label) + '</span>' +
                '<span class="dx-opt-d">' + p.lat.toFixed(2) + ', ' + p.lon.toFixed(2) +
                  ' · ' + (p.lat < 0 ? 'southern' : 'northern') + ' hemisphere</span></span>' +
              '</button>';
            }).join('');
            list.querySelectorAll('[data-place]').forEach(function (btn) {
              btn.addEventListener('click', function () {
                choose(places[Number(btn.getAttribute('data-place'))]);
              });
            });
          });
        }, 380);
      });
    });
  }

  /* ======================================================================
     The view
     ====================================================================== */

  function render() {
    const prof = Store.get().profile;
    const settings = Store.get().settings;
    const sum = Schedule.summary();
    const hemi = Store.hemisphere();
    /* Storage moved to Settings, but the photo count is still one of the
       four tiles below — it is a fact about the greenhouse, not about the
       browser's quota. */
    const usage = Store.storageUsage();

    let html = '';

    /* --- Identity ---
       Wrapped in .section only for its 42px bottom margin, exactly as the
       room view's environment block is. .section spaces below itself and
       nothing else, so this card — the one opening block with no section
       title of its own — had nothing under it and the PETS rule landed flush
       against its bottom edge, reading as that card's caption rather than the
       next section's heading. Every later head on the page has air above it,
       which is what made the first one look like a fault instead of a style.

       The inline margin-bottom:0 stays, and now actually does something:
       .field carries an 18px bottom margin for stacking fields in a form, but
       a lone field inside a card wants the card's own padding to be the whole
       of its bottom spacing. That declaration was inert for as long as .field
       was inline, so this is the first render in which it has any effect. */
    html += '<div class="section"><div class="card">' +
      '<label class="field" style="margin-bottom:0"><span class="label">What should I call you?</span>' +
        '<input class="input" id="p-name" maxlength="30" placeholder="Your name" ' +
          'value="' + UI.attr(prof.name) + '"></label>' +
    '</div></div>';

    /* --- Pets --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Pets</h2>' +
        '<span class="section-note">drives toxicity warnings</span></div>' +
      '<div class="card">' +
        '<div class="row-wrap">' + PETS.map(function (p) {
          const on = (prof.pets || []).indexOf(p.key) !== -1;
          return '<button class="chip' + (on ? ' is-on' : '') + '" data-pet="' + p.key + '">' +
            UI.icon(p.ico) + UI.esc(p.label) + '</button>';
        }).join('') + '</div>' +
        '<p class="hint">Do you have any pets at home? Tag the relevant icon and I\'ll make sure to warn ' +
          'you about any risks.</p>' +
      '</div>' +
    '</div>';

    /* --- Experience ---
       A slider, not three chips. The chips laid the answers out as three
       unrelated buttons when what is being asked is one quantity with an
       order to it — and the order is the whole of the meaning. Dragging
       along a rail says that in the shape of the control.

       The stored keys are unchanged: position 1, 2 and 3 are still 'new',
       'some' and 'confident'. With nothing stored the thumb rests in the
       middle, because a range input has no null position to sit at, and the
       reading above it says so rather than letting a default masquerade as
       an answer. */
    const expIndex = expToIndex(prof.experience);
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">How are you with plants?</h2></div>' +
      '<div class="card">' +
        '<div class="slider-value' + (prof.experience ? '' : ' is-unset') + '" id="p-exp-value">' +
          letters(expReading(prof.experience)) +
        '</div>' +
        /* The drawn control. The input is last so :focus-visible on it can
           reach the thumb with a sibling combinator. */
        '<div class="slider-shell' + (prof.experience ? '' : ' is-unset') + '" id="p-exp-shell" ' +
          'style="--fill:' + expFill(expIndex) + '">' +
          '<div class="slider-rail"><div class="slider-fill"></div></div>' +
          '<input class="slider" type="range" id="p-exp" min="1" max="' + EXPERIENCE.length + '" step="1" ' +
            'value="' + expIndex + '" aria-label="How are you with plants?" ' +
            'aria-valuetext="' + UI.attr(expReading(prof.experience)) + '">' +
          '<div class="slider-travel" aria-hidden="true"><div class="slider-thumb"></div></div>' +
        '</div>' +
        '<div class="slider-ends"><span>Beginner</span><span>Experienced</span></div>' +
      '</div>' +
    '</div>';

    /* --- Reminders ---
       Two shapes, because two runtimes can promise different things. The
       shell schedules with the operating system and can keep a morning
       appointment; a browser cannot wake a phone at all. Offering the same
       switch in both would be the app promising something it has no way of
       delivering, which is the one thing the voice rules will not have.

       The permission prompt is never raised on its own account either. The
       toggle raises it, and only once the reader has reached for it: a cold
       prompt on a first visit is the quickest way to be refused for good,
       and a refusal cannot be taken back from inside the page. */
    if (window.Notify) {
      const nState = Notify.state();
      const native = Notify.isNative();
      const on = native && !!settings.remind && nState === 'granted';
      const hour = typeof settings.remindHour === 'number' ? settings.remindHour : 8;
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">Reminders</h2>' +
          '<span class="section-note">one a day, at most</span></div>' +
        '<div class="card">';

      if (native) {
        html +=
          '<label class="row" style="gap:10px;cursor:pointer">' +
            '<input type="checkbox" id="p-remind"' + (on ? ' checked' : '') +
              (nState === 'denied' ? ' disabled' : '') + ' ' +
              'style="width:18px;height:18px;accent-color:var(--leaf)">' +
            '<span style="flex:1;min-width:0"><span style="font-weight:600;font-size:14px">Remind me in the mornings</span>' +
              '<span class="tiny muted" style="display:block">Only on the days something is actually due. ' +
                'Nothing due, nothing from me.</span></span>' +
          '</label>' +
          (on
            ? '<hr class="divider">' +
              '<label class="field" style="margin:0"><span class="label">What time</span>' +
                '<select class="input select" id="p-remind-hour">' +
                  [6, 7, 8, 9, 10, 11, 12, 17, 18, 19].map(function (h) {
                    const lbl = h === 12 ? 'Midday' : (h > 12 ? (h - 12) + ' pm' : h + ' am');
                    return '<option value="' + h + '"' + (h === hour ? ' selected' : '') + '>' + lbl + '</option>';
                  }).join('') +
                '</select></label>' +
              '<div class="row" style="gap:8px;margin-top:12px">' +
                '<button class="btn btn-sm btn-soft" data-remind-test="1">' + UI.icon('bell') + 'Send me one now</button>' +
              '</div>' +
              '<p class="hint">' + UI.esc(remindPreview()) + '</p>'
            : nState === 'denied'
              ? '<p class="hint">Notifications are switched off for Sprout in your phone\'s settings. ' +
                'That one is out of my hands — it lives alongside every other app\'s.</p>'
              : '');
      } else {
        html +=
          '<p class="hint" style="margin-top:0">Scheduled reminders come with the app. In a browser I can\'t ' +
            'wake your phone, so here I only ever show one when you ask for it.</p>' +
          '<p class="hint">' + UI.esc(remindPreview()) + '</p>' +
          (Notify.state() === 'unsupported'
            ? ''
            : '<div class="row" style="gap:8px;margin-top:12px">' +
                '<button class="btn btn-sm btn-soft" data-remind-test="1">' + UI.icon('bell') + 'Show me one</button>' +
              '</div>');
      }

      html += '</div></div>';
    }

    /* --- Location & weather --- */
    const line = Weather.currentLine();
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Location &amp; weather</h2></div>' +
      '<div class="card">' +
        (prof.location
          ? '<div class="row" style="gap:11px">' +
              '<span class="fact-ico">' + UI.icon(line ? line.ico : 'pin') + '</span>' +
              '<div style="flex:1;min-width:0">' +
                '<div style="font-weight:650">' + UI.esc(prof.location.label) + '</div>' +
                '<div class="tiny muted">' +
                  (line ? line.temp + '°C, ' + UI.esc(line.label.toLowerCase()) + ' · ' : '') +
                  UI.esc(hemi === 'south' ? 'Southern' : 'Northern') + ' hemisphere · ' +
                  UI.esc(sum.seasonMeta.label.toLowerCase()) +
                '</div>' +
              '</div>' +
              '<button class="btn btn-sm btn-ghost nowrap" data-loc="1">Change</button>' +
            '</div>' +
            '<hr class="divider">' +
            '<label class="row" style="gap:10px;cursor:pointer">' +
              '<input type="checkbox" id="p-wsync"' + (settings.weatherSync ? ' checked' : '') + ' ' +
                'style="width:18px;height:18px;accent-color:var(--leaf)">' +
              '<span style="flex:1;min-width:0"><span style="font-weight:600;font-size:14px">Weather-aware watering</span>' +
                '<span class="tiny muted" style="display:block">Let me watch the forecast and suggest ' +
                  'adjustments before a dry or wet spell.</span></span>' +
            '</label>' +
            '<div class="row" style="gap:8px;margin-top:12px">' +
              '<button class="btn btn-sm btn-soft" data-refresh="1">Refresh forecast</button>' +
              '<button class="btn btn-sm btn-ghost" data-clear-dismissed="1">Reset dismissed tips</button>' +
            '</div>'
          : '<div class="row" style="gap:11px">' +
              /* Same plate as the set-location row above it, so the two
                 states of this card sit in the same place on the page
                 instead of jumping when a location is saved. */
              '<span class="fact-ico">' + UI.icon('pin') + '</span>' +
              '<div style="flex:1;min-width:0">' +
                '<div style="font-weight:650">No location set</div>' +
                '<p class="tiny muted" style="margin:2px 0 0">I work fine without it — you just lose the ' +
                  'forecast suggestions.</p>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-block" data-loc="1" style="margin-top:12px">' + UI.icon('pin') +
              'Set my location</button>' +
            /* Without a latitude this is the one thing I still have to know,
               because it decides the seasons and which way the bright
               windows face. The time zone gives a good guess; this is where
               the reader overrules it, and it has to be here rather than
               buried, since a wrong answer inverts every piece of light
               advice in the app without ever looking wrong. */
            '<hr class="divider">' +
            '<div class="label" style="margin-bottom:8px">Which half of the world?</div>' +
            '<div class="row-wrap">' +
              '<button class="chip' + (hemi === 'north' ? ' is-on' : '') + '" data-hemi="north">' +
                'Northern</button>' +
              '<button class="chip' + (hemi === 'south' ? ' is-on' : '') + '" data-hemi="south">' +
                'Southern</button>' +
            '</div>' +
            '<p class="hint">' +
              (Store.hemisphereIsGuess()
                ? 'I\'ve guessed ' + (hemi === 'south' ? 'southern' : 'northern') +
                  ' from your device\'s time zone. It decides your seasons, and which way your bright ' +
                  'windows face — tap the other one if I have it wrong.'
                : 'Set by you. This decides your seasons, and which way your bright windows face.') +
            '</p>') +
      '</div>' +
    '</div>';

    /* --- Your greenhouse at a glance --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Your greenhouse</h2></div>' +
      /* Three of the four go somewhere. Photos does not yet — there is no
         page of all photos to go to, and a tile that looks like a link and
         is not would teach the reader to stop trying the others. */
      '<div class="grid grid-2">' +
        stat('Plants', sum.plantCount, '/greenhouse/plants') +
        stat('Rooms', sum.roomCount, '/greenhouse/rooms') +
        stat('Diary entries', Store.get().logs.length, '/diary') +
        stat('Photos', usage.photoCount) +
      '</div>' +
    '</div>';

    return html;
  }

  function stat(label, value, goto) {
    const inner = '<div class="eyebrow">' + UI.esc(label) + '</div>' +
      '<div style="font-family:var(--serif);font-size:26px;margin-top:2px">' + value + '</div>';
    return goto
      ? '<button class="card stat-go" data-goto="' + UI.attr(goto) + '">' + inner + '</button>'
      : '<div class="card">' + inner + '</div>';
  }

  function mount(root) {
    const name = root.querySelector('#p-name');
    if (name) {
      name.addEventListener('change', function () {
        Store.updateProfile({ name: name.value.trim() });
        UI.toast('Saved', 'leaf');
      });
    }

    /* 'input', not the delegated click handler, and no App.refresh() — a
       re-render mid-drag would replace the element under the reader's
       finger and drop the gesture. The reading updates in place instead,
       and the value is written on every step, so letting go is all the
       saving it needs. */
    const exp = root.querySelector('#p-exp');
    if (exp) {
      const shell = root.querySelector('#p-exp-shell');
      const expValue = root.querySelector('#p-exp-value');
      let lastIndex = Number(exp.value);
      exp.addEventListener('input', function () {
        const index = Number(exp.value);
        const picked = EXPERIENCE[index - 1];
        if (!picked) return;
        Store.updateProfile({ experience: picked.key });
        shell.classList.remove('is-unset');
        shell.style.setProperty('--fill', expFill(index));
        exp.setAttribute('aria-valuetext', picked.label);
        /* Only re-reveal the reading when the stop actually changes. A drag
           fires input on every pixel; re-running the entrance on each one
           would keep the text permanently mid-blur. */
        if (index !== lastIndex) {
          lastIndex = index;
          expValue.classList.remove('is-unset');
          expValue.innerHTML = letters(picked.label);
        }
      });
    }

    const remind = root.querySelector('#p-remind');
    if (remind) {
      remind.addEventListener('change', function () {
        if (!remind.checked) {
          Store.updateSettings({ remind: false });
          UI.toast('Reminders off', 'leaf');
          App.refresh();
          return;
        }
        /* Checked optimistically, then corrected: a permission sheet the
           reader dismisses must leave the switch where it really is. */
        remind.checked = false;
        Notify.ask().then(function (result) {
          if (result !== 'granted') {
            UI.toast(result === 'denied' ? 'Your browser said no to notifications' : 'Reminders need permission', 'warn');
            App.refresh();
            return;
          }
          Store.updateSettings({ remind: true });
          UI.toast('Reminders on', 'leaf');
          App.refresh();
        });
      });
    }

    const rhour = root.querySelector('#p-remind-hour');
    if (rhour) {
      rhour.addEventListener('change', function () {
        Store.updateSettings({ remindHour: Number(rhour.value) });
        UI.toast('I\'ll check in then', 'leaf');
        App.refresh();
      });
    }

    const wsync = root.querySelector('#p-wsync');
    if (wsync) {
      wsync.addEventListener('change', function () {
        Store.updateSettings({ weatherSync: wsync.checked });
        if (wsync.checked) App.syncWeather(true);
        else App.renderWeatherChip();
        UI.toast(wsync.checked ? 'Weather sync on' : 'Weather sync off', 'leaf');
      });
    }

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-remind-test]')) {
        const msg = Notify.todayMessage();
        if (!msg) { UI.toast('Nothing is due today, so there is nothing to send', 'leaf'); return; }
        /* On the shell a toggle has already been through this. In a browser
           there is no toggle, so the button itself is the moment to ask. */
        Notify.ask().then(function (result) {
          if (result !== 'granted') {
            UI.toast(result === 'denied' ? 'Notifications are switched off for Sprout' : 'That needs permission first', 'warn');
            return;
          }
          Notify.show(msg).then(function (ok) {
            if (!ok) UI.toast('I could not show that one', 'warn');
          });
        });
        return;
      }

      const pet = e.target.closest('[data-pet]');
      if (pet) {
        const key = pet.getAttribute('data-pet');
        const pets = (Store.get().profile.pets || []).slice();
        const at = pets.indexOf(key);
        if (at === -1) pets.push(key); else pets.splice(at, 1);
        Store.updateProfile({ pets: pets });
        App.refresh();
        return;
      }

      const goto = e.target.closest('[data-goto]');
      if (goto) { App.go(goto.getAttribute('data-goto')); return; }

      const hemiBtn = e.target.closest('[data-hemi]');
      if (hemiBtn) {
        Store.updateProfile({ hemisphere: hemiBtn.getAttribute('data-hemi') });
        App.refresh();
        return;
      }

      if (e.target.closest('[data-loc]')) { locationSheet(); return; }

      if (e.target.closest('[data-refresh]')) {
        UI.toast('Checking your forecast…');
        Weather.refresh(function (err) {
          if (err) { UI.toast(err.message, 'warn'); return; }
          UI.toast('Forecast updated', 'leaf');
          App.refresh();
        }, true);
        return;
      }

      if (e.target.closest('[data-clear-dismissed]')) {
        Store.updateSettings({ dismissed: [] });
        UI.toast('Tips will show again', 'leaf');
        return;
      }

    });
  }

  /* ======================================================================
     First run
     ====================================================================== */

  /* Just the introduction and the two doors. The name and pet fields that
     used to sit here are asked on the splash now, one at a time, before this
     sheet opens; asking again would be the same question twice in a minute. */
  /* What the next reminder will actually say, shown under the switch. A
     reader deciding whether to be interrupted should be able to see the
     interruption first. */
  function remindPreview() {
    const today = Notify.todayMessage();
    if (today) return 'Today it would say: ' + today.title + '.';
    return 'Nothing is due today, so today it would stay quiet.';
  }

  function welcomeSheet() {
    const name = (Store.get().profile.name || '').trim();
    const body =
      '<p class="dim" style="margin:0 0 18px;line-height:1.65">' +
        'Hi' + (name ? ' ' + UI.esc(name) : '') + ', I\'m Sprout, and this is a home for your houseplants. Tell me what you have and which room ' +
        'they are in, and we can work out a routine around what each one actually needs — the species\' own ' +
        'requirements, adjusted for your pot, your light and the season you are really in.' +
      '</p>' +

      '<div class="stack" style="gap:8px;margin-top:18px">' +
        '<button class="btn btn-lg" id="w-go">Set up my greenhouse</button>' +
        '<button class="btn btn-ghost" id="w-skip">Let me look around first</button>' +
      '</div>';

    UI.openSheet('Welcome to Sprout', body, function (root) {
      function save() {
        Store.updateSettings({ seenWelcome: true });
      }

      /* Straight into the planner, the same door the empty greenhouse
         opens. It used to drop the reader into the add-a-room form, which
         made a described room the default and the plan an afterthought —
         the opposite of the order the greenhouse itself now leads with. The
         quiet "or just add a room" route is one tap back. */
      root.querySelector('#w-go').addEventListener('click', function () {
        save();
        UI.closeSheet();
        App.go('/plan');
      });

      root.querySelector('#w-skip').addEventListener('click', function () {
        save();
        UI.closeSheet();
        App.refresh();
      });
    }, function () {
      // Closing by any other means still counts as seen.
      Store.updateSettings({ seenWelcome: true });
    });
  }

  return {
    title: title, sub: sub, actions: actions, onAction: onAction,
    render: render, mount: mount,
    welcomeSheet: welcomeSheet, locationSheet: locationSheet
  };
})();
