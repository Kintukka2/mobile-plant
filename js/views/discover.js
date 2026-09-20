/* ==========================================================================
   Sprout — Discover
   --------------------------------------------------------------------------
   The catalogue: browse the built-in species data, filter it by the things
   people actually care about (pet safety, light, difficulty), and add
   anything straight into the greenhouse.

   This file also holds ViewSpecies — the read-only profile for a species
   you do not own yet.
   ========================================================================== */

window.ViewDiscover = (function () {

  let query = '';
  let filter = 'all';

  /* Text only. This is a fifteen-chip bar that already scrolls sideways, and
     a glyph on each one would widen every chip — making the scroll worse —
     to decorate a control whose selected state is the only thing the eye
     needs. Chips elsewhere keep their icons, because there the icon names a
     care action rather than restating the word beside it. */
  const FILTERS = [
    { key: 'all',              label: 'Everything' },
    { key: 'beginner',         label: 'Beginner' },
    { key: 'pet-safe',         label: 'Pet safe' },
    { key: 'low-light',        label: 'Low light' },
    { key: 'sun-lover',        label: 'Sun lover' },
    { key: 'trailing',         label: 'Trailing' },
    { key: 'succulent',        label: 'Succulent' },
    { key: 'drought-tolerant', label: 'Forgiving' },
    { key: 'humidity-lover',   label: 'Humidity' },
    { key: 'flowering',        label: 'Flowering' },
    { key: 'statement',        label: 'Statement' },
    { key: 'compact',          label: 'Compact' },
    { key: 'herb',             label: 'Herbs' },
    { key: 'air-purifying',    label: 'Air purifying' },
    { key: 'tricky',           label: 'A challenge' }
  ];

  /* ---------- Cards ---------- */

  function speciesCard(sp) {
    const owned = Store.activePlants().filter(function (p) { return p.speciesId === sp.id; }).length;
    const risk = Schedule.petRisk(sp);

    /* The species initial rather than a pictogram, exactly as on the plant
       tiles and the room plates. Forty-eight species meant forty-eight
       arbitrary emoji — a cheese wedge for a Swiss cheese plant, a flamingo
       for a flamingo flower — which is a pun, not a catalogue. A grid of
       initials set in the display face reads as a collection. */
    return '<button class="pcard" data-species="' + UI.attr(sp.id) + '">' +
      '<div class="pcard-img">' +
        UI.plantTile(null, sp.id, sp.common) +
        /* .pcard-drop, for the same reason the Greenhouse card's water badge
           uses it: .drop is an 8px bead and will not hold a tick and a word,
           and anything in flow here paints behind the absolutely-positioned
           tile. "Owned" was invisible on every species you already grow —
           exactly the marker most worth seeing while browsing a catalogue,
           since its whole purpose is to stop you buying a second one. */
        (owned
          ? '<span class="pcard-drop">' + UI.icon('check') +
              UI.esc(owned > 1 ? owned + ' owned' : 'Owned') +
            '</span>'
          : '') +
      '</div>' +
      '<div class="pcard-body">' +
        '<div class="pcard-name">' + UI.esc(sp.common) + '</div>' +
        '<div class="pcard-sci">' + UI.esc(sp.botanical) + '</div>' +
        /* The pet-risk pill alone, and no footer at all without one.

           It used to sit beside a grey pill carrying the ideal light, and the
           two do not fit: at 390px the card is ~166px wide against 181px of
           pills, so .pcard clipped the second one and the catalogue showed a
           terracotta chip reading "TO" — a toxicity warning truncated
           mid-word, on the one fact here that can send a cat to a vet.
           Allowing the row to wrap would have been legible but doubled the
           footer's height on nearly every tile in a 48-card grid, and
           tightening the type would have bought the 15px back at 390px only
           to lose it again at 360px, which plenty of phones are.

           So the real question was which pill deserved the room, and the
           light chip cannot answer it. Across 48 species and four light
           levels the value repeats constantly — most cards read BRIGHT or
           MEDIUM — and a mark that says the same thing on almost every tile
           stops being read at all, the same failure as the four LIVING ROOM
           chips and the four RIGHT LIGHT pills before it. This page also
           states light better twice over: the "Good matches for your rooms"
           list above ties it to the user's own rooms ("Ideal for Bathroom —
           medium light"), and there is a Low light filter. The full figures
           are on the species page in the Care sheet.

           Toxicity is the opposite kind of fact: sparse, and the one that
           changes whether you buy the plant at all. Standing alone, a
           terracotta chip is a real signal in the grid rather than one of two
           decorations on every tile — and a pet-safe species gets no footer,
           which is the same quiet good news the room view's .assure line
           makes by saying nothing per card. */
        (risk
          ? '<div class="pcard-foot">' +
              UI.pill(risk.worst === 'mild' ? 'Mild' : risk.worst === 'toxic' ? 'Toxic' : 'Highly toxic',
                      risk.worst === 'mild' ? 'sun' : risk.worst === 'toxic' ? 'terra' : 'blood', 'paw') +
            '</div>'
          : '') +
      '</div>' +
    '</button>';
  }

  /* ---------- Filtering ---------- */

  function matches(sp) {
    if (filter === 'all') return true;
    if (filter === 'pet-safe') {
      // Genuinely safe for both, not merely "mild".
      return sp.tox.cats === 'safe' && sp.tox.dogs === 'safe';
    }
    if (filter === 'beginner') return sp.difficulty === 'easy';
    if (filter === 'tricky')   return sp.difficulty === 'hard';
    if (filter === 'low-light') {
      return sp.light.ideal === 'low' || (sp.light.tolerates || []).indexOf('low') !== -1;
    }
    return (sp.tags || []).indexOf(filter) !== -1;
  }

  function results() {
    return ViewGreenhouse.searchSpecies(query).filter(matches);
  }

  /* ---------- View ---------- */

  function title() { return 'Discover'; }
  function sub() { return window.PLANT_DATA.length + ' plants I know properly'; }

  function render() {
    const list = results();
    const rooms = Store.get().rooms.filter(function (r) { return !!r.light; });

    let html =
      '<div class="field" style="margin-bottom:12px">' +
        '<input class="input input-search" id="dq" type="search" autocomplete="off" ' +
          'placeholder="Search by name, family or trait" value="' + UI.attr(query) + '">' +
      '</div>' +
      '<div class="row-wrap" style="margin-bottom:16px;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px">' +
        FILTERS.map(function (f) {
          return '<button class="chip nowrap' + (filter === f.key ? ' is-on' : '') + '" ' +
            'data-filter="' + UI.attr(f.key) + '">' + UI.esc(f.label) + '</button>';
        }).join('') +
      '</div>';

    /* Personalised shortlist: what suits the rooms they actually have. */
    if (!query && filter === 'all' && rooms.length) {
      const owned = Store.activePlants().map(function (p) { return p.speciesId; });
      const picks = [];

      rooms.forEach(function (room) {
        const best = window.PLANT_DATA.filter(function (sp) {
          return sp.light.ideal === room.light &&
                 owned.indexOf(sp.id) === -1 &&
                 picks.every(function (x) { return x.sp.id !== sp.id; }) &&
                 (!Schedule.petRisk(sp));
        }).slice(0, 2);
        best.forEach(function (sp) { picks.push({ sp: sp, room: room }); });
      });

      if (picks.length) {
        html += '<div class="section" id="dc-recs" style="margin-top:0">' +
          '<div class="section-head"><h2 class="section-title">Good matches for your rooms</h2>' +
            '<span class="section-note">based on your light</span></div>' +
          '<div class="stack" style="gap:8px">' + picks.slice(0, 5).map(function (x) {
            const rl = LOOKUPS.LIGHT[x.room.light];
            return '<button class="dx-opt" data-species="' + UI.attr(x.sp.id) + '" style="margin:0">' +
              UI.monogram(x.sp.common) +
              '<span style="min-width:0">' +
                '<span class="dx-opt-t">' + UI.esc(x.sp.common) + '</span>' +
                '<span class="dx-opt-d">Ideal for your ' + UI.esc(x.room.name) +
                  (rl ? ' — ' + UI.esc(rl.label.toLowerCase()) : '') + '</span>' +
              '</span>' +
              UI.icon('chevron', 'muted') +
            '</button>';
          }).join('') + '</div>' +
        '</div>';
      }
    }

    html += '<div class="section" style="margin-top:20px">' +
      '<div class="section-head">' +
        '<h2 class="section-title" id="dc-head">' + (filter === 'all' && !query ? 'All plants' : 'Results') + '</h2>' +
        '<span class="section-note" id="dc-count">' + UI.plural(list.length, 'plant') + '</span>' +
      '</div>' +
      (list.length
        ? '<div class="grid grid-plants">' + list.map(speciesCard).join('') + '</div>'
        : UI.empty('search', 'Nothing matches',
            /* Counted, not typed. Three places claimed "48" from memory and
               the dataset is the only thing that actually knows — a number
               promising the size of the catalogue goes quietly wrong the
               first time a species is added, and it goes wrong in the most
               embarrassing place, which is the screen apologising for not
               having what you searched for. */
            'Try a different search, or clear the filter. I cover ' + window.PLANT_DATA.length +
            ' of the most common houseplants — if yours is missing, its closest relative will ' +
            'usually want near-identical care.',
            '<button class="btn btn-ghost" data-reset="1">Clear filters</button>')) +
    '</div>';

    return html;
  }

  function mount(root) {
    const q = root.querySelector('#dq');

    if (q) {
      // Redraw only the results, so the input keeps focus and the caret.
      q.addEventListener('input', function () {
        query = q.value;
        const list = results();
        const grid = root.querySelector('.grid-plants');

        // A full re-render is the only way to swap the grid for the empty
        // state and back, so fall back to it whenever the grid is missing or
        // about to become empty — then restore focus and the caret.
        if (!grid || !list.length) {
          App.refresh();
          const again = document.getElementById('dq');
          if (again) { again.focus(); again.setSelectionRange(query.length, query.length); }
          return;
        }

        grid.innerHTML = list.map(speciesCard).join('');

        /* Target these by id. Reaching for the first `.section-note` picked up
           the room-recommendation heading instead, so the result count never
           moved and "based on your light" was overwritten with a plant count. */
        const count = root.querySelector('#dc-count');
        if (count) count.textContent = UI.plural(list.length, 'plant');

        const head = root.querySelector('#dc-head');
        if (head) head.textContent = (filter === 'all' && !query) ? 'All plants' : 'Results';

        // The suggestions are only meaningful for an unfiltered browse.
        const recs = root.querySelector('#dc-recs');
        if (recs) recs.hidden = !!query;
      });
    }

    root.addEventListener('click', function (e) {
      const f = e.target.closest('[data-filter]');
      if (f) { filter = f.getAttribute('data-filter'); App.refresh(); return; }

      if (e.target.closest('[data-reset]')) { filter = 'all'; query = ''; App.refresh(); return; }

      const sp = e.target.closest('[data-species]');
      if (sp) { App.go('/species/' + sp.getAttribute('data-species')); }
    });
  }

  return { title: title, sub: sub, render: render, mount: mount, speciesCard: speciesCard };
})();


/* ==========================================================================
   Sprout — a species profile (something you may not own yet)
   ========================================================================== */

window.ViewSpecies = (function () {

  function sp(params) {
    return window.PLANT_DATA.filter(function (s) { return s.id === params.id; })[0] || null;
  }

  function guard(params) {
    if (!sp(params)) { App.go('/discover'); return false; }
    return true;
  }

  function title(params) { const s = sp(params); return s ? s.common : 'Plant'; }
  function sub(params)   { const s = sp(params); return s ? s.botanical : ''; }

  function actions() {
    return '<button class="icon-btn" data-act="add" aria-label="Add to greenhouse">' + UI.icon('plus') + '</button>';
  }

  function onAction(act) {
    if (act === 'add') ViewGreenhouse.plantForm(App.route().id, null, null);
  }

  function render(params) {
    const s = sp(params);
    const light = LOOKUPS.LIGHT[s.light.ideal];
    const diff = LOOKUPS.DIFFICULTY[s.difficulty];
    const owned = Store.activePlants().filter(function (p) { return p.speciesId === s.id; });
    const rooms = Schedule.bestRoomsFor(s.id).filter(function (r) { return r.score >= 3; });
    const risk = Schedule.petRisk(s);

    /* --- Header --- */
    const hum = LOOKUPS.HUMIDITY[s.humidity];

    let html = '<div class="hero">' +
      '<div class="hero-img" style="cursor:default">' +
        UI.plantTile(null, s.id, s.common) + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<h2 class="hero-nick">' + UI.esc(s.common) + '</h2>' +
        '<div class="hero-sci">' + UI.esc(s.botanical) + '</div>' +
        ((s.aka || []).length
          ? '<div class="tiny muted" style="margin-top:4px">Also called ' + UI.esc(s.aka.join(', ')) + '</div>'
          : '') +
        '<div class="row-wrap" style="margin-top:9px">' +
          /* One glyph for all three levels — the gauge says "this is a
             difficulty rating"; the colour says which. Same split as the
             propagation pills on a plant page. */
          UI.pill(diff.label, s.difficulty === 'easy' ? '' :
                              s.difficulty === 'hard' ? 'terra' : 'sun', diff.ico) +
          UI.pill(light.short, 'grey', light.ico) +
          (hum ? UI.pill(hum.label, 'grey', hum.ico) : '') +
        '</div>' +
      '</div>' +
    '</div>';

    html += '<div class="row" style="gap:8px;margin-top:12px">' +
      '<button class="btn" data-add="1" style="flex:1">' + UI.icon('plus') +
        (owned.length ? 'Add another' : 'Add to my greenhouse') + '</button>' +
    '</div>';

    if (owned.length) {
      html += '<p class="hint" style="padding:0 2px">' +
        'You already have ' + UI.plural(owned.length, 'of these') + ': ' +
        owned.map(function (p) {
          return '<button class="link-btn tiny" data-plant="' + UI.attr(p.id) + '">' +
            UI.esc(Store.displayName(p)) + '</button>';
        }).join(', ') + '</p>';
    }

    /* --- Pet warning first, since it can be a deal-breaker --- */
    if (risk) {
      html += '<div class="section" style="margin-top:16px">' +
        /* The last hard-coded pink in the app. Toxicity is the one place a
           warmer warning is earned, but it goes through the token so it
           tracks the theme instead of being two hex values from the old
           light-only palette. */
        '<div class="nudge nudge-alert">' +
          '<span class="nudge-ico">' + UI.icon('skull') + '</span><div style="min-width:0">' +
            '<div class="nudge-t">Not safe for your ' + UI.esc(risk.pets.join(' or ')) + '</div>' +
            '<p class="nudge-p" style="margin:0">' + UI.esc(risk.note) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    /* --- Care facts --- */
    const tolerates = (s.light.tolerates || []).map(function (k) { return LOOKUPS.LIGHT[k].short.toLowerCase(); });
    const avoid = (s.light.avoid || []).map(function (k) { return LOOKUPS.LIGHT[k].label.toLowerCase(); });

    /* First element of each row is an icon *name* for UI.icon(). */
    const facts = [
      ['drop', 'Watering', 'Every ' + s.water.warm + ' days in the growing season, every ' + s.water.cool + ' when it slows down',
       s.water.note],
      [light.ico, 'Light', light.label +
        (tolerates.length ? ' — copes with ' + tolerates.join(' and ') : '') +
        (avoid.length ? '. Avoid ' + avoid.join(' and ') : ''), s.light.note],
      ['wheat', 'Feeding', 'Every ' + s.fert.everyDays + ' days at ' + s.fert.strength + ' strength',
       s.fert.type + '. Growing season only — feeding a dormant plant simply builds up salt in the soil.'],
      hum ? [hum.ico, 'Humidity', hum.label, hum.desc] : null,
      ['thermo', 'Temperature', s.idealC[0] + '–' + s.idealC[1] + '°C', 'Never below ' + s.minC + '°C.'],
      ['pot', 'Soil', s.soil, ''],
      ['rotate', 'Repotting', s.repot, ''],
      ['ruler', 'Mature size', s.matureCm >= 100 ? (s.matureCm / 100).toFixed(1).replace('.0', '') + 'm' : s.matureCm + 'cm',
       'A ' + s.growthRate + ' grower.'],
      ['globe', 'Native to', s.origin || 'Unknown', s.family ? 'Family: ' + s.family + '.' : '']
    ].filter(Boolean);

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Care</h2></div>' +
      UI.specSheet(facts) +
    '</div>';

    /* --- Where it would go --- */
    if (rooms.length) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">Where it would be happy</h2>' +
          '<span class="section-note">your rooms</span></div>' +
        '<div class="stack" style="gap:8px">' + rooms.map(function (r) {
          return '<div class="dx-opt" style="margin:0;cursor:default">' +
            UI.roomMark(r.room) +
            '<span style="min-width:0">' +
              '<span class="dx-opt-t">' + UI.esc(r.room.name) + '</span>' +
              '<span class="dx-opt-d">' + (r.score >= 4 ? 'Ideal light for it' : 'It would cope here') +
                (r.room.light ? ' — ' + UI.esc(LOOKUPS.LIGHT[r.room.light].label.toLowerCase()) : '') +
              '</span>' +
            '</span>' +
            '<button class="btn btn-sm btn-soft nowrap" data-add-room="' + UI.attr(r.room.id) + '">Add here</button>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    /* --- Likes / dislikes --- */
    if ((s.likes || []).length || (s.dislikes || []).length) {
      html += '<div class="section"><div class="grid grid-2">' +
        (s.likes.length ? '<div class="card"><div class="eyebrow">Loves</div>' +
          '<ul class="trait-list">' +
          s.likes.map(function (l) { return '<li>' + UI.esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
        (s.dislikes.length ? '<div class="card"><div class="eyebrow">Hates</div>' +
          '<ul class="trait-list">' +
          s.dislikes.map(function (l) { return '<li>' + UI.esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
      '</div></div>';
    }

    /* --- Toxicity in full, regardless of what pets they own --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Toxicity</h2>' +
        '<span class="section-note">ASPCA ratings</span></div>' +
      '<div class="card">' +
        '<div class="row-wrap">' +
          toxPill('paw', 'Cats', s.tox.cats) +
          toxPill('dog', 'Dogs', s.tox.dogs) +
          toxPill('person', 'People', s.tox.humans) +
        '</div>' +
        '<p class="hint">' + UI.esc(s.tox.note) + '</p>' +
      '</div>' +
    '</div>';

    /* --- Propagation --- */
    if ((s.prop || []).length) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">Propagation</h2>' +
          '<span class="section-note">' + UI.plural(s.prop.length, 'method') + '</span></div>' +
        '<div class="stack" style="gap:14px">' + s.prop.map(function (m) {
          return '<div class="card">' +
            '<div style="font-family:var(--serif);font-size:18px">' + UI.esc(m.m) + '</div>' +
            '<div class="row-wrap" style="margin-top:7px">' +
              UI.pill(LOOKUPS.DIFFICULTY[m.diff] ? LOOKUPS.DIFFICULTY[m.diff].label : m.diff,
                      m.diff === 'easy' ? '' : m.diff === 'hard' ? 'terra' : 'sun') +
              UI.pill(m.season, 'grey', 'calendar') +
              UI.pill(m.roots, 'grey', 'clock') +
            '</div>' +
            '<ol class="dx-steps">' + m.steps.map(function (x) {
              return '<li>' + UI.esc(x) + '</li>';
            }).join('') + '</ol>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    /* --- Seeds --- */
    if (s.seed) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">Growing from seed</h2></div>' +
        '<div class="card">' +
          '<div class="row-wrap">' +
            UI.pill('Sow in ' + s.seed.sowSeason, 'grey', 'calendar') +
            UI.pill(s.seed.germDays, 'grey', 'sprout') +
            UI.pill(s.seed.depthMm + 'mm deep', 'grey', 'ruler') +
          '</div>' +
          '<ol class="dx-steps">' + s.seed.steps.map(function (x) {
            return '<li>' + UI.esc(x) + '</li>';
          }).join('') + '</ol>' +
        '</div>' +
      '</div>';
    }

    /* --- Known problems --- */
    if ((s.problems || []).length) {
      html += '<div class="section">' +
        '<div class="section-head"><h2 class="section-title">What tends to go wrong</h2></div>' +
        '<div class="row-wrap">' + s.problems.map(function (id) {
          const d = PROBLEM_DATA.describe(id);
          return d ? UI.pill(d.label, 'grey', d.ico) : '';
        }).join('') + '</div>' +
      '</div>';
    }

    return html;
  }

  function toxPill(ico, label, rating) {
    const t = LOOKUPS.TOX[rating] || LOOKUPS.TOX.safe;
    /* In step with ViewPlant.toxPill by construction now, not by care: the
       variant lives on LOOKUPS.TOX and both views read it. The same rating
       has to wear the same pill on a species page and on your own plant. */
    return UI.pill(label + ': ' + t.label, t.variant, ico);
  }

  function mount(root, params) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-add]')) { ViewGreenhouse.plantForm(params.id, null, null); return; }

      const ar = e.target.closest('[data-add-room]');
      if (ar) { ViewGreenhouse.plantForm(params.id, null, ar.getAttribute('data-add-room')); return; }

      const pl = e.target.closest('[data-plant]');
      if (pl) { App.go('/plant/' + pl.getAttribute('data-plant')); }
    });
  }

  return {
    guard: guard, title: title, sub: sub, actions: actions, onAction: onAction,
    back: true, render: render, mount: mount
  };
})();
