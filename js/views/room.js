/* ==========================================================================
   Sprout — a single room
   --------------------------------------------------------------------------
   A room is a light environment. Tagging it with a window aspect is what
   lets the scheduler reason about every plant standing in it.
   ========================================================================== */

window.ViewRoom = (function () {

  function room(params) { return Store.getRoom(params.id); }

  function guard(params) {
    if (!room(params)) {
      UI.toast('That room no longer exists', 'warn');
      App.go('/greenhouse');
      return false;
    }
    return true;
  }

  function title(params) {
    const r = room(params);
    return r ? r.name : 'Room';
  }

  function sub(params) {
    const r = room(params);
    if (!r) return '';
    const plants = Store.plantsInRoom(r.id).filter(function (p) { return !p.archived; });
    const bits = [UI.plural(plants.length, 'plant')];
    const lt = LOOKUPS.LIGHT[r.light];
    if (lt) bits.push(lt.label.toLowerCase());
    return bits.join(' · ');
  }

  function actions() {
    return '<button class="icon-btn" data-act="edit" aria-label="Edit room">' + UI.icon('edit') + '</button>' +
           '<button class="icon-btn" data-act="add" aria-label="Add a plant">' + UI.icon('plus') + '</button>';
  }

  function onAction(act) {
    const r = room(App.route());
    if (!r) return;
    if (act === 'edit') ViewGreenhouse.roomSheet(r);
    if (act === 'add')  ViewGreenhouse.addPlantSheet(r.id);
  }

  function render(params) {
    const r = room(params);
    const plants = Store.plantsInRoom(r.id).filter(function (p) { return !p.archived; });
    const hemi = Store.hemisphere();
    const prof = r.aspect ? LOOKUPS.aspectProfile(r.aspect, hemi) : null;

    /* --- Environment card --- */

    /* Read through the tables defensively. A room's light/humidity are stored
       as enum keys, but stored data outlives the code that wrote it — an old
       export, a hand-edited localStorage blob or a renamed key would
       otherwise take the whole view down with a null dereference. */
    const lt = LOOKUPS.LIGHT[r.light];
    const hm = LOOKUPS.HUMIDITY[r.humid];

    /* UI.specSheet, not the .facts mosaic these used to build. A room has
       three or four environment facts and every one of them carries a
       paragraph, which is the case the mosaic is worst at: on a phone it
       came out two columns wide, so three facts left a fourth cell empty and
       the grid's hairline fill showed through as a solid grey slab sitting
       in the corner of the card like a rendering fault. */
    const rows = [
      lt ? [lt.ico, 'Light', lt.label, lt.desc] : null,
      prof ? ['compass', 'Aspect',
              (LOOKUPS.ASPECT_NAMES[r.aspect] || r.aspect) + '-facing window', prof.note] : null,
      hm ? [hm.ico, 'Humidity', hm.label, hm.desc] : null,
      r.notes ? ['note', 'Your notes', r.notes, ''] : null
    ].filter(Boolean);
    const facts = rows.length ? UI.specSheet(rows) : '';

    let html = '';

    /* Wrapped in .section purely for its 42px bottom margin. .section only
       spaces below itself, so this opening block — which is not in one —
       had nothing under it and the PLANTS IN HERE rule landed flush against
       the environment card, reading as its caption rather than as the next
       movement of the page. */
    if (facts) {
      html += '<div class="section">' + facts + '</div>';
    } else {
      html += '<div class="section"><div class="nudge">' +
        '<span class="nudge-ico">' + UI.icon('compass') + '</span>' +
        '<div class="grow">' +
          '<div class="nudge-t">Tag this room\'s light</div>' +
          '<p class="nudge-p">Tell me which way the window faces and I\'ll work out the light level — ' +
            'then every schedule in here gets tuned to it.</p>' +
          '<div class="row" style="gap:8px">' +
            '<button class="btn btn-sm" data-edit="1">Set the aspect</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    }

    /* --- Light suitability --- */
    const matches = plants.map(function (p) {
      return { plant: p, match: Schedule.lightMatch(p) };
    });
    const mismatched = matches.filter(function (x) {
      return x.match && (x.match.verdict === 'bad' || x.match.verdict === 'poor');
    });
    /* Every plant has to be rated before the page is allowed to say they are
       all fine. A species with no light data returns null from lightMatch,
       and counting that as agreement would turn missing information into a
       reassurance — the one direction this claim must never fail in. */
    const allRated = plants.length > 0 && matches.every(function (x) { return !!x.match; });

    if (mismatched.length) {
      html += '<div class="section"><div class="stack">' + mismatched.map(function (x) {
        return '<div class="nudge nudge-warn is-link" data-plant="' + UI.attr(x.plant.id) + '">' +
          '<span class="nudge-ico">' + UI.icon(x.match.verdict === 'bad' ? 'ban' : 'cloud') + '</span>' +
          '<div class="grow"><div class="nudge-t">' + UI.esc(Store.displayName(x.plant)) + ' is not well suited here</div>' +
          '<p class="nudge-p mb-0">' + UI.esc(x.match.text) + '</p></div>' +
          UI.icon('chevron', 'muted') +
        '</div>';
      }).join('') + '</div></div>';
    } else if (allRated) {
      /* The good-news half of the same statement, and it belongs here rather
         than on the cards. Tagging every tile RIGHT LIGHT put four identical
         chips down a grid, which is how a mark stops being read at all — and
         the case worth noticing, a plant in the wrong light, is already a
         nudge above with the reason spelled out. So the cards say nothing
         about light and the page says it once, in a sentence. */
      html += '<div class="section"><p class="assure">' + UI.icon('sun') +
        'Every plant in here is in light it likes.</p></div>';
    }

    /* --- Plants --- */
    html += '<div class="section">' +
      '<div class="section-head"><h2 class="section-title">Plants in here</h2>' +
        (plants.length ? '<span class="section-note">' + plants.length + '</span>' : '') +
      '</div>' +
      (plants.length
        /* Not `.map(ViewGreenhouse.plantCard)` — Array.map hands the callback
           (item, index, array), so the second argument would be the index
           rather than the context flag. plantCard tests it with === 'room',
           so the bug would have been silent: every card would simply have
           kept showing the room name it is already standing in. */
        ? '<div class="grid grid-plants">' + plants.map(function (p) {
            return ViewGreenhouse.plantCard(p, 'room');
          }).join('') + '</div>' +
          '<button class="btn btn-soft btn-block" data-add="1" style="margin-top:12px">' +
            UI.icon('plus') + 'Add a plant to ' + UI.esc(r.name) + '</button>'
        : UI.empty('leaf', 'Nothing in here yet',
            'Add a plant, or move one in from another room.',
            '<button class="btn" data-add="1">Add a plant</button>')) +
    '</div>';

    /* --- Suggestions: what would thrive here --- */
    if (lt) {
      const suits = window.PLANT_DATA.filter(function (sp) {
        return sp.light.ideal === r.light;
      }).filter(function (sp) {
        // Do not suggest something they already have in this room.
        return !plants.some(function (p) { return p.speciesId === sp.id; });
      }).slice(0, 6);

      if (suits.length) {
        html += '<div class="section">' +
          '<div class="section-head"><h2 class="section-title">Would thrive here</h2>' +
            '<span class="section-note">' + UI.esc(lt.label) + '</span></div>' +
          '<div class="row-wrap">' + suits.map(function (sp) {
            return '<button class="chip" data-species="' + UI.attr(sp.id) + '">' +
              UI.icon('plus') + UI.esc(sp.common) + '</button>';
          }).join('') + '</div>' +
        '</div>';
      }
    }

    /* --- Danger zone --- */
    html += '<div class="section">' +
      '<button class="btn btn-blood btn-block" data-delete="1">' + UI.icon('trash') + 'Delete this room</button>' +
      '<p class="hint center">The plants inside stay — they just won\'t have a room.</p>' +
    '</div>';

    return html;
  }

  /* The local fact() builder that used to live here is gone; UI.specSheet
     owns this markup now. It was the third hand-written copy of the same
     four lines — plant.js and discover.js had the other two — which is
     three places for the label, the ink and the wrapping to drift apart. */

  function mount(root, params) {
    const r = room(params);

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-edit]')) { ViewGreenhouse.roomSheet(r); return; }
      if (e.target.closest('[data-add]'))  { ViewGreenhouse.addPlantSheet(r.id); return; }

      const sp = e.target.closest('[data-species]');
      if (sp) { ViewGreenhouse.plantForm(sp.getAttribute('data-species'), null, r.id); return; }

      const pl = e.target.closest('[data-plant]');
      if (pl) { App.go('/plant/' + pl.getAttribute('data-plant')); return; }

      if (e.target.closest('[data-delete]')) {
        const count = Store.plantsInRoom(r.id).length;
        UI.confirmSheet('Delete ' + r.name + '?',
          count
            ? 'The ' + UI.plural(count, 'plant') + ' in here will stay in your greenhouse, just without a room.'
            : 'This room has no plants in it.',
          'Delete room',
          function () {
            Store.deleteRoom(r.id);
            UI.toast('Room deleted');
            App.go('/greenhouse');
          }, true);
      }
    });
  }

  return {
    guard: guard, title: title, sub: sub, actions: actions, onAction: onAction,
    back: true, render: render, mount: mount
  };
})();
