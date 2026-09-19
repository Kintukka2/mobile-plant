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
  const PETS = [
    { key: 'cats', label: 'Cats', ico: 'paw' },
    { key: 'dogs', label: 'Dogs', ico: 'dog' }
  ];

  const EXPERIENCE = [
    { key: 'new',       label: 'Just starting out' },
    { key: 'some',      label: 'Killed a few, learning' },
    { key: 'confident', label: 'Confident' }
  ];

  function title() { return 'You'; }
  function sub() {
    const p = Store.get().profile;
    return p.location ? p.location.label : 'Profile & settings';
  }

  /* ======================================================================
     Location & weather
     ====================================================================== */

  function locationSheet() {
    const body =
      '<p class="dim small" style="margin:0 0 16px;line-height:1.6">' +
        'Sprout uses your location for two things: your local forecast, so it can offer to stretch or shorten ' +
        'watering before a wet or dry spell, and your latitude — which tells it which hemisphere you are in, ' +
        'and therefore which months are the growing season and which way a bright window faces.' +
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
      '<p class="hint" id="loc-note">Weather comes from Open-Meteo. No account, no API key, and your ' +
        'coordinates never leave your browser except in that one request.</p>';

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
              note.textContent = err.message + ' You can still use Sprout without weather.';
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
     Backup & restore
     ====================================================================== */

  function exportData() {
    try {
      const json = Store.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sprout-backup-' + UI.toISO(new Date()) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1200);
      UI.toast('Backup downloaded', 'leaf');
    } catch (e) {
      console.error(e);
      UI.toast('Could not create the backup', 'warn');
    }
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        UI.confirmSheet('Restore this backup?',
          'Everything currently in Sprout will be replaced by the contents of ' + file.name + '.',
          'Restore', function () {
            try {
              Store.importAll(reader.result);
              UI.toast('Backup restored', 'leaf');
              App.go('/today');
              App.refresh();
            } catch (e) {
              console.error(e);
              UI.toast(e.message || 'That file could not be read', 'warn');
            }
          });
      };
      reader.onerror = function () { UI.toast('Could not read that file', 'warn'); };
      reader.readAsText(file);
      if (input.parentNode) input.parentNode.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  /* ======================================================================
     The view
     ====================================================================== */

  function render() {
    const prof = Store.get().profile;
    const settings = Store.get().settings;
    const sum = Schedule.summary();
    const usage = Store.storageUsage();
    const hemi = Store.hemisphere();

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
      '<label class="field" style="margin-bottom:0"><span class="label">What should Sprout call you?</span>' +
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
        '<p class="hint">Tell Sprout who you live with and it will warn you before you add something ' +
          'that would hurt them — and stay quiet about the rest. Ratings follow the ASPCA\'s.</p>' +
      '</div>' +
    '</div>';

    /* --- Experience --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">How are you with plants?</h2></div>' +
      '<div class="card"><div class="row-wrap">' + EXPERIENCE.map(function (x) {
        return '<button class="chip' + (prof.experience === x.key ? ' is-on' : '') + '" ' +
          'data-exp="' + x.key + '">' + UI.esc(x.label) + '</button>';
      }).join('') + '</div></div>' +
    '</div>';

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
                '<span class="tiny muted" style="display:block">Watch the forecast and suggest schedule ' +
                  'adjustments before dry or wet spells.</span></span>' +
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
                '<p class="tiny muted" style="margin:2px 0 0">Without it Sprout still works — you just lose the ' +
                  'forecast-based suggestions, and it assumes you are in the ' +
                  (hemi === 'south' ? 'southern' : 'northern') + ' hemisphere for seasons.</p>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-block" data-loc="1" style="margin-top:12px">' + UI.icon('pin') +
              'Set my location</button>') +
      '</div>' +
    '</div>';

    /* --- Your greenhouse at a glance --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Your greenhouse</h2></div>' +
      '<div class="grid grid-2">' +
        stat('Plants', sum.plantCount) +
        stat('Rooms', sum.roomCount) +
        stat('Diary entries', Store.get().logs.length) +
        stat('Photos', usage.photoCount) +
      '</div>' +
    '</div>';

    /* --- Storage --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Storage</h2>' +
        '<span class="section-note">' + usage.totalMB + 'MB used</span></div>' +
      '<div class="card">' +
        '<div style="height:8px;border-radius:99px;background:var(--paper-deep);overflow:hidden">' +
          '<div style="height:100%;width:' + usage.pctUsed + '%;border-radius:99px;background:' +
            (usage.pctUsed > 85 ? 'var(--terra)' : 'var(--leaf)') + '"></div>' +
        '</div>' +
        '<p class="hint">' + usage.photoMB + 'MB of that is ' + UI.plural(usage.photoCount, 'photo') + '. ' +
          'Browsers allow Sprout around 5MB in total, so photos are shrunk to about 1000px before they are ' +
          'saved — roughly 100KB each.' +
          (usage.pctUsed > 85 ? ' <strong>You are running low. Delete a few older photos.</strong>' : '') +
        '</p>' +
      '</div>' +
    '</div>';

    /* --- Backup --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Backup</h2></div>' +
      '<div class="card">' +
        '<p class="small dim" style="margin:0 0 12px;line-height:1.6">Everything lives in this browser only — ' +
          'nothing is uploaded anywhere. That also means clearing your browser data would wipe it, so take a ' +
          'backup file now and then.</p>' +
        '<div class="row" style="gap:8px">' +
          '<button class="btn btn-soft" data-export="1" style="flex:1">Download backup</button>' +
          '<button class="btn btn-ghost" data-import="1" style="flex:1">Restore</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* --- About / reset --- */
    html += '<div class="section">' +
      '<div class="card">' +
        '<div class="eyebrow">About</div>' +
        '<p class="small dim" style="margin:8px 0 0;line-height:1.65">' +
          'Sprout carries care data for ' + window.PLANT_DATA.length + ' species and a diagnostic model built ' +
          'from ' + Object.keys(PROBLEM_DATA.SYMPTOMS).length + ' symptoms and ' +
          Object.keys(PROBLEM_DATA.CAUSES).length + ' causes. Watering intervals are calculated from the ' +
          'species baseline, then adjusted for season, room light, pot size, pot material, drainage and your ' +
          'local forecast — every adjustment is shown on the plant\'s Care tab, so you can disagree with it.' +
        '</p>' +
      '</div>' +
      '<button class="btn btn-danger btn-block" data-reset="1" style="margin-top:12px">' +
        UI.icon('trash') + 'Delete everything</button>' +
      '<p class="hint center">Wipes all plants, rooms, diary entries and photos from this browser.</p>' +
    '</div>';

    return html;
  }

  function stat(label, value) {
    return '<div class="card">' +
      '<div class="eyebrow">' + UI.esc(label) + '</div>' +
      '<div style="font-family:var(--serif);font-size:26px;margin-top:2px">' + value + '</div>' +
    '</div>';
  }

  function mount(root) {
    const name = root.querySelector('#p-name');
    if (name) {
      name.addEventListener('change', function () {
        Store.updateProfile({ name: name.value.trim() });
        UI.toast('Saved', 'leaf');
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

      const exp = e.target.closest('[data-exp]');
      if (exp) {
        const key = exp.getAttribute('data-exp');
        Store.updateProfile({ experience: Store.get().profile.experience === key ? null : key });
        App.refresh();
        return;
      }

      if (e.target.closest('[data-loc]')) { locationSheet(); return; }

      if (e.target.closest('[data-refresh]')) {
        UI.toast('Fetching your forecast…');
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

      if (e.target.closest('[data-export]')) { exportData(); return; }
      if (e.target.closest('[data-import]')) { importData(); return; }

      if (e.target.closest('[data-reset]')) {
        UI.confirmSheet('Delete everything?',
          'Every plant, room, diary entry and photo will be permanently removed from this browser. ' +
          'If you have not downloaded a backup, this cannot be undone.',
          'Delete everything', function () {
            Store.resetAll();
            UI.toast('Everything deleted');
            App.go('/today');
            App.refresh();
          }, true);
      }
    });
  }

  /* ======================================================================
     First run
     ====================================================================== */

  function welcomeSheet() {
    const body =
      '<p class="dim" style="margin:0 0 18px;line-height:1.65">' +
        'Sprout is a home for your houseplants. Tell it what you have and where they live, and it works out ' +
        'when each one needs watering — from the species\' real requirements, adjusted for your pot size, ' +
        'your room\'s light and the season you are actually in.' +
      '</p>' +

      '<label class="field"><span class="label">What should we call you?</span>' +
        '<input class="input" id="w-name" maxlength="30" placeholder="Optional"></label>' +

      '<div class="field"><span class="label">Any pets at home?</span>' +
        '<div class="row-wrap">' + PETS.map(function (p) {
          return '<button type="button" class="chip" data-wpet="' + p.key + '">' +
            UI.icon(p.ico) + UI.esc(p.label) + '</button>';
        }).join('') + '</div>' +
        '<p class="hint">Sprout will warn you about plants that are toxic to them — a surprising number of the ' +
          'popular ones are.</p>' +
      '</div>' +

      '<div class="stack" style="gap:8px;margin-top:18px">' +
        '<button class="btn btn-lg" id="w-go">Set up my greenhouse</button>' +
        '<button class="btn btn-ghost" id="w-skip">I\'ll explore first</button>' +
      '</div>';

    UI.openSheet('Welcome to Sprout', body, function (root) {
      const pets = [];

      root.querySelectorAll('[data-wpet]').forEach(function (b) {
        b.addEventListener('click', function () {
          const key = b.getAttribute('data-wpet');
          const at = pets.indexOf(key);
          if (at === -1) { pets.push(key); b.classList.add('is-on'); }
          else { pets.splice(at, 1); b.classList.remove('is-on'); }
        });
      });

      function save() {
        Store.updateProfile({ name: root.querySelector('#w-name').value.trim(), pets: pets });
        Store.updateSettings({ seenWelcome: true });
      }

      root.querySelector('#w-go').addEventListener('click', function () {
        save();
        UI.closeSheet();
        App.go('/greenhouse');
        setTimeout(function () { ViewGreenhouse.roomSheet(null); }, 320);
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
    title: title, sub: sub, render: render, mount: mount,
    welcomeSheet: welcomeSheet, locationSheet: locationSheet
  };
})();
