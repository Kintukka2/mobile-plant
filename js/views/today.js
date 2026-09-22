/* ==========================================================================
   Sprout — Today
   --------------------------------------------------------------------------
   The daily check-in: what needs doing, what the weather is about to do to
   your soil, and what is coming up over the next few days.
   ========================================================================== */

window.ViewToday = (function () {

  /* ---------- Greeting ---------- */

  function partOfDay() {
    const h = new Date().getHours();
    if (h < 5)  return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* Two beats: where the year stands, then what that means for the plants.
     They were one sentence before — "Growth is waking up. Start feeding
     again" — which stated a fact about plants in general and then gave an
     instruction in a word a beginner has no way to cash in. Separating them
     lets the first be a plain calendar statement and the second an
     instruction in things you can buy. */
  function seasonLine() {
    const sum = Schedule.summary();
    return (sum.seasonPhrase ? sum.seasonPhrase + ' ' : '') + sum.seasonMeta.note;
  }

  function greeting() {
    const s = Store.get().profile;
    const sum = Schedule.summary();
    const name = s.name ? ', ' + s.name : '';

    let line;
    if (!sum.plantCount) {
      line = 'Add your first plant and I\'ll work out when it needs water, how much, and when to feed it.';
    } else if (sum.overdueCount) {
      line = UI.plural(sum.overdueCount, 'plant') + ' ' + (sum.overdueCount === 1 ? 'is' : 'are') +
             ' ready for a drink. Nothing dramatic — a late one is forgiven far more readily than an early one.';
    } else if (sum.dueCount) {
      /* The count is on the section heading below, where it labels the list
         it belongs to. Opening the greeting with "2 jobs for today" made the
         first thing Sprout says every morning a tally of work owed — which
         is a rota, not a greeting. */
      line = seasonLine();
    } else if (sum.soonCount) {
      line = 'Nothing needs you today. ' + UI.plural(sum.soonCount, 'job') +
             ' coming up over the next few days. ' + seasonLine();
    } else {
      line = 'Everything is watered, fed and content. ' + seasonLine();
    }

    return '<div class="greeting-card">' +
      '<h2 class="greeting-hi">' + partOfDay() + UI.esc(name) + '</h2>' +
      '<p class="greeting-line">' + UI.esc(line) + '</p>' +
      /* Three counts, and they have to be three counts. The third slot has
         been wrong twice. First it held a season glyph under the label
         SPRING — two figures and a pictogram, which never read as a set
         because the first two answer *how many* and a drawing answers
         *which*. Then it held the word "Spring" in the serif, which fixed
         the category but not the mismatch: a 25px word beside two 34px
         numerals sat on a different baseline and pushed its own caption out
         of line with its neighbours', so the row still had one foreign body
         in it.

         Rooms is the honest third number. It is a count, it aligns, and it
         finishes the sentence the row is really making — seven want you
         today, across three rooms, out of nine. The season lost nothing:
         the greeting line above already ends with the season's advice, and
         on a seasonal turn the nudge below announces it by name, so putting
         it here was the third time of saying it. */
      (sum.plantCount ? '<div class="greeting-stats">' +
        /* Due today leads and stands apart. The three are not one kind of
           number: the first is a call to act today and the other two are
           standing totals, so a rule between them says which is which
           faster than reading the captions does. */
        /* Due today is the one that is not a button. It counts what is
           already listed directly below it, so a tap would be a link to the
           thing you can see — whereas rooms and plants both name a place
           you would otherwise go and find in the tab bar. */
        '<div class="gstat"><div class="gstat-n">' + sum.dueCount + '</div>' +
             '<div class="gstat-l">due today</div></div>' +
        '<div class="gstat-split" aria-hidden="true"></div>' +
        '<button class="gstat gstat-go" data-goto="/greenhouse/rooms">' +
          '<div class="gstat-n">' + sum.roomCount + '</div>' +
          '<div class="gstat-l">' + (sum.roomCount === 1 ? 'room' : 'rooms') + '</div></button>' +
        '<div class="gstat-split" aria-hidden="true"></div>' +
        '<button class="gstat gstat-go" data-goto="/greenhouse/plants">' +
          '<div class="gstat-n">' + sum.plantCount + '</div>' +
          '<div class="gstat-l">' + (sum.plantCount === 1 ? 'plant' : 'plants') + '</div></button>' +
      '</div>' : '') +
    '</div>';
  }

  /* ---------- Weather ---------- */

  function weatherStrip() {
    const w = Store.getWeather();
    const line = Weather.currentLine();
    if (!w || !line) return '';

    const days = (w.days || []).slice(0, 6).map(function (d, i) {
      const dt = UI.fromISO(d.date);
      const code = Weather.describeCode(d.code);
      return '<div class="wday" title="' + UI.attr(code[0]) + '">' +
        '<div class="wday-d">' + (i === 0 ? 'Now' : UI.DAYS[dt.getDay()]) + '</div>' +
        '<div class="wday-i">' + UI.icon(code[1]) + '</div>' +
        /* The plain character here, not UI.deg(). The sans ring is the right
           call at 44px, where Cormorant's degree reads as a stray letter;
           at the 15px of a forecast tile the same treatment shrinks it to a
           4px speck floating above the figure, which reads as a dust mote on
           the screen. Small type wants the type designer's degree. */
        '<div class="wday-t num">' + Math.round(d.tMax) + '\u00B0</div>' +
      '</div>';
    }).join('');

    return '<div class="weather-strip">' +
      '<span class="weather-ico">' + UI.icon(line.ico) + '</span>' +
      '<div style="min-width:0">' +
        '<div class="weather-temp">' + UI.deg(line.temp) + '</div>' +
        '<div class="weather-now">' + UI.esc(line.label) +
          (typeof line.humidity === 'number' ? ' · ' + Math.round(line.humidity) + '% humidity' : '') +
        '</div>' +
      '</div>' +
      '<div class="weather-days">' + days + '</div>' +
    '</div>';
  }

  function dismissed() {
    return Store.get().settings.dismissed || [];
  }

  function nudges() {
    const list = Weather.insights().filter(function (n) {
      return dismissed().indexOf(n.id) === -1;
    });
    if (!list.length) return '';

    pending = list;   // keep the closures around for the click handler

    return '<div class="section"><div class="stack">' + list.map(function (n, i) {
      return '<div class="nudge" data-nudge="' + i + '">' +
        '<span class="nudge-ico">' + UI.icon(n.ico || 'sparkle') + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="nudge-t">' + UI.esc(n.title) + '</div>' +
          '<p class="nudge-p">' + UI.esc(n.text) + '</p>' +
          '<div class="row" style="gap:8px">' +
            (n.action ? '<button class="btn btn-sm" data-apply="' + i + '">' + UI.esc(n.action) + '</button>' : '') +
            '<button class="btn btn-ghost btn-sm" data-dismiss="' + UI.attr(n.id) + '">' +
              (n.action ? 'No thanks' : 'Got it') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div></div>';
  }

  let pending = [];

  /* ---------- Tasks ---------- */

  function taskRow(t) {
    const plant = Store.getPlant(t.plantId);
    if (!plant) return '';
    const kind = LOOKUPS.TASKS[t.type];

    const when = t.never
      ? (t.type === 'water' ? 'Not watered yet — start today' : 'Not fed yet this season')
      : UI.relDue(t.days);

    return '<div class="task' + (t.overdue ? ' is-overdue' : '') + '" ' +
        'data-task="' + UI.attr(t.plantId + ':' + t.type) + '">' +
      '<button class="task-check" data-done="' + UI.attr(t.plantId + ':' + t.type) + '" ' +
        'aria-label="Mark ' + UI.attr(kind.label.toLowerCase()) + ' done">' + UI.icon('check') + '</button>' +
      '<span class="task-thumb">' + UI.plantTile(Store.coverPhoto(plant), plant.id, Store.displayName(plant)) + '</span>' +
      '<div class="task-body" data-plant="' + UI.attr(plant.id) + '">' +
        '<div class="task-title">' + UI.esc(kind.label + ' ' + Store.displayName(plant)) + '</div>' +
        '<div class="task-meta">' + UI.icon(kind.ico) +
          '<span class="truncate">' + UI.esc(when + ' · ' + t.detail) + '</span></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- View ---------- */

  function title() { return 'Today'; }

  function sub() {
    const d = new Date();
    return UI.DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + UI.MONTHS[d.getMonth()];
  }

  function actions() {
    return '<button class="icon-btn" data-act="add" aria-label="Add a plant">' + UI.icon('plus') + '</button>';
  }

  function onAction(act) { if (act === 'add') ViewGreenhouse.addMenu(); }

  function render() {
    const plants = Store.activePlants();

    /* First run leads with the invitation.

       The empty state used to be assembled in the same order as the populated
       one — greeting, weather, nudges, then content — which put the only
       action on the screen a full phone-height below the fold. What a new
       arrival actually saw at 390x844 was a greeting telling them to add
       their first plant with no button to do it, a six-day forecast, and a
       seasonal nudge reading "Growth is waking up. Start feeding again and
       expect thirstier plants." Advice about a collection that does not
       exist, taking precedence over the one thing they came here to do.

       So the nudges are dropped entirely while the greenhouse is empty —
       every insight Weather.insights() produces is guidance about plants you
       own, and there is no version of it that is useful to someone who owns
       none. The forecast stays, but underneath: it is the one part of this
       screen with real content for a new arrival, it shows the app already
       knows where they are, and it hints at the weather sync without asking
       for anything. When no location is set it returns nothing at all, and
       the first run is then just the greeting and the invitation, which is
       the right screen to hand someone on their first open.

       No location nudge here either, though the populated path ends with
       one. One screen, one action. */
    if (!plants.length) {
      return greeting() + '<div class="section">' +
        UI.empty('leaf', 'No plants yet',
          'I\'ve got care data for ' + window.PLANT_DATA.length + ' common houseplants — watering ' +
            'intervals, light, feeding, toxicity and how to propagate them.',
          '<button class="btn btn-lg" data-open="plant">' + UI.icon('plus') + 'Add your first plant</button>') +
      '</div>' + weatherStrip();
    }

    /* The forecast used to sit directly under the greeting, above the one
       list this screen exists for. It is context for the tasks, not a
       headline of its own, so it now follows them — what needs doing today
       is the first thing past the greeting, and the weather explains it
       afterwards. */
    let html = greeting() + nudges();

    const due = Schedule.tasks(0);
    const soon = Schedule.tasks(7).filter(function (t) { return t.days > 0; });

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Needs you today' +
        ' (' + due.length + ')</h2></div>' +
      (due.length
        ? '<div class="stack">' + due.map(taskRow).join('') + '</div>'
        : '<div class="card center all-clear">' +
            '<span class="all-clear-mark">' + UI.icon('leaf') + '</span>' +
            '<p class="all-clear-t">All caught up</p>' +
            /* No exclamation mark, by the voice rule for anything that
               repeats — this line shows on every day nothing is due, and a
               cheer that fires daily stops being a cheer. */
            '<p class="tiny muted mt-0">No plants are in need — great job.</p>' +
          '</div>') +
    '</div>';

    html += weatherStrip();

    if (soon.length) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">Coming up</h2>' +
          '<span class="section-note">next 7 days</span></div>' +
        '<div class="stack">' + soon.slice(0, 8).map(function (t) {
          const plant = Store.getPlant(t.plantId);
          if (!plant) return '';
          const kind = LOOKUPS.TASKS[t.type];
          return '<div class="task is-link" data-plant="' + UI.attr(plant.id) + '">' +
            '<span class="task-thumb">' + UI.plantTile(Store.coverPhoto(plant), plant.id, Store.displayName(plant)) + '</span>' +
            '<div class="task-body">' +
              '<div class="task-title">' + UI.esc(Store.displayName(plant)) + '</div>' +
              '<div class="task-meta">' + UI.icon(kind.ico) +
                '<span class="truncate">' + UI.esc(kind.label + ' · ' + UI.relDue(t.days)) + '</span></div>' +
            '</div>' +
            UI.icon('chevron', 'muted') +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    // A gentle prompt to unlock the weather features.
    if (!Store.get().profile.location) {
      html += '<div class="section"><div class="nudge">' +
        '<span class="nudge-ico">' + UI.icon('pin') + '</span>' +
        '<div class="grow" style="min-width:0">' +
          '<div class="nudge-t">Add your location</div>' +
          '<p class="nudge-p">This will let me give you real advice, based on the weather ' +
            'in your region.</p>' +
          /* The same button as the one in Profile, down to the icon and the
             words. Two different-looking controls for one action taught the
             reader that "Set up" and "Set my location" were two errands; the
             nudge is a shortcut to that button, so it should look like it.
             Straight to the sheet, too — sending them to /profile put them
             at the top of a long page with the location card several screens
             down, which answers "where?" with "somewhere over there". */
          '<button class="btn btn-block" data-act="set-location" style="margin-top:12px">' +
            UI.icon('pin') + 'Set my location</button>' +
        '</div>' +
      '</div></div>';
    }

    return html;
  }

  function mount(root) {
    root.addEventListener('click', function (e) {
      // Tick a task off.
      const done = e.target.closest('[data-done]');
      if (done) {
        const bits = done.getAttribute('data-done').split(':');
        completeTask(bits[0], bits[1], done);
        return;
      }

      const apply = e.target.closest('[data-apply]');
      if (apply) {
        const n = pending[Number(apply.getAttribute('data-apply'))];
        if (n && typeof n.apply === 'function') { n.apply(); App.refresh(); }
        return;
      }

      const dis = e.target.closest('[data-dismiss]');
      if (dis) {
        const list = dismissed().slice();
        list.push(dis.getAttribute('data-dismiss'));
        Store.updateSettings({ dismissed: list });
        App.refresh();
        return;
      }

      const open = e.target.closest('[data-open]');
      if (open) { ViewGreenhouse.addPlantSheet(null); return; }

      if (e.target.closest('[data-act="set-location"]')) {
        ViewProfile.locationSheet();
        return;
      }

      const goto = e.target.closest('[data-goto]');
      if (goto) { App.go(goto.getAttribute('data-goto')); return; }

      const pl = e.target.closest('[data-plant]');
      if (pl) { App.go('/plant/' + pl.getAttribute('data-plant')); }
    });
  }

  /* Log the care action, then let the row fade before redrawing. */
  function completeTask(plantId, type, btn) {
    const plant = Store.getPlant(plantId);
    if (!plant) return;

    Store.addLog({ plantId: plantId, kind: type, date: UI.toISO(UI.today()) });

    btn.classList.add('is-done');
    const row = btn.closest('.task');
    if (row) row.classList.add('is-done');

    const verb = LOOKUPS.TASKS[type].verb;
    UI.toast(verb + ' ' + Store.displayName(plant), 'leaf');

    setTimeout(function () { App.refresh(); }, 420);
  }

  return {
    title: title, sub: sub, actions: actions, onAction: onAction,
    render: render, mount: mount
  };
})();
