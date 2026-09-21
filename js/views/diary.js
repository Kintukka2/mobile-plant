/* ==========================================================================
   Sprout — Diary
   --------------------------------------------------------------------------
   Every entry across every plant, newest first, one line each. The plant
   pages each have a diary of their own with the full cards and photographs;
   this is the index to all of them — the page you open to answer "what did
   I do last week?" without knowing which plant you did it to.

   One row is one entry and the row is the header: date, plant, kind. Tapping
   it opens the plant on its diary tab with that entry brought into view,
   which is where the full card already lives. Rendering the cards here too
   would have been a second diary to keep in step with the first.
   ========================================================================== */

window.ViewDiary = (function () {

  function title() { return 'Diary'; }

  function sub() {
    const n = Store.get().logs.length;
    return n ? UI.plural(n, 'entry', 'entries') + ', newest first' : 'Nothing written yet';
  }

  /* Newest first by the date the entry is *about*, then by when it was
     written — two waterings logged for the same day keep the order they
     were ticked in. Same rule Store.logsFor uses, applied across plants. */
  function allLogs() {
    return Store.get().logs.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (a.createdAt || '') < (b.createdAt || '') ? 1 : -1;
    });
  }

  function render() {
    const logs = allLogs();

    if (!logs.length) {
      return UI.empty('note', 'The diary is blank',
        'Every watering you tick off lands here on its own, alongside anything you write on a plant\'s own diary.',
        '<button class="btn" data-goto="/greenhouse/plants">Go to your plants</button>');
    }

    return '<div class="section"><div class="card card-pad-0">' +
      logs.map(function (l) {
        const kind = LOOKUPS.LOG_KINDS[l.kind] || LOOKUPS.LOG_KINDS.note;
        const p = Store.getPlant(l.plantId);
        /* A plant can be deleted after its entries were written. The row
           still shows — it is still a thing that happened — but it says so
           rather than crashing on a missing name, and it goes nowhere. */
        const name = p ? Store.displayName(p) : 'A plant no longer here';
        return '<button class="dlog' + (p ? '' : ' is-orphan') + '" ' +
            (p ? 'data-open="' + UI.attr(l.plantId) + '" data-log="' + UI.attr(l.id) + '"' : 'disabled') + '>' +
          '<span class="dlog-date">' + UI.esc(UI.fmtDate(l.date)) + '</span>' +
          '<span class="dlog-plant">' + UI.esc(name) + '</span>' +
          '<span class="dlog-kind">' + UI.icon(kind.ico) + UI.esc(kind.label) + '</span>' +
          (p ? '<span class="dlog-chev">' + UI.icon('chevron') + '</span>' : '') +
        '</button>';
      }).join('') +
    '</div></div>';
  }

  function mount(root) {
    root.addEventListener('click', function (e) {
      const goto = e.target.closest('[data-goto]');
      if (goto) { App.go(goto.getAttribute('data-goto')); return; }

      const row = e.target.closest('[data-open]');
      if (row) {
        ViewPlant.showEntry(row.getAttribute('data-open'), row.getAttribute('data-log'));
        App.go('/plant/' + row.getAttribute('data-open'));
      }
    });
  }

  return {
    title: title, sub: sub, back: true, render: render, mount: mount
  };
})();
