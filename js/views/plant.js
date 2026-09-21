/* ==========================================================================
   Sprout — a single plant
   --------------------------------------------------------------------------
   Five tabs: Care (what it needs and why), Diary (the running history),
   Photos, Growth (measurements over time) and Propagate.
   ========================================================================== */

window.ViewPlant = (function () {

  let tab = 'care';
  let tabFor = null;   // reset the tab when we open a different plant

  /* Open this plant on a named tab. For other views that write something and
     then send the reader here to look at it — Diagnose saves its summary to
     the diary and then navigated to /plant/:id, which lands on Care, so the
     entry it had just written was on a tab the reader could not see. The
     toast was the only evidence anything had happened.

     Deliberately a setter rather than a third route segment. /plant/:id/diary
     would be nicer to link to, but guard() runs on every re-render as well as
     every navigation, so a tab named in the URL would be reimposed on the
     next refresh and the tab strip would stop working. Setting tabFor at the
     same time is what stops guard() resetting to Care on arrival. */
  function showTab(plantId, key) {
    tab = key;
    tabFor = plantId;
  }

  /* Open a plant on its diary with one entry brought into view and lit for
     a moment. Set by the diary list, consumed once by mount(): a target that
     stayed set would scroll the reader back to the same entry on every
     re-render. */
  let targetLog = null;
  function showEntry(plantId, logId) {
    showTab(plantId, 'diary');
    targetLog = logId;
  }

  function plant(params) { return Store.getPlant(params.id); }

  function guard(params) {
    if (!plant(params)) {
      UI.toast('That plant is no longer in your greenhouse', 'warn');
      App.go('/greenhouse');
      return false;
    }
    if (tabFor !== params.id) { tab = 'care'; tabFor = params.id; }
    return true;
  }

  function title(params) { return Store.displayName(plant(params)); }

  function sub(params) {
    const sp = Store.species(plant(params));
    return sp ? sp.common : '';
  }

  function actions() {
    return '<button class="icon-btn" data-act="edit" aria-label="Edit plant">' + UI.icon('edit') + '</button>' +
           '<button class="icon-btn" data-act="diagnose" aria-label="Diagnose a problem">' + UI.icon('stethoscope') + '</button>';
  }

  function onAction(act) {
    const p = plant(App.route());
    if (!p) return;
    if (act === 'edit') ViewGreenhouse.plantForm(p.speciesId, p);
    if (act === 'diagnose') App.go('/diagnose/' + p.id);
  }

  /* ======================================================================
     Hero + quick actions
     ====================================================================== */

  function hero(p, sp) {
    const photo = Store.coverPhoto(p);
    const room = p.roomId ? Store.getRoom(p.roomId) : null;
    const match = Schedule.lightMatch(p);
    const risk = Schedule.petRisk(sp);
    const age = UI.fromISO(p.acquired);

    /* Ordered by what the plant is before where it is: how hard it is to keep
       and whether it can hurt anyone are true of this species anywhere, while
       the room and its light are facts about this particular pot and change
       the moment it is carried next door. The two coloured pills also sit
       together this way rather than being separated by a grey one. */
    const pills = [];
    if (sp) pills.push(UI.pill(LOOKUPS.DIFFICULTY[sp.difficulty].label, 'grey'));
    /* Same four steps as toxPill() below, and it matters that they match: the
       hero pill and the care-tab pill describe the same fact, so if the hero
       flattened 'toxic' and 'highly toxic' into one filled clay the tab would
       appear to contradict it. Filled clay is the top of the scale and has to
       stay rare enough to mean something. */
    if (risk) pills.push(UI.pill(LOOKUPS.TOX[risk.worst].label,
                                 risk.worst === 'mild' ? 'sun' :
                                 risk.worst === 'toxic' ? 'terra' : 'blood'));
    if (room) pills.push('<span class="pill pill-grey">' + UI.roomMark(room, 'mono-sm') +
                         UI.esc(room.name) + '</span>');
    if (match) {
      const variant = match.verdict === 'ideal' ? '' : match.verdict === 'ok' ? 'sun' : 'terra';
      const label = match.verdict === 'ideal' ? 'Perfect light' :
                    match.verdict === 'ok' ? 'Light is passable' : 'Wrong light';
      pills.push(UI.pill(label, variant));
    }

    return '<div class="hero">' +
      '<div class="hero-img" data-cover="1">' +
        UI.plantTile(photo, p.id, Store.displayName(p)) +
        '<span class="hero-img-edit">' + (photo ? 'Change' : 'Add photo') + '</span>' +
        /* The three things done to a plant most days, on the photograph's
           other corner, folded into one control. They were a bar of five
           chips under the plate; the bar went because Photo and Measure
           already have a home on their own tabs, and the three that are
           left are quicker one tap deep than five wide. */
        '<button class="quick-btn hero-img-quick" data-menu-toggle="hero-menu" aria-haspopup="menu" aria-expanded="false">' + UI.icon('plus') + 'Quick update</button>' +
        '<div class="pop-menu hero-menu" id="hero-menu" role="menu" hidden>' +
          '<button class="pop-opt" role="menuitem" data-quick="water">' + UI.icon('drop') + 'Water</button>' +
          '<button class="pop-opt" role="menuitem" data-quick="fertilise">' + UI.icon('wheat') + 'Feed</button>' +
          '<button class="pop-opt" role="menuitem" data-quick="note">' + UI.icon('note') + 'Add note</button>' +
        '</div>' +
      '</div>' +
      /* .hero-body, not an inline `flex:1`. The inline version was written on
         the assumption that .hero was a flex row; it never was, so the
         declaration sat here doing nothing while the plate took the full
         measure above it. How the two halves are arranged is the
         stylesheet's business — one column on a phone, a spread past the
         sidebar breakpoint — and cannot be expressed from here anyway. */
      /* Four stacked lines became two. The nickname, the common name, the
         botanical name and the date it arrived were each given a line of
         their own, which made a five-word plant occupy a third of the
         screen before a single fact about caring for it. Paired up, the top
         line is who this one is and how long you have had it, and the
         second is what it is, common name then botanical.

         The pairing only holds while the two halves differ. displayName
         falls back to the species common name when nothing has been
         nicknamed, and "Monstera — Monstera deliciosa" under a heading
         already reading MONSTERA is the third printing of the same word —
         so an un-nicknamed plant drops the common name and keeps the
         botanical alone. */
      '<div class="hero-body">' +
        '<div class="hero-line">' +
          '<h2 class="hero-nick">' + UI.esc(Store.displayName(p)) + '</h2>' +
          (age ? '<span class="hero-since">with you since ' + UI.esc(UI.fmtDate(age)) + '</span>' : '') +
        '</div>' +
        '<div class="hero-sci">' +
          (p.nickname && sp ? '<span class="hero-common">' + UI.esc(sp.common) + '</span> — ' : '') +
          UI.esc(sp ? sp.botanical : 'Unknown species') +
        '</div>' +
        '<div class="row-wrap" style="margin-top:11px">' + pills.join('') + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ======================================================================
     Care tab
     ====================================================================== */

  function careTab(p, sp) {
    if (!sp) return '<div class="card">This plant\'s species data is missing.</div>';

    const iv = Schedule.wateringInterval(p);
    const w = Schedule.waterDue(p);
    const ml = Schedule.waterAmount(p);
    const f = Schedule.fertiliseDue(p);
    const season = LOOKUPS.SEASON_META[Schedule.currentSeason()];

    /* --- Watering card, with the reasoning laid out --- */
    /* Three levels, and they escalate in the right direction. This ladder
       used to read terracotta for "never watered", rose for overdue,
       terracotta again for "due today" and blue for upcoming — which made a
       plant that is four days late look calmer than one due this afternoon,
       and spent two separate alarm colours to say one thing. Now: terracotta
       means act now, champagne means today, mint means you are fine. Same
       three levels as the nudges, the diagnosis cards and the difficulty
       pills, so a colour means the same thing everywhere in the app. */
    let dueLine, dueCls;
    if (w.never)          { dueLine = 'Never watered — give it a drink today'; dueCls = 'pill-terra'; }
    else if (w.days < 0)  { dueLine = UI.relDue(w.days); dueCls = 'pill-terra'; }
    else if (w.days === 0){ dueLine = 'Due today'; dueCls = 'pill-sun'; }
    else                  { dueLine = UI.relDue(w.days); dueCls = 'pill-mint'; }

    let html = '<div class="card">' +
      '<div class="row" style="align-items:flex-start">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="eyebrow">Watering</div>' +
          '<div style="font-family:var(--serif);font-size:22px;margin-top:3px">' +
            'Every ' + iv.days + ' days</div>' +
          '<div class="dim small" style="margin-top:2px">About ' + ml + 'ml each time' +
            (w.lastDate ? ' · last watered ' + UI.esc(UI.fmtDate(w.lastDate)) : '') + '</div>' +
        '</div>' +
        '<span class="pill ' + dueCls + ' pill-lg">' + UI.esc(dueLine) + '</span>' +
      '</div>' +

      (iv.factors.length
        ? '<hr class="divider">' +
          '<div class="eyebrow">Why ' + iv.days + ' and not ' + iv.base + '?</div>' +
          '<div class="stack" style="gap:8px;margin-top:9px">' + iv.factors.map(function (fac) {
            const short = fac.effect === 'shorter';
            return '<div class="factor">' +
              '<span class="factor-dir' + (short ? ' is-down' : ' is-up') + '" ' +
                'title="' + (short ? 'Shortens' : 'Lengthens') + ' the interval">' +
                UI.icon(short ? 'arrowDown' : 'arrowUp') + '</span>' +
              '<div style="min-width:0"><div class="factor-k">' + UI.esc(fac.label) + '</div>' +
              '<div class="tiny muted">' + UI.esc(fac.detail) + '</div></div>' +
            '</div>';
          }).join('') + '</div>'
        : '<hr class="divider"><p class="tiny muted" style="margin:0">' +
          'This is the species baseline for ' + UI.esc(season.label.toLowerCase()) + ' — nothing about your setup shifts it.</p>') +

      '<p class="hint">' + UI.esc(sp.water.note) + '</p>' +

      /* The primary used to carry flex:1, which is a phone habit: past the
         sidebar breakpoint the card is about 870px wide, so "Water now"
         became a solid emerald slab the width of the page with "Adjust
         schedule" marooned at the far right. Buttons now size to their
         labels and sit together in the card's footer strip, below the
         species note rather than wedged above it — read the reasoning,
         then act on it. */
      '<div class="card-foot">' +
        '<button class="btn btn-sm" data-quick="water">' + UI.icon('drop') + 'Water now</button>' +
        '<button class="btn btn-ghost btn-sm" data-tweak="1">Adjust schedule</button>' +
      '</div>' +
    '</div>';

    /* --- Feeding --- */
    /* Built to the same shape as the watering card above: eyebrow, serif
       interval, a dim detail line, a status pill on the right and the action
       in the footer strip. It used to state "2 days overdue" in the middle of
       the grey detail line while the identical fact about watering got a
       large pill, so the two cards disagreed about how much a lapsed feed
       matters. Same ladder, same weight — feeding is genuinely less urgent
       than watering, and the champagne/mint steps say so without hiding it. */
    let fCls = '', fLine = '';
    if (f && f.dormant)      { fCls = 'pill-grey'; fLine = 'Paused'; }
    else if (!f || f.never)  { fCls = 'pill-sun';  fLine = 'Not fed yet'; }
    else if (f.days < 0)     { fCls = 'pill-terra'; fLine = UI.relDue(f.days); }
    else if (f.days === 0)   { fCls = 'pill-sun';  fLine = 'Due today'; }
    else                     { fCls = 'pill-mint'; fLine = UI.relDue(f.days); }

    html += '<div class="section"><div class="card">' +
      '<div class="row" style="align-items:flex-start">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="eyebrow">Feeding</div>' +
          (f && f.dormant
            ? '<div style="font-family:var(--serif);font-size:22px;margin-top:3px">Paused for ' +
                UI.esc(season.label.toLowerCase()) + '</div>' +
              '<div class="dim small" style="margin-top:2px">' + UI.esc(f.reason) + '</div>'
            : '<div style="font-family:var(--serif);font-size:22px;margin-top:3px">Every ' +
                sp.fert.everyDays + ' days</div>' +
              '<div class="dim small" style="margin-top:2px">' + UI.esc(sp.fert.type) +
                ', at ' + UI.esc(sp.fert.strength) + ' strength</div>') +
        '</div>' +
        '<span class="pill ' + fCls + ' pill-lg">' + UI.esc(fLine) + '</span>' +
      '</div>' +
      (f && f.dormant
        ? ''
        : '<div class="card-foot">' +
            '<button class="btn btn-sm btn-soft" data-quick="fertilise">' +
              UI.icon('wheat') + 'Log a feed' +
            '</button>' +
          '</div>') +
    '</div></div>';

    /* --- Fact list --- */
    const light = LOOKUPS.LIGHT[sp.light.ideal];
    const match = Schedule.lightMatch(p);
    const tolerates = (sp.light.tolerates || []).map(function (k) { return LOOKUPS.LIGHT[k].short.toLowerCase(); });

    /* First element of each row is an icon *name* for UI.icon(), not a glyph. */
    const hum = LOOKUPS.HUMIDITY[sp.humidity];

    const facts = [
      [light.ico, 'Light', light.label + (tolerates.length ? ' (copes with ' + tolerates.join(', ') + ')' : ''),
       sp.light.note + (match ? ' ' + match.text : '')],
      hum ? [hum.ico, 'Humidity', hum.label, hum.desc] : null,
      ['thermo', 'Temperature', sp.idealC[0] + '–' + sp.idealC[1] + '°C',
       'Keep it above ' + sp.minC + '°C. Below that you start to see cold damage — mushy dark patches, sudden leaf drop.'],
      ['pot', 'Soil', sp.soil, ''],
      ['rotate', 'Repotting', sp.repot, p.lastRepotted ? 'Last repotted ' + UI.fmtDate(p.lastRepotted) + '.' : ''],
      ['ruler', 'Mature size', sp.matureCm >= 100 ? (sp.matureCm / 100).toFixed(1).replace('.0', '') + 'm' : sp.matureCm + 'cm',
       'Growth rate: ' + sp.growthRate + '.'],
      ['globe', 'Where it comes from', sp.origin || 'Unknown', sp.family ? 'Family: ' + sp.family + '.' : '']
    ].filter(Boolean);

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">What it wants</h2></div>' +
      UI.specSheet(facts) +
    '</div>';

    /* --- Likes and dislikes --- */
    if ((sp.likes || []).length || (sp.dislikes || []).length) {
      html += '<div class="section"><div class="grid grid-2">' +
        (sp.likes.length ? '<div class="card card-loves"><div class="eyebrow">Loves</div><ul class="trait-list">' +
          sp.likes.map(function (l) { return '<li>' + UI.esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
        (sp.dislikes.length ? '<div class="card card-hates"><div class="eyebrow">Hates</div><ul class="trait-list">' +
          sp.dislikes.map(function (l) { return '<li>' + UI.esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
      '</div></div>';
    }

    /* --- Pets --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Pets &amp; people</h2></div>' +
      '<div class="card">' +
        '<div class="row-wrap">' +
          toxPill('paw', 'Cats', sp.tox.cats) +
          toxPill('dog', 'Dogs', sp.tox.dogs) +
          toxPill('person', 'People', sp.tox.humans) +
        '</div>' +
        '<p class="hint">' + UI.esc(sp.tox.note) + '</p>' +
      '</div>' +
    '</div>';

    /* --- Known problems → straight into the diagnose flow --- */
    if ((sp.problems || []).length) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">What tends to go wrong</h2>' +
          '<span class="section-note">tap to diagnose</span></div>' +
        '<div class="row-wrap">' + sp.problems.map(function (id) {
          const d = PROBLEM_DATA.describe(id);
          if (!d) return '';
          return '<button class="chip" data-problem="' + UI.attr(id) + '">' +
            UI.icon(d.ico) + UI.esc(d.label) + '</button>';
        }).join('') + '</div>' +
      '</div>';
    }

    /* --- Danger zone --- */
    html += '<div class="section">' +
      '<button class="btn btn-blood btn-block" data-delete="1">' + UI.icon('trash') +
        'Remove ' + UI.esc(Store.displayName(p)) + '</button>' +
      '<p class="hint center">Its diary entries and photos go with it.</p>' +
    '</div>';

    return html;
  }

  function toxPill(ico, label, rating) {
    const t = LOOKUPS.TOX[rating] || LOOKUPS.TOX.safe;
    /* safe / mild / toxic / very-toxic -> plain, champagne, clay wash,
       oxblood fill. Oxblood is the top rung only: twenty-two of the
       forty-eight species are 'toxic' to cats and one is 'very-toxic', so
       putting the filled chip on both would mark half the catalogue and it
       would stop being read. The one that qualifies does so for cardiac
       glycosides rather than a sore mouth, which is the distinction the
       rung exists to make.
       The variant comes from LOOKUPS.TOX rather than a ladder written out
       here, because ViewDiscover renders the same ratings and the two
       copies drifted the last time the top rung moved. */
    return UI.pill(label + ': ' + t.label, t.variant, ico);
  }

  /* ======================================================================
     Diary tab
     ====================================================================== */

  function diaryTab(p) {
    const logs = Store.logsFor(p.id);

    /* Five buttons in two rows, directly under a bar that then offered Water,
       Feed, Photo, Measure and Note — and "Write an entry" was the Note chip
       a centimetre above it, the same sheet under a second name. Ten controls
       stacked between the photograph and the first diary line.

       What is left is the four kinds the quick menu on the photograph does
       not carry, as chips rather than buttons: they are the same weight of
       action as Water or Note, and
       drawing them as buttons claimed otherwise. Photos does this already —
       an invitation inside its empty state and an unobtrusive control beside
       the content once there is content. */
    const kinds = [
      ['milestone', 'star',        'Milestone'],
      ['problem',   'stethoscope', 'Problem'],
      ['repot',     'pot',         'Repotted'],
      ['prune',     'scissors',    'Pruned']
    ];

    if (!logs.length) {
      return UI.empty('note', 'The diary is blank',
        'Every watering you tick off lands here on its own. Add notes, photos and measurements too and you will ' +
        'have a real record of how this plant has changed.',
        '<button class="btn" data-quick="note">' + UI.icon('note') + 'Write the first entry</button>');
    }

    /* The four kinds behind one button, the same shape as Quick update on
       the photograph: a row of four chips over the first diary line was a
       second toolbar on a page that had just lost its first. */
    let html = '<div class="menu-anchor" style="margin-bottom:16px">' +
      '<button class="quick-btn" data-menu-toggle="diary-menu" aria-haspopup="menu" aria-expanded="false">' + UI.icon('plus') + 'Add diary entry</button>' +
      '<div class="pop-menu is-down" id="diary-menu" role="menu" hidden>' + kinds.map(function (k) {
        return '<button class="pop-opt" role="menuitem" data-quick="' + k[0] + '">' + UI.icon(k[1]) + UI.esc(k[2]) + '</button>';
      }).join('') + '</div></div>';

    html += '<div class="timeline">' + logs.map(function (l) {
      const kind = LOOKUPS.LOG_KINDS[l.kind] || LOOKUPS.LOG_KINDS.note;
      const photo = l.photoId ? Store.getPhoto(l.photoId) : null;

      /* The measurement is held apart from the other body bits because it is
         the one that may not need a card. A card is a frame, and a frame is
         a promise that there is something inside worth framing; a 930px-wide
         card containing the two words "84 cm" breaks that promise on every
         measurement in the diary, and a plant that gets measured monthly has
         a lot of them. Set bare against the rail, the figure is the thing you
         see instead of the box around it.
         So: a card only if there is prose or a photograph to put in it, and
         then the figure goes in with them, since it belongs to the same
         entry and would look orphaned outside. */
      const bodyBits = [];
      let metric = '';
      if (l.kind === 'growth' && typeof l.value === 'number') {
        metric = '<div class="tl-metric">' + l.value + ' ' + UI.esc(l.unit || 'cm') + '</div>';
      }
      if (l.text) bodyBits.push('<div class="tl-note">' + UI.esc(l.text) + '</div>');
      if (photo) bodyBits.push('<img src="' + UI.attr(photo) + '" alt="" data-photo="' + UI.attr(l.photoId) + '" ' +
        'style="width:100%;max-width:280px;border-radius:12px;margin-top:8px;display:block;cursor:zoom-in">');

      /* Delete lives on the date line and is revealed by hover, not printed
         into every entry. It used to be a mint "Delete" link inside each
         card, which made the loudest, most saturated text on the whole tab
         the one action nobody came to the diary to perform — a column of
         them running down the page, one per memory. A diary is for reading.

         The other half of the same edit: an entry with nothing in it used to
         render "No note  Delete" and no card, so a watering sat naked in a
         list of framed entries and the rail looked broken. A watering has
         nothing to say beyond its date, and the date line already says it —
         so bodyless entries now render as exactly that, a mark and a date,
         and they read as the quiet ticks between the entries that matter. */
      return '<div class="tl-item" id="log-' + UI.attr(l.id) + '">' +
        '<span class="tl-dot">' + UI.icon(kind.ico) + '</span>' +
        '<div class="tl-head">' +
          '<span class="tl-date">' + UI.esc(UI.fmtDate(l.date)) + ' · ' + UI.esc(kind.label) + '</span>' +
          '<button class="tl-del" data-del-log="' + UI.attr(l.id) + '" ' +
                  'aria-label="Delete this entry" title="Delete this entry">' +
            UI.icon('trash') +
          '</button>' +
        '</div>' +
        (bodyBits.length
          ? '<div class="card tl-card">' + metric + bodyBits.join('') + '</div>'
          : metric) +
      '</div>';
    }).join('') + '</div>';

    return html;
  }

  /* ======================================================================
     Photos tab
     ====================================================================== */

  function photosTab(p) {
    const shots = Store.photosFor(p.id);

    /* An empty gallery gets the app's empty state, not the populated layout
       with nothing in it. What shipped here was the latter, and it produced
       three separate things all saying the same nothing: an explanatory
       paragraph, a lone dashed tile in the top-left corner, and — centred in
       the content column, so floating in the middle of the page attached to
       neither — the words "No photos yet". Three notices and no invitation.

       One notice and one invitation instead. The copy also does more work
       than "No photos yet" ever could: it says why the feature is worth
       starting, which is the only thing an empty state can usefully do. */
    if (!shots.length) {
      return UI.empty('camera', 'No photographs yet',
        'A photo every few weeks turns into a surprisingly satisfying record. A year of growth is obvious in ' +
        'pictures long before it shows up in the numbers.',
        '<button class="btn" data-quick="photo">' + UI.icon('camera') + 'Add the first photo</button>');
    }

    return '<p class="dim small" style="margin:0 2px 14px">' +
        'A photo every few weeks turns into a surprisingly satisfying record. Photos are downscaled to save space.' +
      '</p>' +
      '<div class="photo-grid">' +
        '<button class="photo-add" data-quick="photo">' + UI.icon('camera') + 'Add photo</button>' +
        shots.map(function (l) {
          const src = Store.getPhoto(l.photoId);
          if (!src) return '';
          return '<button class="photo-cell" data-photo-log="' + UI.attr(l.id) + '">' +
            '<img src="' + UI.attr(src) + '" alt="">' +
            '<span class="photo-cell-date">' + UI.esc(UI.fmtDate(l.date)) + '</span>' +
          '</button>';
        }).join('') +
      '</div>';
  }

  /* ======================================================================
     Growth tab
     ====================================================================== */

  function growthTab(p, sp) {
    const logs = Store.growthFor(p.id);
    const unit = logs.length ? (logs[logs.length - 1].unit || 'cm') : 'cm';

    /* The chart is always here, drawn or waiting. An empty state that
       replaced it hid what the tab was for; the frame with nothing in it yet
       says it better, and the one button that fills it sits over it. */
    let html = '<div class="row" style="margin-bottom:14px"><button class="btn btn-sm" data-quick="growth">' + UI.icon('ruler') + (logs.length ? 'Add a measurement' : 'Add the first measurement') + '</button></div>';

    const points = logs.map(function (l) {
      return { x: UI.fromISO(l.date).getTime(), y: l.value };
    });

    if (!logs.length) {
      html += '<div class="card">' + UI.lineChart([], unit) +
        '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--hair)">' +
          '<div style="font-family:var(--serif);font-size:18px;margin-bottom:6px">Your growth curve draws here</div>' +
          '<p class="hint" style="margin:0">Measure from the soil to the highest growing point, or take the widest leaf, and log it every few weeks. Be consistent rather than precise — the shape of the curve is the interesting part. It shows whether a plant is happy where it stands: one that slows in a room is telling you about the light there, and one that surges after a repot has told you the pot was the problem.</p>' +
        '</div></div>';
      return html;
    }

    const first = logs[0], last = logs[logs.length - 1];
    const gain = last.value - first.value;
    const days = UI.daysBetween(UI.fromISO(first.date), UI.fromISO(last.date));
    const perMonth = days > 0 ? (gain / days) * 30 : 0;

    html += '<div class="card">' + UI.lineChart(points, unit) + '</div>';

    html += '<div class="section"><div class="grid grid-2">' +
      statCard('Now', last.value + ' ' + unit, 'Measured ' + UI.fmtDate(last.date)) +
      statCard('Change', (gain >= 0 ? '+' : '') + Math.round(gain * 10) / 10 + ' ' + unit,
        days > 0 ? 'Over ' + UI.plural(days, 'day') : 'First measurement') +
      (days >= 14 ? statCard('Pace', (perMonth >= 0 ? '+' : '') + Math.round(perMonth * 10) / 10 + ' ' + unit + '/mo',
        'Species is a ' + sp.growthRate + ' grower') : '') +
      (sp.matureCm ? statCard('Mature size', sp.matureCm >= 100
        ? (sp.matureCm / 100).toFixed(1).replace('.0', '') + 'm' : sp.matureCm + 'cm',
        Math.round((last.value / sp.matureCm) * 100) + '% of the way there') : '') +
    '</div></div>';

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">All measurements</h2>' +
        '<span class="section-note">' + logs.length + '</span></div>' +
      '<div class="facts facts-ledger">' + logs.slice().reverse().map(function (l, i) {
        /* `logs` runs chronologically and this list runs newest-first, so the
           entry each row grew *from* sits one further along the reversed run:
           i counts back from the end, so its predecessor is length - 2 - i.
           The oldest row has none, which is what the guard below is for.

           The change is the whole reason to keep a growth record, and until
           now it existed only in aggregate in the Change card above — you
           could see the plant had gained 27cm overall and not which month
           it happened in. */
        const before = logs[logs.length - 2 - i];
        let delta;
        if (!before) {
          delta = '<span class="meas-delta">First measurement</span>';
        } else {
          const d = Math.round((l.value - before.value) * 10) / 10;
          const gap = UI.daysBetween(UI.fromISO(before.date), UI.fromISO(l.date));
          delta = '<span class="meas-delta' + (d > 0 ? ' is-up' : '') + '">' +
            (d === 0 ? 'No change' : (d > 0 ? '+' : '') + d + ' ' + UI.esc(l.unit || 'cm')) +
            (gap > 0 ? ' in ' + UI.plural(gap, 'day') : '') +
          '</span>';
        }

        return '<div class="fact">' +
          '<div class="fact-k">' + UI.esc(UI.fmtDate(l.date)) + '</div>' +
          '<div class="fact-body">' +
            '<div class="fact-v">' + l.value + ' ' + UI.esc(l.unit || 'cm') + '</div>' +
            (l.text ? '<span class="meas-note">' + UI.esc(l.text) + '</span>' : '') +
          '</div>' +
          delta +
          /* Same hover-revealed trash as the diary. Consistency is the lesser
             reason; the real one is that this list is the plant's growth
             record and the only reason to read it is to see the numbers
             climb. A column of "Delete" links down the right-hand side
             competes with the figures for exactly the attention the section
             exists to attract. */
          '<button class="tl-del" data-del-log="' + UI.attr(l.id) + '" ' +
                  'aria-label="Delete this measurement" title="Delete this measurement">' +
            UI.icon('trash') +
          '</button>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>';

    return html;
  }

  function statCard(key, value, note) {
    return '<div class="card">' +
      '<div class="eyebrow">' + UI.esc(key) + '</div>' +
      '<div style="font-family:var(--serif);font-size:22px;margin-top:3px">' + UI.esc(value) + '</div>' +
      '<div class="tiny muted" style="margin-top:2px">' + UI.esc(note) + '</div>' +
    '</div>';
  }

  /* ======================================================================
     Propagate tab
     ====================================================================== */

  function propTab(p, sp) {
    if (!sp) return '';
    const growing = Schedule.isGrowingSeason();
    const season = LOOKUPS.SEASON_META[Schedule.currentSeason()];

    let html = '';

    if (!(sp.prop || []).length) {
      html += UI.empty('sprout', 'No propagation method recorded',
        'This species is not usually propagated at home — it is either grown from tissue culture or from ' +
        'offsets that take years to appear.');
    } else {
      /* Timing advice, so it speaks in the nudge voice rather than as a card:
         emerald when the season is with you, champagne when it is not. */
      html += '<div class="nudge' + (growing ? '' : ' nudge-warn') + '" style="margin-bottom:14px">' +
        '<span class="nudge-ico">' + UI.icon(season.ico) + '</span>' +
        '<div style="min-width:0;flex:1">' +
          '<div class="nudge-t">' + UI.esc(growing ? 'Good time to propagate' : 'Not the season for it') + '</div>' +
          '<p class="nudge-p">' +
            (growing
              ? 'It is ' + UI.esc(season.label.toLowerCase()) + ' — active growth means cuttings root faster and rot less.'
              : 'It is ' + UI.esc(season.label.toLowerCase()) + '. Cuttings taken now root slowly and often rot instead. Wait for spring if you can.') +
          '</p>' +
          /* The verdict is the answer most visits want; the method is a
             page of steps that only matters on the day. So the steps wait
             behind one button, and the card carries it. */
          '<div style="margin-top:12px"><button class="btn btn-sm' + (growing ? '' : ' btn-soft') + '" data-prop-show="1" aria-expanded="false" aria-controls="prop-how">' + UI.icon('sprout') + 'Show me how</button></div>' +
        '</div>' +
      '</div>';

      html += '<div id="prop-how" hidden>';
      html += '<div class="stack" style="gap:14px">' + sp.prop.map(function (m, i) {
        return '<div class="card">' +
          '<div class="row" style="align-items:flex-start">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-family:var(--serif);font-size:18px">' + UI.esc(m.m) + '</div>' +
              '<div class="row-wrap" style="margin-top:7px">' +
                UI.pill(LOOKUPS.DIFFICULTY[m.diff] ? LOOKUPS.DIFFICULTY[m.diff].label : m.diff,
                        m.diff === 'easy' ? '' : m.diff === 'hard' ? 'terra' : 'sun') +
                UI.pill(m.season, 'grey', 'calendar') +
                UI.pill('Roots in ' + m.roots, 'grey', 'clock') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<ol class="dx-steps">' + m.steps.map(function (s) {
            return '<li>' + UI.esc(s) + '</li>';
          }).join('') + '</ol>' +
          '<div class="card-foot">' +
            '<button class="btn btn-sm btn-soft" data-prop="' + i + '">' +
              UI.icon('sprout') + 'Log that I propagated ' + UI.esc(Store.displayName(p)) +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    /* --- Seeds --- */
    if (sp.seed) {
      const s = sp.seed;
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">From seed</h2>' +
          '<span class="section-note">' + (s.viable ? 'worth doing' : 'rarely works') + '</span></div>' +
        '<div class="card">' +
          '<div class="row-wrap">' +
            UI.pill('Sow in ' + s.sowSeason, 'grey', 'calendar') +
            UI.pill('Germinates in ' + s.germDays, 'grey', 'sprout') +
            UI.pill(s.depthMm + 'mm deep', 'grey', 'ruler') +
          '</div>' +
          '<ol class="dx-steps">' + s.steps.map(function (x) {
            return '<li>' + UI.esc(x) + '</li>';
          }).join('') + '</ol>' +
        '</div>' +
      '</div>';
    }
    /* The seed section folds with the cuttings: both are instructions. */
    if ((sp.prop || []).length) html += '</div>';

    return html;
  }

  /* ======================================================================
     Entry sheets
     ====================================================================== */

  /* One sheet handles every diary entry kind. */
  function entrySheet(p, kind) {
    const k = LOOKUPS.LOG_KINDS[kind] || LOOKUPS.LOG_KINDS.note;
    const isGrowth = kind === 'growth';
    const lastGrowth = Store.growthFor(p.id).slice(-1)[0];

    const placeholders = {
      note: 'New leaf unfurling on the left side. Moved it 30cm back from the window.',
      milestone: 'First flower! Third year with me.',
      problem: 'Two lower leaves yellowing. Soil felt damp so I am holding off watering.',
      repot: 'Moved up to an 18cm terracotta pot. Roots were circling badly.',
      prune: 'Took off the two longest vines and put the cuttings in water.',
      propagate: 'Three node cuttings in water on the kitchen windowsill.',
      water: 'Gave it a thorough soak in the sink.',
      fertilise: 'Half-strength balanced feed.'
    };

    const body =
      '<label class="field"><span class="label">Date</span>' +
        '<input class="input" id="e-date" type="date" max="' + UI.toISO(UI.today()) + '" ' +
        'value="' + UI.toISO(UI.today()) + '"></label>' +

      (isGrowth
        ? '<div class="grid grid-2" style="gap:12px">' +
            '<label class="field"><span class="label">Measurement</span>' +
              '<input class="input" id="e-value" type="number" step="0.5" min="0" ' +
              'placeholder="' + (lastGrowth ? lastGrowth.value : 30) + '" inputmode="decimal"></label>' +
            '<label class="field"><span class="label">Unit</span>' +
              '<select class="select" id="e-unit">' +
                '<option value="cm">cm — height</option>' +
                '<option value="cm wide">cm — width</option>' +
                '<option value="leaves">leaves</option>' +
              '</select></label>' +
          '</div>' +
          (lastGrowth
            ? '<p class="hint" style="margin:-6px 0 14px">Last time you recorded ' + lastGrowth.value + ' ' +
              UI.esc(lastGrowth.unit || 'cm') + ' on ' + UI.esc(UI.fmtDate(lastGrowth.date)) + '.</p>'
            : '<p class="hint" style="margin:-6px 0 14px">Measure soil to the highest growing tip, and try to ' +
              'measure the same way each time.</p>')
        : '') +

      '<label class="field"><span class="label">' + (isGrowth ? 'Note (optional)' : 'What happened?') + '</span>' +
        '<textarea class="textarea" id="e-text" maxlength="1200" placeholder="' +
        UI.attr(placeholders[kind] || '') + '"></textarea></label>' +

      '<div class="field"><span class="label">Photo (optional)</span>' +
        '<div class="row" style="gap:8px">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="e-photo">' + UI.icon('camera') + 'Attach a photo</button>' +
          '<span class="tiny muted" id="e-photo-state"></span>' +
        '</div>' +
        '<div id="e-photo-prev"></div>' +
      '</div>' +

      '<div class="row" style="gap:8px;margin-top:18px">' +
        '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>' +
        '<button class="btn" id="e-save" style="flex:2">Save entry</button>' +
      '</div>';

    /* No glyph: sheet titles are set as textContent and cannot hold markup. */
    UI.openSheet(k.label, body, function (root) {
      let photoData = null;

      root.querySelector('#e-photo').addEventListener('click', function () {
        Photos.pick(function (dataUrl) {
          photoData = dataUrl;
          root.querySelector('#e-photo-state').textContent =
            '~' + Math.round(Photos.approxBytes(dataUrl) / 1024) + 'KB';
          root.querySelector('#e-photo-prev').innerHTML =
            '<img src="' + UI.attr(dataUrl) + '" alt="" style="width:100%;max-width:200px;' +
            'border-radius:12px;margin-top:10px;display:block">';
        });
      });

      root.querySelector('#e-save').addEventListener('click', function () {
        const text = root.querySelector('#e-text').value.trim();
        const date = root.querySelector('#e-date').value || UI.toISO(UI.today());

        let value = null, unit = null;
        if (isGrowth) {
          value = Number(root.querySelector('#e-value').value);
          if (!value || value <= 0) { UI.toast('Enter a measurement first', 'warn'); return; }
          unit = root.querySelector('#e-unit').value;
        }

        if (!isGrowth && !text && !photoData && ['note', 'milestone', 'problem'].indexOf(kind) !== -1) {
          UI.toast('Write something, or attach a photo', 'warn');
          return;
        }

        let photoId = null;
        if (photoData) {
          photoId = Store.savePhoto(photoData);
          if (!photoId) return;   // storage full — savePhoto has already warned
        }

        Store.addLog({
          plantId: p.id, kind: kind, date: date, text: text,
          value: value, unit: unit, photoId: photoId
        });

        UI.closeSheet();
        UI.toast('Added to the diary', 'leaf');
        App.refresh();
      });
    });
  }

  /* Log watering / feeding with a single tap, but let the date be corrected. */
  function quickCare(p, kind) {
    const verb = LOOKUPS.TASKS[kind] ? LOOKUPS.TASKS[kind].verb : 'Logged';
    Store.addLog({ plantId: p.id, kind: kind, date: UI.toISO(UI.today()) });
    UI.toast(verb + ' ' + Store.displayName(p), 'leaf');
    App.refresh();
  }

  /* Add a photo straight into the diary. */
  function quickPhoto(p) {
    Photos.pick(function (dataUrl) {
      const id = Store.savePhoto(dataUrl);
      if (!id) return;
      Store.addLog({ plantId: p.id, kind: 'photo', photoId: id, date: UI.toISO(UI.today()) });
      // The first photo becomes the cover automatically.
      if (!p.coverPhotoId) Store.updatePlant(p.id, { coverPhotoId: id });
      UI.toast('Photo saved', 'leaf');
      App.refresh();
    });
  }

  /* Manual nudge to the watering interval, on top of everything calculated. */
  function tweakSheet(p) {
    const iv = Schedule.wateringInterval(p);
    const opts = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

    UI.openSheet('Adjust watering',
      '<p class="dim small" style="margin:0 0 16px;line-height:1.6">' +
        'I make it every <strong>' + iv.days + ' days</strong> for this one. If you know your home runs ' +
        'hotter, draughtier or damper than I\'m assuming, nudge it here — I\'ll keep the seasonal and pot ' +
        'adjustments on top of whatever you choose.' +
      '</p>' +
      '<div class="row-wrap" id="tw-opts">' + opts.map(function (o) {
        return '<button class="chip' + (p.waterOffset === o ? ' is-on' : '') + '" data-off="' + o + '">' +
          (o === 0 ? 'No change' : (o > 0 ? '+' + o : o) + ' days') + '</button>';
      }).join('') + '</div>' +
      '<p class="hint" id="tw-note">Negative means water sooner.</p>',
      function (root) {
        root.querySelector('#tw-opts').addEventListener('click', function (e) {
          const b = e.target.closest('[data-off]');
          if (!b) return;
          Store.updatePlant(p.id, { waterOffset: Number(b.getAttribute('data-off')) });
          UI.closeSheet();
          UI.toast('Schedule updated', 'leaf');
          App.refresh();
        });
      });
  }

  /* Tapping a photo: view it large, promote it to cover, or delete it. */
  function photoSheet(p, log) {
    const src = Store.getPhoto(log.photoId);
    if (!src) return;
    const isCover = p.coverPhotoId === log.photoId;

    UI.openSheet(UI.fmtDate(log.date),
      '<img src="' + UI.attr(src) + '" alt="" style="width:100%;border-radius:14px;display:block">' +
      (log.text ? '<p class="small dim" style="margin:12px 0 0">' + UI.esc(log.text) + '</p>' : '') +
      '<div class="stack" style="gap:8px;margin-top:16px">' +
        '<button class="btn btn-ghost" data-p="zoom">Open full size</button>' +
        (isCover
          ? '<button class="btn btn-soft" disabled>Already the cover photo</button>'
          : '<button class="btn btn-soft" data-p="cover">Make this the cover photo</button>') +
        '<button class="btn btn-blood" data-p="del">Delete photo</button>' +
      '</div>',
      function (root) {
        root.addEventListener('click', function (e) {
          const b = e.target.closest('[data-p]');
          if (!b) return;
          const which = b.getAttribute('data-p');

          if (which === 'zoom') { UI.closeSheet(); UI.lightbox(src, UI.fmtDate(log.date)); return; }

          if (which === 'cover') {
            Store.updatePlant(p.id, { coverPhotoId: log.photoId });
            UI.closeSheet();
            UI.toast('Cover photo set', 'leaf');
            App.refresh();
            return;
          }

          if (which === 'del') {
            UI.closeSheet();
            UI.confirmSheet('Delete this photo?', 'The diary entry goes with it. This cannot be undone.',
              'Delete', function () {
                if (p.coverPhotoId === log.photoId) Store.updatePlant(p.id, { coverPhotoId: null });
                Store.deleteLog(log.id);
                UI.toast('Photo deleted');
                App.refresh();
              }, true);
          }
        });
      });
  }

  /* ======================================================================
     Assembly
     ====================================================================== */

  const TABS = [
    ['care', 'Care'], ['diary', 'Diary'], ['photos', 'Photos'],
    ['growth', 'Growth'], ['prop', 'Propagate']
  ];

  function render(params) {
    const p = plant(params);
    const sp = Store.species(p);

    const photoCount = Store.photosFor(p.id).length;
    const logCount = Store.logsFor(p.id).length;

    let html = hero(p, sp);

    html += '<div class="tabs">' + TABS.map(function (t) {
      let label = t[1];
      if (t[0] === 'photos' && photoCount) label += ' (' + photoCount + ')';
      if (t[0] === 'diary' && logCount) label += ' (' + logCount + ')';
      return '<button class="tab-btn' + (tab === t[0] ? ' is-on' : '') + '" data-tab="' + t[0] + '">' +
        UI.esc(label) + '</button>';
    }).join('') + '</div>';

    /* One measure of air between the tab strip and whatever it opens. The
       panels used to butt against it, so a nudge or a chip row read as part
       of the control rather than the page it had switched to. */
    html += '<div class="tab-body">';
    if (tab === 'care')        html += careTab(p, sp);
    else if (tab === 'diary')  html += diaryTab(p);
    else if (tab === 'photos') html += photosTab(p);
    else if (tab === 'growth') html += growthTab(p, sp);
    else                       html += propTab(p, sp);
    html += '</div>';

    return html;
  }

  function mount(root, params) {
    const p = plant(params);

    if (targetLog) {
      const el = root.querySelector('#log-' + targetLog);
      targetLog = null;
      if (el) {
        el.classList.add('is-target');
        /* After the view's own entrance, or the scroll lands on where the
           element was before viewIn finished translating it. */
        setTimeout(function () { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
      }
    }

    root.addEventListener('click', function (e) {
      const t = e.target.closest('[data-tab]');
      /* refresh() holds the reader's scroll position, so the strip has to be
         brought back into view when the tab just switched to is shorter than
         the one being read. Nothing moves if the tabs are already on screen,
         which is the common case. */
      if (t) {
        tab = t.getAttribute('data-tab');
        App.refresh();
        UI.keepTabsInView(document.getElementById('view'));
        return;
      }

      /* The quick menu sits on the photograph, which is itself a tap target
         for changing the picture, so its toggle and its options are read
         before the cover is — and any tap anywhere else closes it. */
      const tog = e.target.closest('[data-menu-toggle]');
      root.querySelectorAll('.pop-menu').forEach(function (m) {
        const own = tog && tog.getAttribute('data-menu-toggle') === m.id;
        const open = own ? m.hidden : false;
        if (!own && !m.hidden && e.target.closest('#' + m.id)) return;
        m.hidden = !open;
        const t = root.querySelector('[data-menu-toggle="' + m.id + '"]'); if (t) t.setAttribute('aria-expanded', String(open));
      });
      if (tog) return;

      const show = e.target.closest('[data-prop-show]');
      if (show) {
        const how = root.querySelector('#prop-how'); how.hidden = !how.hidden;
        show.setAttribute('aria-expanded', String(!how.hidden));
        show.innerHTML = UI.icon('sprout') + (how.hidden ? 'Show me how' : 'Hide the steps');
        return;
      }

      const q = e.target.closest('[data-quick]');
      if (q) {
        root.querySelectorAll('.pop-menu').forEach(function (m) { m.hidden = true; });
        const kind = q.getAttribute('data-quick');
        if (kind === 'water' || kind === 'fertilise') quickCare(p, kind);
        else if (kind === 'photo') quickPhoto(p);
        else entrySheet(p, kind);
        return;
      }

      if (e.target.closest('[data-cover]')) { quickPhoto(p); return; }

      if (e.target.closest('[data-tweak]')) { tweakSheet(p); return; }

      const prop = e.target.closest('[data-prop]');
      if (prop) { entrySheet(p, 'propagate'); return; }

      const prob = e.target.closest('[data-problem]');
      if (prob) { App.go('/diagnose/' + p.id + '/' + prob.getAttribute('data-problem')); return; }

      const cell = e.target.closest('[data-photo-log]');
      if (cell) {
        const log = Store.logsFor(p.id).filter(function (l) {
          return l.id === cell.getAttribute('data-photo-log');
        })[0];
        if (log) photoSheet(p, log);
        return;
      }

      const inline = e.target.closest('[data-photo]');
      if (inline) { UI.lightbox(inline.getAttribute('src')); return; }

      const del = e.target.closest('[data-del-log]');
      if (del) {
        const id = del.getAttribute('data-del-log');
        UI.confirmSheet('Delete this entry?', 'It will be removed from the diary permanently.',
          'Delete', function () {
            Store.deleteLog(id);
            UI.toast('Entry deleted');
            App.refresh();
          }, true);
        return;
      }

      if (e.target.closest('[data-delete]')) {
        UI.confirmSheet('Remove ' + Store.displayName(p) + '?',
          'Its diary entries, measurements and photos will all be deleted. This cannot be undone.',
          'Remove plant', function () {
            Store.deletePlant(p.id);
            UI.toast('Removed from your greenhouse');
            App.go('/greenhouse');
          }, true);
      }
    });
  }

  return {
    guard: guard, title: title, sub: sub, actions: actions, onAction: onAction,
    back: true, render: render, mount: mount,
    entrySheet: entrySheet, showTab: showTab, showEntry: showEntry
  };
})();
