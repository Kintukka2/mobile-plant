/* ==========================================================================
   Sprout — Diagnose
   --------------------------------------------------------------------------
   Which plant → what do you notice → what else is true → ranked causes with
   treatment steps.

   The clue step is the important one. "Yellow leaves" on its own is close to
   meaningless; "yellow lower leaves, wet soil, no drainage holes" is a
   diagnosis. Each clue you confirm re-weights the causes live.

   Routes:  /diagnose  ·  /diagnose/:plantId  ·  /diagnose/:plantId/:symptomId
   ========================================================================== */

window.ViewDiagnose = (function () {

  let clues = [];
  let cluesFor = null;

  function guard(params) {
    // Starting a different symptom clears the previous answers.
    if (cluesFor !== params.extra) { clues = []; cluesFor = params.extra; }
    return true;
  }

  function subject(params) {
    if (!params.id || params.id === 'any') return null;
    return Store.getPlant(params.id);
  }

  function title(params) {
    if (!params.id) return 'Diagnose';
    const p = subject(params);
    return p ? Store.displayName(p) : 'Diagnose';
  }

  function sub(params) {
    if (!params.id) return 'Something looking off? Let\'s work it out';
    if (!params.extra) return 'What do you notice?';
    const s = PROBLEM_DATA.SYMPTOMS[params.extra];
    return s ? s.label : '';
  }

  function back(params) { return !!params.id; }

  /* ======================================================================
     Step 1 — which plant
     ====================================================================== */

  function stepPlant() {
    const plants = Store.activePlants();

    let html = '<p class="dim small" style="margin:0 2px 16px;line-height:1.6">' +
      'Pick the plant that is struggling. Sprout weights the likely causes towards the things that species is ' +
      'actually prone to — a fern with crispy edges is a different problem from a cactus with crispy edges.' +
    '</p>';

    if (plants.length) {
      html += '<div class="stack" style="gap:8px">' + plants.map(function (p) {
        const sp = Store.species(p);
        const photo = Store.coverPhoto(p);
        const name = Store.displayName(p);
        /* When a plant has never been given a nickname, displayName falls
           back to the species common name — so a second line carrying the
           common name repeats the first one verbatim, and the picker read
           "Snake Plant / Snake Plant", "Aloe Vera / Aloe Vera". Two of the
           five fixture plants, and it will be most of anyone's list, since
           nicknaming is optional and few people do it for every pot.

           The botanical name is the right thing to show in that case: it
           distinguishes the row rather than echoing it, and it is already
           what the plant and species cards put on their own second line, so
           the page is consistent with the rest of the app rather than
           inventing a third convention. */
        const sci = sp ? name === sp.common : false;
        const second = sp ? (sci ? sp.botanical : sp.common) : 'Unknown species';
        return '<button class="dx-opt" data-dx-plant="' + UI.attr(p.id) + '" style="margin:0">' +
          '<span class="task-thumb" style="width:38px;height:38px">' +
            UI.plantTile(photo, p.id, name) +
          '</span>' +
          '<span style="min-width:0">' +
            '<span class="dx-opt-t">' + UI.esc(name) + '</span>' +
            /* Italic only when the line is actually a binomial. The app sets
               every botanical name in italic — .pcard-sci, .hero-sci, and the
               species picker's own .dx-opt-d.italic — and that is a
               convention worth keeping, because it is the reader's cue that
               the second line is Latin rather than another nickname. Applied
               unconditionally it would lie in the other direction, italicising
               "Snake Plant" under a plant called Gerald. */
            '<span class="dx-opt-d' + (sci ? ' italic' : '') + '">' + UI.esc(second) + '</span>' +
          '</span>' +
          UI.icon('chevron', 'muted') +
        '</button>';
      }).join('') + '</div>';
    } else {
      html += UI.empty('leaf', 'No plants added yet',
        'You can still use the diagnosis tool — it just will not be able to weight the causes towards a ' +
        'particular species.', '<button class="btn btn-ghost" data-open="plant">Add a plant</button>');
    }

    html += '<div class="section">' +
      '<button class="dx-opt" data-dx-plant="any" style="margin:0;width:100%">' +
        '<span class="dx-opt-ico">' + UI.icon('search') + '</span>' +
        '<span style="min-width:0">' +
          '<span class="dx-opt-t">A plant I have not added</span>' +
          '<span class="dx-opt-d">General diagnosis, without species-specific weighting.</span>' +
        '</span>' + UI.icon('chevron', 'muted') +
      '</button>' +
    '</div>';

    return html;
  }

  /* ======================================================================
     Step 2 — which symptom
     ====================================================================== */

  function stepSymptom(params) {
    const p = subject(params);
    const sp = p ? Store.species(p) : null;
    const list = PROBLEM_DATA.symptomsForPlant(sp);
    const prone = list.filter(function (s) { return s.prone; });
    const rest = list.filter(function (s) { return !s.prone; });

    function optionsFor(items) {
      /* No leading glyph. There is no honest 18px monoline mark for "brown
         spots" as against "brown tips only" — any icon here would be
         decoration standing where the distinction ought to be, and fifteen
         of them in a column is a rash. Set in type, the list reads like a
         menu and the descriptions do the discriminating. */
      return items.map(function (s) {
        return '<button class="dx-opt" data-dx-symptom="' + UI.attr(s.id) + '" style="margin:0">' +
          '<span style="min-width:0">' +
            '<span class="dx-opt-t">' + UI.esc(s.label) + '</span>' +
            '<span class="dx-opt-d">' + UI.esc(s.desc) + '</span>' +
          '</span>' +
        '</button>';
      }).join('');
    }

    /* Two examples, not three. A placeholder is the one string in the app
       with no overflow behaviour to fall back on: an input clips it at the
       content edge with no ellipsis and no wrap, so at 390px the third
       example came out as `"sp` — a stray opening quote and two letters,
       which reads as a rendering fault rather than a truncation. Nothing
       warns you either; the overflow probe measures the document against the
       viewport and the field itself is exactly as wide as it should be.
       Keeping these short is the only real defence, so the rule for the app
       is a placeholder that fits the narrowest phone with room to spare. */
    let html = '<div class="field" style="margin-bottom:14px">' +
      '<input class="input input-search" id="dxq" type="search" autocomplete="off" ' +
        'placeholder="Search symptoms — &quot;yellow&quot;, &quot;spots&quot;">' +
    '</div>' +
    '<div id="dx-symptoms">';

    if (prone.length) {
      html += '<div class="section" style="margin-top:0">' +
        '<div class="section-head"><h2 class="section-title">Common in ' +
          UI.esc(sp ? sp.common : 'this plant') + '</h2></div>' +
        '<div class="stack" style="gap:8px">' + optionsFor(prone) + '</div>' +
      '</div>';
    }

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">' +
        (prone.length ? 'Everything else' : 'What do you notice?') + '</h2></div>' +
      '<div class="stack" style="gap:8px">' + optionsFor(rest) + '</div>' +
    '</div></div>';

    /* The no-match state, rendered hidden and revealed by the filter.

       This step had none at all. The search filters by walking the rendered
       buttons and setting display:none on the misses, which knows nothing
       about the headings above them — so a query matching nothing left
       "COMMON IN MONSTERA" and "EVERYTHING ELSE" sitting over a blank page,
       each with its hairline rule, labelling nothing. The same fault as the
       dangling .sheet-ident border: chrome whose only job is to introduce
       something should not outlive the thing it introduces. Worse here,
       because two headings and an empty screen do not read as "no results",
       they read as a view that failed to load its content.

       In the markup rather than built on demand, because the filter is a
       display-toggling pass over existing nodes — it never re-renders, which
       is what lets the field keep focus and the caret while you type. A state
       that has to appear mid-filter therefore has to be there already. */
    html += '<div id="dx-none" hidden>' +
      UI.empty('search', 'Nothing matches that',
        'Try a plainer word — "yellow", "spots", "wilting", "sticky". Or clear the box and read the ' +
        'whole list, which is short enough to browse.',
        '<button class="btn btn-ghost" data-dx-clear="1">Clear search</button>') +
    '</div>';

    return html;
  }

  /* ======================================================================
     Step 3 — clues and results
     ====================================================================== */

  function stepResults(params) {
    const p = subject(params);
    const sp = p ? Store.species(p) : null;
    const symptom = PROBLEM_DATA.SYMPTOMS[params.extra];

    if (!symptom) {
      return UI.empty('info', 'Unknown symptom', 'Let\'s start again.',
        '<button class="btn" data-restart="1">Start over</button>');
    }

    /* --- The clue checklist ---
       Restate what we are investigating in the same identity block the
       sheets use, so the user can see at a glance that they picked the
       right symptom before spending two minutes ticking boxes. */
    let html = '<div class="card" style="margin-bottom:16px">' +
      /* No inline margin override: .sheet-ident:last-child now drops its
         trailing margin, padding and rule on its own, which is the correct
         behaviour wherever the block ends its container rather than only
         here. */
      '<div class="sheet-ident">' +
        '<span class="sheet-ident-mark">' + UI.icon('stethoscope') + '</span>' +
        '<div style="min-width:0">' +
          '<div class="sheet-ident-t">' + UI.esc(symptom.label) + '</div>' +
          '<p class="small dim" style="margin:3px 0 0">' + UI.esc(symptom.desc) + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += '<div class="section" style="margin-top:0">' +
      '<div class="section-head"><h2 class="section-title">What else is true?</h2>' +
        '<span class="section-note">' + (clues.length ? clues.length + ' selected' : 'tick any that apply') + '</span>' +
      '</div>' +
      '<p class="hint" style="padding:0 2px;margin:0 0 10px">Go and have a proper look — push a finger into the ' +
        'soil, turn a leaf over, tip the plant out of its pot if you can. Guessing here will only give you a ' +
        'confident wrong answer.</p>' +
      '<div class="stack" style="gap:8px">' + (symptom.clues || []).map(function (id) {
        const c = PROBLEM_DATA.CLUES[id];
        if (!c) return '';
        const on = clues.indexOf(id) !== -1;
        /* No leading glyph here either — the trailing tick is the state
           that matters on a checklist, and a second mark on the left only
           competed with it. */
        return '<button class="dx-opt' + (on ? ' is-on' : '') + '" data-clue="' + UI.attr(id) + '" style="margin:0">' +
          '<span style="min-width:0">' +
            '<span class="dx-opt-t">' + UI.esc(c.label) + '</span>' +
            '<span class="dx-opt-d">' + UI.esc(c.desc) + '</span>' +
          '</span>' +
          '<span class="dx-opt-chk">' + UI.icon('check') + '</span>' +
        '</button>';
      }).join('') + '</div>' +
    '</div>';

    /* --- Ranked causes --- */
    const proneTo = sp ? (sp.problems || []) : [];
    const ranked = PROBLEM_DATA.diagnose(params.extra, clues, proneTo).slice(0, 4);

    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">' +
        (clues.length ? 'Most likely causes' : 'Possible causes') + '</h2>' +
        /* Short, because .section-head is a single flex row and the note
           takes its width out of the title's. "tick clues to narrow this
           down" is 30 characters of tracked micro-caps — about 190px — and
           at 390px that left too little for the heading, so POSSIBLE CAUSES
           broke across two lines while the note it had made room for sat
           comfortably on one. A section title wrapping under its own
           annotation is the wrong way round.

           The refined state has to be shorter still, because its title grows
           at the same time: MOST LIKELY CAUSES is three words of display
           caps and "refined by your clues" still pushed it onto two lines.
           One word does the work here — the checklist above already says
           how many clues are in play ("2 selected"), so repeating "your
           clues" was telling the reader something they had just done. */
        '<span class="section-note">' + (clues.length ? 'refined' : 'tick a few clues') + '</span>' +
      '</div>';

    if (!ranked.length) {
      html += UI.empty('info', 'Nothing fits',
        'The clues you have ticked rule out every usual cause for this symptom, which is unusual. Try ' +
        'unticking one you were unsure about.');
    } else {
      html += '<div class="stack" style="gap:14px">' + ranked.map(function (r, i) {
        const c = r.cause;
        const sev = c.severity === 'high' ? ' sev-high' : c.severity === 'med' ? ' sev-med' : '';
        /* The cause glyph is worth keeping where the symptom's was not:
           it is drawn from a family (watering / feeding / light / pest /
           fungal), so it tells you the shape of the problem before you
           read the name. */
        return '<div class="card dx-result' + sev + '">' +
          '<div class="row" style="align-items:flex-start;gap:10px">' +
            '<span class="dx-cause-mark">' + UI.icon(c.ico) + '</span>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-family:var(--serif);font-size:18px">' + UI.esc(c.name) + '</div>' +
              /* The confidence readout: the word and the bar it belongs to.
                 .dx-conf is a 2px track with overflow:hidden — it was never
                 a text box — so putting the label inside it hid the label
                 and left an empty hairline sitting among the pills, which
                 looked like a divider that had drifted into the wrong row.
                 Now the word is set in micro-caps beside a short filled
                 track, so the reader gets the language and the relative
                 weight at once: three causes can all say "Possible" while
                 scoring 84, 60 and 56, and the ranking is the entire point
                 of the diagnosis.

                 Its own line, above the pills rather than among them. The
                 two are different kinds of statement — how sure we are
                 against how much it matters — and they do not fit on one
                 line anyway: inside the card the text column is about 256px
                 at 390px, and the meter plus "Worth sorting soon" comes to
                 roughly 260. Letting that wrap put the pill on a second row
                 by accident, with flex row-gap deciding the spacing; two
                 deliberate rows read as a structure instead of an overflow,
                 and behave the same at every width. */
              '<div class="dx-conf-wrap" style="margin-top:6px">' +
                '<span class="dx-conf"><i style="width:' + r.share + '%"></i></span>' +
                '<span class="dx-conf-t">' + UI.esc(r.confidence) + '</span>' +
              '</div>' +
              '<div class="row-wrap" style="margin-top:8px">' +
                (c.severity === 'high' ? UI.pill('Act quickly', 'terra-hi') :
                 c.severity === 'med' ? UI.pill('Worth sorting soon', 'sun') : UI.pill('Not urgent', 'grey')) +
                (proneTo.indexOf(r.id) !== -1 && sp ? UI.pill('Common in ' + sp.common, 'grey') : '') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<p class="small dim" style="margin:12px 0 0;line-height:1.65">' + UI.esc(c.why) + '</p>' +

          (i === 0 || clues.length
            ? '<div class="eyebrow" style="margin-top:14px">What to do</div>' +
              '<ol class="dx-steps">' + c.fix.map(function (s) {
                return '<li>' + UI.esc(s) + '</li>';
              }).join('') + '</ol>' +
              (c.prevent ? '<p class="hint" style="margin-top:2px"><strong>Next time:</strong> ' +
                UI.esc(c.prevent) + '</p>' : '')
            : '<button class="link-btn" data-expand="' + UI.attr(r.id) + '" style="margin-top:12px">' +
              'Show treatment steps</button>') +
        '</div>';
      }).join('') + '</div>';
    }

    html += '</div>';

    /* --- Follow-up actions --- */
    html += '<div class="section"><div class="stack" style="gap:8px">' +
      (p ? '<button class="btn btn-soft" data-log="1">' + UI.icon('note') +
        'Log this in ' + UI.esc(Store.displayName(p)) + '\'s diary</button>' : '') +
      '<button class="btn btn-ghost" data-restart="1">Diagnose something else</button>' +
    '</div></div>';

    return html;
  }

  /* ======================================================================
     Assembly
     ====================================================================== */

  function render(params) {
    if (!params.id) return stepPlant();
    if (!params.extra) return stepSymptom(params);
    return stepResults(params);
  }

  function mount(root, params) {
    /* Symptom search filters the list in place. */
    const q = root.querySelector('#dxq');
    if (q) {
      q.addEventListener('input', function () {
        const needle = q.value.trim().toLowerCase();
        let shown = 0;
        root.querySelectorAll('[data-dx-symptom]').forEach(function (btn) {
          const s = PROBLEM_DATA.SYMPTOMS[btn.getAttribute('data-dx-symptom')];
          const hay = (s.label + ' ' + s.desc).toLowerCase();
          const hit = !needle || hay.indexOf(needle) !== -1;
          btn.style.display = hit ? '' : 'none';
          if (hit) shown++;
        });

        /* A heading goes when its whole list goes. "Common in Monstera" over
           three species-specific symptoms is useful; over nothing it is a
           label for empty space, and searching "spots" would routinely empty
           one of the two groups while filling the other. */
        root.querySelectorAll('#dx-symptoms .section').forEach(function (sec) {
          const any = Array.prototype.some.call(
            sec.querySelectorAll('[data-dx-symptom]'),
            function (b) { return b.style.display !== 'none'; }
          );
          sec.hidden = !any;
        });

        const none = root.querySelector('#dx-none');
        if (none) none.hidden = shown > 0;
      });
    }

    root.addEventListener('click', function (e) {
      /* Empty the box and re-run the filter. Dispatching `input` rather than
         calling the filter directly, so there is exactly one code path that
         decides what is visible — setting .value alone would leave the
         headings hidden and the empty state showing over a full list. */
      if (e.target.closest('[data-dx-clear]')) {
        const box = root.querySelector('#dxq');
        if (box) {
          box.value = '';
          box.dispatchEvent(new Event('input', { bubbles: true }));
          box.focus();
        }
        return;
      }

      const pl = e.target.closest('[data-dx-plant]');
      if (pl) { App.go('/diagnose/' + pl.getAttribute('data-dx-plant')); return; }

      const sy = e.target.closest('[data-dx-symptom]');
      if (sy) {
        clues = [];
        App.go('/diagnose/' + (params.id || 'any') + '/' + sy.getAttribute('data-dx-symptom'));
        return;
      }

      const cl = e.target.closest('[data-clue]');
      if (cl) {
        const id = cl.getAttribute('data-clue');
        const at = clues.indexOf(id);
        if (at === -1) clues.push(id); else clues.splice(at, 1);
        App.refresh();
        return;
      }

      const ex = e.target.closest('[data-expand]');
      if (ex) {
        const c = PROBLEM_DATA.CAUSES[ex.getAttribute('data-expand')];
        if (!c) return;
        UI.openSheet(c.name,
          '<p class="small dim" style="margin:0 0 4px;line-height:1.65">' + UI.esc(c.why) + '</p>' +
          '<div class="eyebrow" style="margin-top:14px">What to do</div>' +
          '<ol class="dx-steps">' + c.fix.map(function (s) {
            return '<li>' + UI.esc(s) + '</li>';
          }).join('') + '</ol>' +
          (c.prevent ? '<p class="hint"><strong>Next time:</strong> ' + UI.esc(c.prevent) + '</p>' : ''));
        return;
      }

      if (e.target.closest('[data-restart]')) { clues = []; App.go('/diagnose'); return; }

      if (e.target.closest('[data-open]')) { ViewGreenhouse.addPlantSheet(null); return; }

      if (e.target.closest('[data-log]')) {
        const p = subject(params);
        if (!p) return;
        const symptom = PROBLEM_DATA.SYMPTOMS[params.extra];
        const ranked = PROBLEM_DATA.diagnose(params.extra, clues, Store.species(p) ? Store.species(p).problems : []);
        const summary = symptom.label +
          (clues.length ? '. Noticed: ' + clues.map(function (c) {
            return PROBLEM_DATA.CLUES[c].label.toLowerCase();
          }).join(', ') : '') +
          (ranked.length ? '. Sprout suggests: ' + ranked[0].cause.name + ' (' +
            ranked[0].confidence.toLowerCase() + ').' : '');

        Store.addLog({ plantId: p.id, kind: 'problem', date: UI.toISO(UI.today()), text: summary });
        UI.toast('Saved to the diary', 'leaf');
        /* Land on the diary, which is where the thing we just wrote is. The
           plant view opens on Care by default, so this used to promise "saved
           to the diary" and then show the watering schedule — leaving the
           reader to find the entry themselves, or to wonder whether it had
           really been saved at all. */
        ViewPlant.showTab(p.id, 'diary');
        App.go('/plant/' + p.id);
      }
    });
  }

  return {
    guard: guard, title: title, sub: sub, back: back, render: render, mount: mount
  };
})();
