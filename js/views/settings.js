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
  function sub() { return 'Storage, backup and the reset switch'; }

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
          'Everything I\'m holding now will be replaced by the contents of ' + file.name + '.',
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
    const usage = Store.storageUsage();

    let html = '';

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
