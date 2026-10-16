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
  /* The note is left off while the seasonal nudge is on screen, because
     that nudge's text is the same note word for word, and reading one
     sentence twice in a row on the same screen says the app has lost track
     of what it just said. The phrase stays, so the line is never empty. */
  function seasonLine(nudgeShown) {
    const sum = Schedule.summary();
    if (nudgeShown) return sum.seasonPhrase || '';
    return (sum.seasonPhrase ? sum.seasonPhrase + ' ' : '') + sum.seasonMeta.note;
  }

  /* Plants whose light is wrong, by the same rule the plant page uses for
     its Wrong light badge and the room page for its nudges: 'bad' or 'poor'.
     lightMatch returns null for a plant with no room or a room with no light
     reading, and a drawn room has none while north or the hemisphere is
     unconfirmed, so this stays silent exactly when the plan does. */
  function misplaced() {
    return Store.activePlants().map(function (p) {
      return { plant: p, match: Schedule.lightMatch(p) };
    }).filter(function (x) {
      return x.match && (x.match.verdict === 'bad' || x.match.verdict === 'poor');
    });
  }

  function greeting(seasonNudge) {
    const s = Store.get().profile;
    const sum = Schedule.summary();
    const wrongLight = misplaced();
    const name = s.name ? ', ' + s.name : '';

    let line;
    if (!sum.plantCount) {
      line = 'Once you add a plant, I\'ll work out when it needs water, how much, and when to feed it.';
    } else if (sum.thirstyCount) {
      /* thirstyCount is waterings already overdue, which tasks() sorts to
         the top of the list, so the line can say where to look. */
      line = UI.plural(sum.thirstyCount, 'plant') + ' ' +
             (sum.thirstyCount === 1 ? 'is overdue for water, so it\'s' : 'are overdue for water, so they\'re') +
             ' first in the list below.';
    } else if (sum.dueCount) {
      /* The count is on the section heading below, where it labels the list
         it belongs to. Opening the greeting with "2 jobs for today" made the
         first thing Sprout says every morning a tally of work owed — which
         is a rota, not a greeting. */
      line = seasonLine(seasonNudge);
    } else if (sum.soonCount) {
      /* Three days, because summary() counts tasks(3). */
      line = 'Nothing\'s due today, and ' + UI.plural(sum.soonCount, 'job') + ' ' +
             (sum.soonCount === 1 ? 'is' : 'are') + ' due in the next three days. ' + seasonLine(seasonNudge);
    } else if (wrongLight.length) {
      /* "Content" was a claim about light as well as water, and the plant
         page could be showing Wrong light underneath it (PrimeTestLab 7959,
         S-05). The jobs are done; the light is not, so it says which. */
      line = 'Everything is watered and fed, though ' +
             (wrongLight.length === 1
               ? Store.displayName(wrongLight[0].plant) + ' is in the wrong light for it. '
               : wrongLight.length + ' plants are in the wrong light for them. ') +
             seasonLine(seasonNudge);
    } else {
      line = 'Everything is watered and fed. ' + seasonLine(seasonNudge);
    }
    line = line.trim();

    return '<div class="greeting-card">' +
      '<h2 class="greeting-hi">' + partOfDay() + UI.esc(name) + '</h2>' +
      (line ? '<p class="greeting-line">' + UI.esc(line) + '</p>' : '') +
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
         the greeting line above ends with the season's advice, or on a
         seasonal turn the nudge below gives it by name, so putting it here
         was saying it twice. */
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

  function visibleNudges() {
    return Weather.insights().filter(function (n) {
      return dismissed().indexOf(n.id) === -1;
    });
  }

  function nudges(list) {
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

  /* Under the day's jobs rather than above them: a plant in the wrong light
     needs moving this week, not before its watering. Not dismissable,
     unlike the weather nudges, because it stays true until the plant moves,
     and moving it is what clears it. The reason is the room page's own
     sentence, so the two screens never disagree about the same plant. */
  const LIGHT_SHOWN = 3;
  function lightSection() {
    const list = misplaced();
    if (!list.length) return '';
    const more = list.length - LIGHT_SHOWN;
    return '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Light</h2></div>' +
      '<div class="stack">' + list.slice(0, LIGHT_SHOWN).map(function (x) {
        return '<div class="nudge nudge-warn is-link" data-plant="' + UI.attr(x.plant.id) + '">' +
          '<span class="nudge-ico">' + UI.icon(x.match.verdict === 'bad' ? 'ban' : 'cloud') + '</span>' +
          '<div class="grow" style="min-width:0"><div class="nudge-t">' +
            UI.esc(Store.displayName(x.plant)) + ' is in the wrong light</div>' +
          '<p class="nudge-p mb-0">' + UI.esc(x.match.text) + '</p></div>' +
          UI.icon('chevron', 'muted') +
        '</div>';
      }).join('') + '</div>' +
      (more > 0
        ? '<p class="hint">' + (more === 1
            ? '1 more plant is in the wrong light too, and its page says why.'
            : more + ' more plants are in the wrong light too, and each one\'s page says why.') + '</p>'
        : '') +
    '</div>';
  }

  /* ---------- Reminders ----------
     Reminders are why the store app exists, and they start off: the switch
     lived only in Profile, three screens from anywhere a new reader goes,
     so a garden could be set up with care and then never once be called
     back to. This asks in the place it means something — under the first
     list of jobs, once there is a plant to be reminded about — and only on
     the native shell, the one runtime that can deliver one. Asked once: a
     no is kept, and Profile has the switch from then on. Hidden while the
     operating system has already said no, because a button that can only
     produce a refusal is not an offer. */
  const REMIND_ASK = 'remind-ask';

  function hourLabel(h) {
    return (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
  }

  function remindAsk() {
    const s = Store.get().settings;
    if (!window.Notify || !Notify.isNative() || s.remind) return '';
    /* Not on iOS. A card whose yes raises the permission prompt and whose
       Not now puts it off is the pattern App Review refused on the
       introduction's location screen (5.1.1(iv)); there Profile's switch
       is the way in, a request the reader starts. Play has no such rule. */
    if (UI.platform() === 'ios') return '';
    if (dismissed().indexOf(REMIND_ASK) !== -1 || Notify.state() === 'denied') return '';
    const hour = typeof s.remindHour === 'number' ? s.remindHour : 8;
    return '<div class="section"><div class="nudge">' +
      '<span class="nudge-ico">' + UI.icon('bell') + '</span>' +
      '<div class="grow" style="min-width:0">' +
        /* The hour, not "in the morning": Profile can move it to the
           evening, and the ask has to match what a yes will do. */
        '<div class="nudge-t">Want a reminder at ' + hourLabel(hour) + '?</div>' +
        '<p class="nudge-p">I\'ll remind you on days a plant needs water or food, scheduled on this ' +
          'device with nothing sent from a server.</p>' +
        '<div class="row" style="gap:8px;margin-top:12px">' +
          '<button class="btn" data-act="remind-on" style="flex:2">' + UI.icon('bell') + 'Remind me</button>' +
          '<button class="btn btn-ghost" data-act="remind-later" style="flex:1">Not now</button>' +
        '</div>' +
      '</div>' +
    '</div></div>';
  }

  /* ---------- Tasks ---------- */

  function taskRow(t) {
    const plant = Store.getPlant(t.plantId);
    if (!plant) return '';
    const kind = LOOKUPS.TASKS[t.type];

    /* Never means nothing has been logged, which is all the app knows: the
       plant may well have been watered or fed before it arrived here. */
    const when = t.never ? 'Due today, none logged yet' : UI.relDue(t.days);

    return '<div class="task' + (t.overdue ? ' is-overdue' : '') + '" ' +
        'data-task="' + UI.attr(t.plantId + ':' + t.type) + '">' +
      '<button class="task-check" data-done="' + UI.attr(t.plantId + ':' + t.type) + '" ' +
        'aria-label="' + UI.attr('Mark ' + Store.displayName(plant) + ' as ' + kind.verb.toLowerCase()) + '">' +
        UI.icon('check') + '</button>' +
      '<span class="task-thumb">' + UI.plantTile(Store.tilePhoto(plant), plant.id, Store.displayName(plant)) + '</span>' +
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

  /* You lives here now rather than on the tab bar: a round button beside
     Add, round so it reads as a person and not as another action. */
  function actions() {
    return '<button class="icon-btn" data-act="add" aria-label="Add a plant">' + UI.icon('plus') + '</button>' +
      '<button class="icon-btn is-round" data-act="me" aria-label="You: profile and settings">' + UI.icon('user') + '</button>';
  }

  function onAction(act) {
    if (act === 'add') ViewGreenhouse.addMenu();
    else if (act === 'me') App.go('/profile');
  }

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
      return greeting(false) + '<div class="section">' +
        UI.empty('sprout:new-growth', 'No plants yet',
          'Pick from ' + window.PLANT_DATA.length + ' common houseplants and I\'ll tell you how to water, ' +
            'light, feed and propagate yours, and whether it\'s toxic to pets or people.',
          '<button class="btn btn-lg" data-open="plant">' + UI.icon('plus') + 'Add your first plant</button>') +
      '</div>' + weatherStrip();
    }

    /* The forecast used to sit directly under the greeting, above the one
       list this screen exists for. It is context for the tasks, not a
       headline of its own, so it now follows them — what needs doing today
       is the first thing past the greeting, and the weather explains it
       afterwards. */
    const shown = visibleNudges();
    const seasonNudge = shown.some(function (n) { return n.id.indexOf('season-') === 0; });
    let html = greeting(seasonNudge) + nudges(shown);

    const due = Schedule.tasks(0);
    const soon = Schedule.tasks(7).filter(function (t) { return t.days > 0; });

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Needs you today' +
        ' (' + due.length + ')</h2></div>' +
      (due.length
        ? '<div class="stack">' + due.map(taskRow).join('') + '</div>'
        : '<div class="card center all-clear">' +
            UI.sprout('resting', 'is-small') +
            '<p class="all-clear-t">All caught up</p>' +
            /* No exclamation mark, by the voice rule for anything that
               repeats — this line shows on every day nothing is due, and a
               cheer that fires daily stops being a cheer. */
            '<p class="tiny muted mt-0">No plant needs water or food today.</p>' +
          '</div>') +
    '</div>';

    html += remindAsk();
    html += lightSection();
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
            '<span class="task-thumb">' + UI.plantTile(Store.tilePhoto(plant), plant.id, Store.displayName(plant)) + '</span>' +
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
    if (Store.locationAskDue()) {
      html += '<div class="section"><div class="nudge">' +
        '<span class="nudge-ico">' + UI.icon('pin') + '</span>' +
        '<div class="grow" style="min-width:0">' +
          '<div class="nudge-t">Add your location</div>' +
          '<p class="nudge-p">I\'ll use your local forecast to warn you about cold nights and heat, ' +
            'and to suggest watering changes for dry or wet spells.</p>' +
          /* The same button as the one in Profile, down to the icon and the
             words. Two different-looking controls for one action taught the
             reader that "Set up" and "Set my location" were two errands; the
             nudge is a shortcut to that button, so it should look like it.
             Straight to the sheet, too — sending them to /profile put them
             at the top of a long page with the location card several screens
             down, which answers "where?" with "somewhere over there". */
          '<div class="row" style="gap:8px;margin-top:12px">' +
            '<button class="btn" data-act="set-location" style="flex:2">' +
              UI.icon('pin') + 'Set my location</button>' +
            '<button class="btn btn-ghost" data-act="later-location" style="flex:1">Not now</button>' +
          '</div>' +
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

      if (e.target.closest('[data-act="remind-on"]')) {
        /* The same path as Profile's switch, so the two can never disagree
           about what a yes or a refusal leaves behind. */
        Notify.ask().then(function (result) {
          if (result !== 'granted') {
            UI.toast(result === 'denied'
              ? 'Turn on notifications in device settings'
              : 'Reminders need permission', 'warn');
            App.refresh();
            return;
          }
          Store.updateSettings({ remind: true });
          UI.toast('Reminders on. Profile has the time.', 'leaf');
          App.refresh();
        });
        return;
      }

      if (e.target.closest('[data-act="remind-later"]')) {
        Store.updateSettings({ dismissed: dismissed().concat(REMIND_ASK) });
        UI.toast('Reminders are in Profile any time');
        App.refresh();
        return;
      }

      if (e.target.closest('[data-act="later-location"]')) {
        Store.snoozeLocationAsk();
        UI.toast('I\'ll ask again in a month');
        App.refresh();
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

    const log = Store.addLog({ plantId: plantId, kind: type, date: UI.toISO(UI.today()) });

    btn.classList.add('is-done');
    const row = btn.closest('.task');
    if (row) row.classList.add('is-done');

    const verb = LOOKUPS.TASKS[type].verb;
    UI.toast(verb + ' ' + Store.displayName(plant), 'leaf');

    setTimeout(function () { App.refresh(); }, 420);

    /* The tap that empties the list is a good moment, and so is the first
       care a plant gets after its first month. Rate decides whether either
       counts; the second is only tried when the first did not ask. */
    if (window.Rate && !Rate.moment('caught-up').ok) Rate.moment('log', { log: log });
  }

  return {
    title: title, sub: sub, actions: actions, onAction: onAction,
    render: render, mount: mount
  };
})();
