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
          'Everything I\'m holding now will be replaced by the contents of ' + file.name + '.',
          'Restore', function () {
            try {
              const r = Store.importAll(reader.result);
              /* A failed save has already said so, in Store.save. Saying
                 "restored" after it would contradict the toast above. */
              if (r.saved && r.photosDropped) {
                UI.toast('Backup restored, but ' + UI.plural(r.photosDropped, 'photo') +
                         ' didn\'t fit. Free some space and restore again', 'warn');
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
        '<p class="small dim" style="margin:0;line-height:1.6">Viridium for the evening, Conservatory for ' +
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
        '<p class="hint">' + usage.photoMB + 'MB of that is ' + UI.plural(usage.photoCount, 'photo') + '. ' +
          'Browsers give me around 5MB in total, so I shrink photos to about 1000px before saving them — ' +
          'roughly 100KB each.' +
          (usage.pctUsed > 85 ? ' <strong>You are running low. Delete a few older photos.</strong>' : '') +
        '</p>' +
      '</div>' +
    '</div>';

    /* --- Backup --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Backup</h2></div>' +
      '<div class="card">' +
        '<p class="small dim" style="margin:0 0 12px;line-height:1.6">Everything lives in this browser only — ' +
          'I upload nothing, anywhere. That also means clearing your browser data would wipe it, so take a ' +
          'backup now and then.</p>' +
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
          'I carry care data for ' + window.PLANT_DATA.length + ' species and a diagnostic model built from ' +
          Object.keys(PROBLEM_DATA.SYMPTOMS).length + ' symptoms and ' +
          Object.keys(PROBLEM_DATA.CAUSES).length + ' causes. Watering intervals start from the species ' +
          'baseline, then shift for season, room light, pot size, pot material, drainage and your local ' +
          'forecast. I show you every adjustment on the plant\'s Care tab, so you can disagree with me.' +
        '</p>' +
      '</div>' +
      '<button class="btn btn-blood btn-block" data-reset="1" style="margin-top:12px">' +
        UI.icon('trash') + 'Delete everything</button>' +
      '<p class="hint center">Wipes all plants, rooms, diary entries and photos from this browser.</p>' +
    '</div>';

    return html;
  }

  function mount(root) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-theme-toggle]')) { App.toggleTheme(e); return; }
      if (e.target.closest('[data-export]')) { exportData(); return; }
      if (e.target.closest('[data-import]')) { importData(); return; }

      if (e.target.closest('[data-reset]')) {
        UI.confirmSheet('Delete everything?',
          'Every plant, room, diary entry and photo goes, permanently, from this browser. ' +
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
    title: title, sub: sub, back: true, render: render, mount: mount
  };
})();
