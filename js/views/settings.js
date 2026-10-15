/* ==========================================================================
   Sprout — Settings
   --------------------------------------------------------------------------
   The housekeeping half of the You screen, moved out of it: how much room
   the data is taking, how to get a copy of it, what the app is, and how to
   throw it all away.

   Split out because Profile had become two screens stacked — who you are and
   where you live, then storage bars and a delete button. The first is worth
   scrolling; the second is the sort of thing you go looking for once and
   want to find in a predictable place.

   "Delete everything" travelled with Backup deliberately. Separating a
   destructive action from the safety net that undoes it is how people lose
   things: the reader who has just decided to wipe the app is precisely the
   one who should have the Download backup button in front of them.
   ========================================================================== */

window.ViewSettings = (function () {

  function title() { return 'Settings'; }
  function sub() { return 'Appearance, storage, backup and the reset switch'; }

  /* ======================================================================
     Backup & restore
     ====================================================================== */

  /* The store builds can't download anything. The Android WebView has no
     handler for a blob: link, so the <a download> below was dropped without
     an error: the button flashed and nothing was saved. PrimeTestLab found
     it on the first device build (report 7959, M-01).

     So the shell writes the file to its own cache and hands it to the share
     sheet. That isn't just a workaround for the missing download: a copy
     left in the phone's Downloads is lost with the phone, which is exactly
     the case a backup is for, while the share sheet offers Drive, Files and
     email alongside saving locally. Nothing is sent anywhere until the
     reader picks a destination. */
  function nativeFiles() {
    const C = window.Capacitor;
    if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return null;
    const p = C.Plugins || {};
    return p.Filesystem && p.Share ? { fs: p.Filesystem, share: p.Share } : null;
  }

  /* The share sheet takes a second to appear and refuses a second request
     while the first is open, so a quick double tap would otherwise end in
     an error toast on top of a working sheet. */
  let exporting = false;

  function exportNative(n, json, name) {
    exporting = true;
    n.fs.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' })
      .then(function (r) {
        return n.share.share({ title: 'Sprout backup', dialogTitle: 'Save your backup', files: [r.uri] });
      })
      .then(function () {
        UI.toast('Backup saved', 'leaf');
      })
      .catch(function (e) {
        /* Both platforms reject with this message when the reader closes
           the sheet without choosing anything. That is a decision, not a
           failure, but it does mean there is no backup, so it is said. */
        if (e && /cancel/i.test(e.message || '')) {
          UI.toast('No backup saved this time');
        } else {
          console.error(e);
          UI.toast('Could not create the backup', 'warn');
        }
      })
      .then(function () { exporting = false; });
  }

  function exportData() {
    if (exporting) return;
    try {
      const json = Store.exportAll();
      const name = 'sprout-backup-' + UI.toISO(new Date()) + '.json';
      const n = nativeFiles();
      if (n) { exportNative(n, json, name); return; }

      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
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
          'This replaces everything on ' + UI.here() + ' with the contents of ' + file.name + '.',
          'Restore', function () {
            try {
              const r = Store.importAll(reader.result);
              /* A failed save has already said so, in Store.save. Saying
                 "restored" after it would contradict the toast above. */
              if (r.saved && r.photosDropped) {
                UI.toast('Restored without ' + UI.plural(r.photosDropped, 'photo') +
                         '. Free space and restore again', 'warn');
              } else if (r.saved) {
                UI.toast('Backup restored', 'leaf');
              }
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
     Import a home plan
     ====================================================================== */

  /* A plan drawn in the planner preview on the web, or taken from any
     backup, merged into the garden that is already here. Store.importPlan
     has the rules; this asks first, in terms of what will change, because
     an imported plan replaces the drawing and that is the one thing about
     it that cannot be read off the button. */
  function importPlan() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { askPlan(reader.result); };
      reader.onerror = function () { UI.toast('Could not read that file', 'warn'); };
      reader.readAsText(file);
      if (input.parentNode) input.parentNode.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  // "Living Room, Kitchen and Study", for the rooms that keep their plants.
  function listOf(names) {
    return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function askPlan(json) {
    let p;
    try { p = Store.previewPlan(json); } catch (e) { UI.toast(e.message || 'That file could not be read', 'warn'); return; }

    let body = '<p class="small muted" style="margin:0 0 12px;line-height:1.65">It has ' + UI.plural(p.rooms, 'room') +
      ' drawn, with their windows and north.</p>';
    if (p.drawnHere) {
      body += '<p class="small muted" style="margin:0 0 12px;line-height:1.65">It replaces the plan you have now.' +
        (p.matched.length ? ' ' + UI.esc(listOf(p.matched)) + (p.matched.length === 1
          ? ' keeps its plants, notes and icon, and takes the new outline.'
          : ' keep their plants, notes and icons, and take the new outlines.') : '') +
        (p.unshaped ? ' ' + UI.plural(p.unshaped, 'drawn room') + ' with no match ' + (p.unshaped === 1 ? 'stays' : 'stay') +
          ' in your greenhouse, off the plan.' : '') + '</p>';
    }
    if (p.plantsHere) {
      body += '<p class="small muted" style="margin:0 0 12px;line-height:1.65">Your plants keep their rooms. Drag them onto the new plan and I\'ll show you where each should stand.</p>';
    }
    if (p.plants) {
      /* Off when the garden already has plants: the planner's plants are
         usually the reader's own, sketched in before they installed, and
         bringing them in beside the real ones would be every plant twice. */
      body += '<label class="row pot-pending" style="gap:10px;cursor:pointer;margin:4px 0 0">' +
          '<input type="checkbox" id="ip-plants"' + (p.plantsHere ? '' : ' checked') + '>' +
          '<span>' + (p.plants === 1 ? 'Bring the plant on it too' : 'Bring the ' + p.plants + ' plants on it too') + '</span>' +
        '</label>' +
        (p.plantsHere ? '<p class="hint">You have ' + UI.plural(p.plantsHere, 'plant') + ' here already, so I\'ve left this off in case they\'re the same ones.</p>' : '');
    }
    body += '<div class="row" style="gap:8px;margin-top:18px">' +
      '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>' +
      '<button class="btn" data-act="ip-go" style="flex:1">Import</button>' +
    '</div>';

    UI.openSheet('Import this plan?', body, function (sheet) {
      sheet.querySelector('[data-act="ip-go"]').addEventListener('click', function () {
        const box = sheet.querySelector('#ip-plants');
        let r;
        try { r = Store.importPlan(json, { plants: !!(box && box.checked) }); }
        catch (e) { UI.toast(e.message || 'That file could not be read', 'warn'); return; }
        UI.closeSheet();
        // A failed save has already said so, in Store.save.
        if (!r.saved) return;
        UI.toast('Plan imported' + (r.plants ? ' with ' + UI.plural(r.plants, 'plant') : ''), 'leaf');
        /* A fresh arrival even from the plan's own link, where go() would
           be a no-op: arriving resets the plan's undo history, which
           should not reach back across a whole plan being replaced. */
        if (location.hash === '#/plan') App.render(); else App.go('/plan');
        /* A home drawn on the web and carried into the app is the whole
           journey the planner preview exists for. */
        if (window.Rate) Rate.moment('import', { to: '/plan' });
      });
    });
  }

  /* ======================================================================
     The view
     ====================================================================== */

  function render() {
    const usage = Store.storageUsage();

    let html = '';

    /* --- Appearance ---
       The theme switch used to live only in the sidebar, which is hidden
       below 900px, so on a phone — where nearly everyone uses Sprout — the
       one way to change it was the T key. This is the same control, wired
       to the same App.toggleTheme. */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Appearance</h2></div>' +
      '<div class="card theme-card">' +
        '<p class="small muted" style="margin:0;line-height:1.6">Viridium for the evening, Conservatory for ' +
          'daylight. I\'ll keep whichever you choose.</p>' +
        '<button class="theme-toggle" data-theme-toggle="1" aria-label="Switch theme">' +
          App.themeToggleInner() + '</button>' +
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
        '<p class="hint">There\'s room for about ' + UI.plural(usage.photosLeft, 'more photo') + '. ' +
          (usage.photoCount
            ? UI.plural(usage.photoCount, 'photo') + (usage.photoCount === 1 ? ' takes ' : ' take ') +
              'up ' + usage.photoMB + 'MB, each shrunk to about 1000px to fit.'
            : 'Each one is shrunk to about 1000px to fit.') +
          (usage.pctUsed > 85 ? ' <strong>Deleting a few older photos frees some up.</strong>' : '') +
        '</p>' +
      '</div>' +
    '</div>';

    /* --- Backup --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Backup</h2></div>' +
      '<div class="card">' +
        /* "I upload nothing, anywhere" was not true: an approximate location
           goes to Open-Meteo for the forecast. What never leaves is the
           plants, so that is the claim, and it is the one the privacy
           policy makes. */
        '<p class="small muted" style="margin:0 0 12px;line-height:1.6">Your plants, rooms, diary and photos ' +
          'live ' + (UI.isNative() ? 'on ' : 'in ') + UI.here() + ' and nowhere else. That also means ' +
          (UI.isNative() ? 'uninstalling Sprout or clearing its data' : 'clearing your browser data') +
          ' would wipe them, so take a backup now and then.</p>' +
        '<div class="row" style="gap:8px">' +
          '<button class="btn btn-soft" data-export="1" style="flex:1">' +
            (UI.isNative() ? 'Save a backup' : 'Download backup') + '</button>' +
          '<button class="btn btn-ghost" data-import="1" style="flex:1">Restore</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* --- Home plan ---
       Its own card rather than a third button under Backup: Restore and
       this both open a file, and the one that replaces everything should
       not sit beside the one that does not. */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Home plan</h2></div>' +
      '<div class="card">' +
        '<p class="small muted" style="margin:0 0 12px;line-height:1.6">I\'ll bring in the rooms, windows ' +
          'and north from a plan drawn at sproutevergreen.app/planner. Your plants and diary stay, but placed ' +
          'plants come off the plan until you drag them back.</p>' +
        '<button class="btn btn-soft btn-block" data-import-plan="1">' + UI.icon('download') + 'Import a home plan</button>' +
      '</div>' +
    '</div>';

    /* --- About / reset --- */
    html += '<div class="section">' +
      '<div class="card">' +
        '<div class="eyebrow">About</div>' +
        '<p class="small muted" style="margin:8px 0 0;line-height:1.65">' +
          'I carry care data for ' + window.PLANT_DATA.length + ' species and a diagnostic model built from ' +
          Object.keys(PROBLEM_DATA.SYMPTOMS).length + ' symptoms and ' +
          Object.keys(PROBLEM_DATA.CAUSES).length + ' causes. Watering intervals start from the species ' +
          'baseline, then shift for season, room light, pot size, pot material, drainage and any forecast ' +
          'change you accept. I list every adjustment on the plant\'s Care tab.' +
        '</p>' +
      '</div>' +
      '<button class="btn btn-blood btn-block" data-reset="1" style="margin-top:12px">' +
        UI.icon('trash') + 'Delete everything</button>' +
      '<p class="hint center">Wipes all plants, rooms, diary entries and photos from ' + UI.here() + '.</p>' +
    '</div>';

    return html;
  }

  function mount(root) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-theme-toggle]')) { App.toggleTheme(e); return; }
      if (e.target.closest('[data-export]')) { exportData(); return; }
      if (e.target.closest('[data-import]')) { importData(); return; }
      if (e.target.closest('[data-import-plan]')) { importPlan(); return; }

      if (e.target.closest('[data-reset]')) {
        UI.confirmSheet('Delete everything?',
          'Every plant, room, diary entry and photo goes, permanently, from ' + UI.here() + '. ' +
          'If you haven\'t taken a backup, I can\'t get any of it back.',
          'Delete everything', function () {
            Store.resetAll();
            UI.toast('Everything deleted');
            App.go('/today');
            App.refresh();
          }, true);
      }
    });
  }

  return {
    title: title, sub: sub, back: true, render: render, mount: mount,
    /* shared: the plan's empty state offers the same import */
    importPlan: importPlan
  };
})();
