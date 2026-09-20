/* ==========================================================================
   Sprout — My Greenhouse
   --------------------------------------------------------------------------
   The management portal: rooms hold plants, rooms carry light and aspect
   tags, and every plant shows how close it is to needing a drink.

   This file also owns the shared plant/room components and the add & edit
   sheets, because the room, plant and discover views all need them.
   ========================================================================== */

window.ViewGreenhouse = (function () {

  let tab = 'rooms';   // 'rooms' | 'plants'

  /* ======================================================================
     Shared components
     ====================================================================== */

  /* The little water countdown that sits on a plant's photo. */
  function dropBadge(plant) {
    const w = Schedule.waterDue(plant);
    let cls, text;
    /* Spelt out, because the chip is uppercase. The labels used to be "1d",
       "14d" and "3d late", which text-transform rendered as "1D", "14D" and
       "3D LATE" — a lowercase unit is not a thing you can have in small
       caps, and "14D" reads as a part number rather than a fortnight. Every
       branch also names watering now: a coloured bead and a bare number
       leaves the reader to infer the subject, and on a card that already
       carries a name, a botanical name and a room there is no reason to make
       them. "WATER IN 14 DAYS" is about 105px at 9.5px with 0.14em tracking,
       so it still clears the narrowest card in the grid. */
    if (w.never)           { cls = 'drop-now';  text = 'Water now'; }
    else if (w.days < 0)   { cls = 'drop-over'; text = 'Late by ' + UI.plural(Math.abs(w.days), 'day'); }
    else if (w.days === 0) { cls = 'drop-now';  text = 'Water today'; }
    else if (w.days <= 2)  { cls = 'drop-due';  text = 'Water in ' + UI.plural(w.days, 'day'); }
    else                   { cls = 'drop-ok';   text = 'Water in ' + UI.plural(w.days, 'day'); }
    /* A chip that *contains* a bead, rather than a bead with a label stuffed
       inside it. This used to return `<span class="drop ...">` wrapping an
       icon and the text, and .drop is an 8px round bead — width 8, height 8,
       border-radius 99px. So a card's water status was a glyph and a word
       crammed into an 8px circle inside a container with overflow hidden,
       which is to say it was nothing at all.

       It was invisible for a second, independent reason, and that is the one
       that made it hard to spot: .pcard-img centres its grid items, and the
       plant tile beside this badge is `position: absolute; inset: 0`. A
       positioned element paints above in-flow content, so even at a sane
       size the badge sat underneath an opaque plate. Two faults, one
       symptom — and the card looked perfectly clean. It had simply stopped
       telling you which plants were thirsty, which is most of what the
       Greenhouse grid is for.

       Now a positioned chip in the corner of the plate, with the bead doing
       the one job .drop was written to do. */
    return '<span class="pcard-drop">' +
             '<span class="drop ' + cls + '"></span>' + UI.esc(text) +
           '</span>';
  }

  function plantThumb(plant) {
    return UI.plantTile(Store.coverPhoto(plant), plant.id, Store.displayName(plant));
  }

  /* `context` is 'room' when the card is rendered inside a single room, and
     falsy anywhere the grid mixes rooms.

     The footer names the room the plant stands in — the one fact the card
     cannot otherwise carry, and the reason the footer exists. Inside a room
     that becomes the room you are already looking at: the Living Room page
     printed a LIVING ROOM chip on all four of its cards, four identical
     labels answering the question the page title had already answered, in
     the only slot on the card that could have told you something. So in that
     context the footer is dropped outright.

     It briefly carried the light-match verdict there instead, which was the
     same mistake in different words. In a room set up properly every tile
     reads RIGHT LIGHT, and a mark printed on every tile is a mark nobody
     reads — including on the one tile where it differs, which is the only
     case it was ever for. Room.js now states it once in prose, and a genuine
     mismatch gets a nudge with the reason spelled out, so the cards are
     free to say nothing about light at all.

     Strict === 'room' rather than a truthy test, because Array.map hands its
     callback (item, index, array): the two `.map(plantCard)` sites in this
     file pass the index as `context`. Under a loose test, card 0 would be
     the only one in the whole greenhouse missing its room name. */
  function plantCard(plant, context) {
    const sp = Store.species(plant);
    const room = plant.roomId ? Store.getRoom(plant.roomId) : null;

    const foot = context === 'room' ? '' : (room
      ? '<span class="pill pill-grey">' + UI.monogram(room.name, 'mono-sm') +
          UI.esc(room.name) + '</span>'
      : UI.pill('No room', 'grey'));

    return '<button class="pcard" data-plant="' + UI.attr(plant.id) + '">' +
      '<div class="pcard-img">' + plantThumb(plant) + dropBadge(plant) + '</div>' +
      '<div class="pcard-body">' +
        '<div class="pcard-name">' + UI.esc(Store.displayName(plant)) + '</div>' +
        '<div class="pcard-sci">' + UI.esc(sp ? sp.botanical : 'Unknown species') + '</div>' +
        (foot ? '<div class="pcard-foot">' + foot + '</div>' : '') +
      '</div>' +
    '</button>';
  }

  function roomCard(room) {
    const plants = Store.plantsInRoom(room.id).filter(function (p) { return !p.archived; });
    const light = LOOKUPS.LIGHT[room.light] || null;
    const bits = [UI.plural(plants.length, 'plant')];
    if (light) bits.push(light.label);

    const dots = plants.slice(0, 6).map(function (p) {
      return '<span class="rcard-dot" title="' + UI.attr(Store.displayName(p)) + '">' +
        UI.plantTile(Store.coverPhoto(p), p.id, Store.displayName(p)) + '</span>';
    }).join('');

    return '<button class="rcard" data-room="' + UI.attr(room.id) + '">' +
      '<div class="rcard-top">' +
        UI.monogram(room.name) +
        '<div style="min-width:0">' +
          '<div class="rcard-name">' + UI.esc(room.name) + '</div>' +
          '<div class="rcard-sub">' + UI.esc(bits.join(' · ')) + '</div>' +
        '</div>' +
      '</div>' +
      (plants.length
        ? '<div class="rcard-strip">' + dots +
          (plants.length > 6 ? '<span class="rcard-more">+' + (plants.length - 6) + '</span>' : '') +
          '</div>'
        : '<div class="rcard-strip"><span class="rcard-more">Empty — tap to add a plant</span></div>') +
    '</button>';
  }

  /* ======================================================================
     Add / edit sheets
     ====================================================================== */

  /* Step 1 of adding a plant: which species? */
  function speciesPicker(onPick, heading) {
    /* The count comes from the dataset rather than being typed in: "48" was
       hardcoded here, and a number promising the size of the catalogue is
       exactly the kind of string that goes quietly wrong the first time a
       species is added. Shortened too — see the note in diagnose.js; a
       placeholder has no ellipsis and no wrap, so it is clipped mid-word at
       the field edge and there is no instrument that catches it. */
    const body =
      '<div class="field"><input class="input input-search" id="sp-q" type="search" ' +
        'placeholder="Search ' + window.PLANT_DATA.length +
          ' plants — &quot;monstera&quot;, &quot;fern&quot;" autocomplete="off"></div>' +
      '<div id="sp-list" class="stack" style="gap:6px;max-height:52vh;overflow-y:auto"></div>';

    UI.openSheet(heading || 'Which plant is it?', body, function (root) {
      const input = root.querySelector('#sp-q');
      const list  = root.querySelector('#sp-list');

      function draw(q) {
        const results = searchSpecies(q).slice(0, 40);
        if (!results.length) {
          list.innerHTML = '<p class="muted small center" style="padding:18px 0">' +
            'No match. Try a common name, or add the closest relative — the care will be near enough.</p>';
          return;
        }
        list.innerHTML = results.map(function (sp) {
          return '<button class="dx-opt" data-species="' + UI.attr(sp.id) + '" style="margin-bottom:0">' +
            '<span class="dx-opt-ico">' + UI.icon('leaf') + '</span>' +
            '<span style="min-width:0">' +
              '<span class="dx-opt-t">' + UI.esc(sp.common) + '</span>' +
              '<span class="dx-opt-d italic">' + UI.esc(sp.botanical) + '</span>' +
            '</span>' +
          '</button>';
        }).join('');
      }

      draw('');
      input.addEventListener('input', function () { draw(input.value); });
      list.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-species]');
        if (!btn) return;
        onPick(btn.getAttribute('data-species'));
      });
    });
  }

  /* Fuzzy-ish species search across common, botanical and alias names. */
  function searchSpecies(q) {
    const needle = String(q || '').trim().toLowerCase();
    if (!needle) return window.PLANT_DATA.slice();
    return window.PLANT_DATA.filter(function (sp) {
      const hay = [sp.common, sp.botanical, sp.family]
        .concat(sp.aka || [], sp.tags || []).join(' ').toLowerCase();
      return hay.indexOf(needle) !== -1;
    });
  }

  /* Step 2: the details. Also used for editing, when `plant` is supplied. */
  function plantForm(speciesId, plant, presetRoomId) {
    const sp = window.PLANT_DATA.filter(function (s) { return s.id === speciesId; })[0];
    if (!sp) { UI.toast('Unknown plant', 'warn'); return; }

    const editing = !!plant;
    const rooms = Schedule.bestRoomsFor(speciesId);
    const chosenRoom = editing ? plant.roomId : (presetRoomId || (rooms.length ? rooms[0].room.id : null));
    const risk = Schedule.petRisk(sp);

    const roomOpts = '<option value="">Not in a room yet</option>' +
      rooms.map(function (r) {
        const suits = r.score >= 4 ? ' — ideal light' : r.score === 3 ? ' — will cope' : r.score === 0 ? ' — poor light' : '';
        return '<option value="' + UI.attr(r.room.id) + '"' + (r.room.id === chosenRoom ? ' selected' : '') + '>' +
          UI.esc(r.room.name + suits) + '</option>';
      }).join('');

    /* The note belongs to the chosen material, so it is looked up rather
       than written out — LOOKUPS already carries one per material, and the
       form had been quoting terracotta's regardless of the answer. */
    function potNote(key) {
      const m = LOOKUPS.POT_MATERIALS[key];
      return m ? m.note : '';
    }

    const matOpts = Object.keys(LOOKUPS.POT_MATERIALS).map(function (k) {
      const sel = (editing ? plant.potMaterial : 'plastic') === k ? ' selected' : '';
      return '<option value="' + k + '"' + sel + '>' + UI.esc(LOOKUPS.POT_MATERIALS[k].label) + '</option>';
    }).join('');

    const body =
      '<div class="sheet-ident">' +
        '<span class="sheet-ident-mark">' + UI.icon('leaf') + '</span>' +
        '<div style="min-width:0">' +
          '<div class="sheet-ident-t">' + UI.esc(sp.common) + '</div>' +
          '<div class="tiny muted italic">' + UI.esc(sp.botanical) + '</div>' +
        '</div>' +
      '</div>' +

      (risk && !editing
        ? '<div class="nudge nudge-warn mb-3">' +
            '<span class="nudge-ico">' + UI.icon('paw') + '</span><div style="min-width:0">' +
            '<div class="nudge-t">Not safe for your ' + UI.esc(risk.pets.join(' or ')) + '</div>' +
            '<p class="nudge-p mb-0">' + UI.esc(risk.note) + '</p></div></div>'
        : '') +

      '<label class="field"><span class="label">Give it a nickname?</span>' +
        '<input class="input" id="f-nick" maxlength="40" placeholder="' + UI.attr(sp.common) + '" ' +
        'value="' + UI.attr(editing ? plant.nickname : '') + '">' +
        '<p class="hint">Named plants get looked after. No judgement from me.</p>' +
      '</label>' +

      '<label class="field"><span class="label">Which room will it live in?</span>' +
        '<select class="select" id="f-room">' + roomOpts + '</select>' +
        (rooms.length ? '' : '<p class="hint">You have no rooms yet — you can add one later and move it in.</p>') +
      '</label>' +

      /* Open when editing, shut when adding. Editing means these values are
         already someone's answers and hiding them would be hiding the point
         of the screen; adding means they are defaults nobody has looked at
         yet, and a 15cm plastic pot with holes is right often enough to be
         worth one line rather than three fields. */
      '<details class="disclosure"' + (editing ? ' open' : '') + '>' +
        '<summary>Do you have a pot ready for this?' +
          '<span class="disclosure-chev">' + UI.icon('chevron') + '</span>' +
        '</summary>' +
        '<div class="disclosure-body">' +
          '<div class="pot-row">' +
            '<label class="field"><span class="label">Width (cm)</span>' +
              '<input class="input" id="f-pot" type="number" min="5" max="120" step="1" ' +
              'value="' + (editing ? plant.potCm : 15) + '">' +
            '</label>' +
            '<label class="field"><span class="label">Material</span>' +
              '<select class="select" id="f-mat">' + matOpts + '</select>' +
            '</label>' +
            '<label class="field"><span class="label">Drainage</span>' +
              '<select class="select" id="f-drain">' +
                '<option value="good"' + ((editing ? plant.drainage : 'good') === 'good' ? ' selected' : '') + '>Holes</option>' +
                '<option value="none"' + ((editing ? plant.drainage : '') === 'none' ? ' selected' : '') + '>No holes</option>' +
              '</select>' +
            '</label>' +
          '</div>' +
          /* One hint for the row, and it reads the material that is actually
             selected. It used to say "Terracotta dries faster" under a
             select showing Plastic — a true sentence about a pot nobody had
             chosen, which is a hint about the menu rather than the answer.
             Measure across the top is the only part that holds whatever is
             picked, so it leads. */
          '<p class="hint" id="f-pot-note" style="margin-top:12px">Measure across the top. ' +
            UI.esc(potNote(editing ? plant.potMaterial : 'plastic')) + '</p>' +
        '</div>' +
      '</details>' +

      /* Acquired first: it is the fixed fact about the plant, and the date
         it was last watered is read against it. */
      '<div class="date-row">' +
        '<label class="field"><span class="label">' +
          (editing ? 'Acquired' : 'When did you get it?') + '</span>' +
          '<input class="input" id="f-acq" type="date" max="' + UI.toISO(UI.today()) + '" ' +
          'value="' + UI.attr(editing ? plant.acquired : UI.toISO(UI.today())) + '">' +
        '</label>' +
        '<label class="field"><span class="label">Last watered</span>' +
          '<input class="input" id="f-watered" type="date" max="' + UI.toISO(UI.today()) + '" ' +
          'value="' + UI.attr(editing ? (plant.lastWatered || '') : UI.toISO(UI.today())) + '">' +
        '</label>' +
      '</div>' +
      '<p class="hint" style="margin-top:8px">Not sure? Let\'s get started now.</p>' +

      '<div class="row" style="gap:8px;margin-top:20px">' +
        '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>' +
        '<button class="btn" id="f-save" style="flex:2">' +
          (editing ? 'Save changes' : 'Add to my greenhouse') + '</button>' +
      '</div>';

    UI.openSheet(editing ? 'Edit ' + Store.displayName(plant) : 'Add ' + sp.common, body, function (root) {
      const matEl = root.querySelector('#f-mat');
      const potNoteEl = root.querySelector('#f-pot-note');
      matEl.addEventListener('change', function () {
        potNoteEl.textContent = 'Measure across the top. ' + potNote(matEl.value);
      });

      root.querySelector('#f-save').addEventListener('click', function () {
        const data = {
          speciesId: speciesId,
          nickname: root.querySelector('#f-nick').value.trim(),
          roomId: root.querySelector('#f-room').value || null,
          potCm: Math.max(5, Math.min(120, Number(root.querySelector('#f-pot').value) || 15)),
          potMaterial: root.querySelector('#f-mat').value,
          drainage: root.querySelector('#f-drain').value,
          lastWatered: root.querySelector('#f-watered').value || null,
          acquired: root.querySelector('#f-acq').value || UI.toISO(UI.today())
        };

        if (editing) {
          Store.updatePlant(plant.id, data);
          UI.closeSheet();
          UI.toast('Saved', 'leaf');
          App.refresh();
        } else {
          const created = Store.addPlant(data);
          UI.closeSheet();
          UI.toast(Store.displayName(created) + ' is in your greenhouse', 'leaf');
          App.go('/plant/' + created.id);
        }
      });
    });
  }

  /* Add a plant: pick a species, then fill in the details. */
  function addPlantSheet(roomId) {
    speciesPicker(function (speciesId) {
      plantForm(speciesId, null, roomId);
    });
  }

  /* ---------- Room form ---------- */

  function roomSheet(room) {
    const editing = !!room;
    const hemi = Store.hemisphere();

    const presetChips = LOOKUPS.ROOM_PRESETS.map(function (p) {
      return '<button type="button" class="chip" data-preset="' + UI.attr(p.name) + '">' +
        UI.monogram(p.name, 'mono-sm') + UI.esc(p.name) + '</button>';
    }).join('');

    /* The '— bright' half of each option is a claim, and the claim inverts
       across the equator. Until we know which side the reader is on, the
       option says only which way the window faces, which is a fact they can
       check themselves. The suffix returns the moment the hemisphere is
       settled — by a saved location, or by the two chips below the field.

       Hiding the suffix while auto-filling the light level from the same
       untrusted table would be worse than leaving the suffix on: the claim
       would still be made, just somewhere the reader cannot see it. So the
       autofill is gated on the same flag. */
    let hemiConfirmed = !Store.hemisphereIsGuess();

    /* 'No window' sits at the top, next to 'Not sure', because it is the
       other answer that is not a compass point — a windowless bathroom is a
       real room with real plants in it, and the list previously had no way
       to say so. It needs no hemisphere: a cupboard faces nowhere on either
       side of the equator, so it keeps its suffix and its autofill
       throughout. The compass options then follow in order. */
    function aspectOptionText(a) {
      const name = LOOKUPS.ASPECT_NAMES[a] + '-facing';
      if (!hemiConfirmed) return name;
      const prof = LOOKUPS.aspectProfile(a, Store.hemisphere());
      return name + ' — ' + LOOKUPS.LIGHT[prof.light].short.toLowerCase();
    }

    const aspectOpts = '<option value="">Not sure</option>' +
      '<option value="NONE"' + (editing && room.aspect === 'NONE' ? ' selected' : '') + '>' +
        'No window — no natural light</option>' +
      LOOKUPS.ASPECTS.map(function (a) {
        return '<option value="' + a + '"' + (editing && room.aspect === a ? ' selected' : '') + '>' +
          UI.esc(aspectOptionText(a)) +
        '</option>';
      }).join('');

    const lightOpts = '<option value="">Not sure yet</option>' +
      Object.keys(LOOKUPS.LIGHT).map(function (k) {
        return '<option value="' + k + '"' + (editing && room.light === k ? ' selected' : '') + '>' +
          UI.esc(LOOKUPS.LIGHT[k].label) + '</option>';
      }).join('');

    /* Which way is the bright way is the single fact this question turns on,
       and it is the opposite fact either side of the equator. Once settled,
       say which way we are reading it, so the reader can check us. */
    function settledHint() {
      return Store.hemisphere() === 'south'
        ? 'I\'m reading these for the southern hemisphere, so north-facing is your bright side.'
        : 'I\'m reading these for the northern hemisphere, so south-facing is your bright side.';
    }

    /* Unsettled, the honest thing is to ask rather than to guess and caveat.
       It is one tap, it is asked where it matters rather than two screens
       away in Profile, and it is answered once for good — so this block is
       gone by the second room. The time-zone guess is named but deliberately
       not pre-selected: a preselected chip is a confirmation the reader did
       not give. */
    const hemiAsk =
      '<div id="r-hemi-ask" style="margin-top:10px">' +
        '<p class="hint" style="margin-bottom:8px">Before I can read these windows I need to know which ' +
          'side of the equator you\'re on — it decides which way your bright windows face.</p>' +
        '<div class="row-wrap">' +
          '<button type="button" class="chip" data-room-hemi="north">Northern</button>' +
          '<button type="button" class="chip" data-room-hemi="south">Southern</button>' +
        '</div>' +
        '<p class="hint" style="margin-top:8px">Your device\'s time zone suggests ' +
          (hemi === 'south' ? 'southern' : 'northern') + '. You can change it later in Profile.</p>' +
      '</div>';

    const humidOpts = ['', 'low', 'medium', 'high'].map(function (k) {
      const labels = { '': 'Average', low: 'Dry (heated, airy)', medium: 'Average', high: 'Humid (bathroom, kitchen)' };
      if (k === '') return '<option value="">Not sure</option>';
      return '<option value="' + k + '"' + (editing && room.humid === k ? ' selected' : '') + '>' +
        UI.esc(labels[k]) + '</option>';
    }).join('');

    const body =
      (editing ? '' :
        '<div class="field"><span class="label">Quick start</span>' +
          '<div class="row-wrap">' + presetChips + '</div></div>') +

      '<label class="field"><span class="label">Room name</span>' +
        '<input class="input" id="r-name" maxlength="40" placeholder="Living Room" ' +
        'value="' + UI.attr(editing ? room.name : '') + '"></label>' +

      /* A div, not a label. The hemisphere chips live inside this field, and
         a label wrapping them would hand every chip tap to the select as
         well. `for` keeps the caption tied to the control without it. */
      '<div class="field"><label class="label" for="r-aspect">Which way does the window face?</label>' +
        '<select class="select" id="r-aspect">' + aspectOpts + '</select>' +
        '<p class="hint" id="r-aspect-note">' +
          UI.esc(hemiConfirmed
            ? 'Tell me this and I\'ll work out the light level. ' + settledHint()
            : 'Tell me this and I\'ll work out the light level.') + '</p>' +
        (hemiConfirmed ? '' : hemiAsk) +
      '</div>' +

      '<label class="field"><span class="label">Light level</span>' +
        '<select class="select" id="r-light">' + lightOpts + '</select>' +
        '<p class="hint" id="r-light-note"></p>' +
      '</label>' +

      '<label class="field"><span class="label">Humidity</span>' +
        '<select class="select" id="r-humid">' + humidOpts + '</select>' +
      '</label>' +

      '<label class="field"><span class="label">Notes (optional)</span>' +
        '<textarea class="textarea" id="r-notes" maxlength="400" ' +
        'placeholder="Radiator under the window, gets a draught when the back door opens…">' +
        UI.esc(editing ? room.notes : '') + '</textarea></label>' +

      '<div class="row" style="gap:8px;margin-top:6px">' +
        '<button class="btn btn-ghost" data-act="sheet-cancel" style="flex:1">Cancel</button>' +
        '<button class="btn" id="r-save" style="flex:2">' + (editing ? 'Save room' : 'Create room') + '</button>' +
      '</div>';

    UI.openSheet(editing ? 'Edit ' + room.name : 'Add a room', body, function (root) {
      const nameEl   = root.querySelector('#r-name');
      const aspectEl = root.querySelector('#r-aspect');
      const lightEl  = root.querySelector('#r-light');
      const lightNote = root.querySelector('#r-light-note');

      /* The empty-state line is a promise, so it has to track whether the
         promise can be kept: with the hemisphere unsettled, picking an
         aspect deliberately fills nothing in. */
      function describeLight() {
        const v = lightEl.value;
        if (v) { lightNote.textContent = LOOKUPS.LIGHT[v].desc; return; }
        lightNote.textContent = hemiConfirmed
          ? 'Pick a window aspect above and I\'ll fill this in.'
          : 'Answer the equator question above and I\'ll fill this in from the window — or just set it yourself.';
      }
      describeLight();

      root.querySelectorAll('[data-preset]').forEach(function (b) {
        b.addEventListener('click', function () {
          nameEl.value = b.getAttribute('data-preset');
          root.querySelectorAll('[data-preset]').forEach(function (o) { o.classList.remove('is-on'); });
          b.classList.add('is-on');
        });
      });

      const aspectNote = root.querySelector('#r-aspect-note');

      /* Fill the light level from the aspect — but only from a hemisphere we
         actually have, and always for 'No window', which needs none. */
      function applyAspect() {
        const v = aspectEl.value;
        if (!v) return;
        if (v !== 'NONE' && !hemiConfirmed) return;
        const prof = LOOKUPS.aspectProfile(v, Store.hemisphere());
        if (!prof) return;
        lightEl.value = prof.light;
        describeLight();
        aspectNote.textContent = prof.note;
      }

      aspectEl.addEventListener('change', applyAspect);

      /* Answering here writes it to the profile for good, then brings the
         field to life in place: the options grow their light suffix and the
         current pick fills the level. Rebuilding the page would have been
         simpler and would have closed the sheet out from under the reader
         mid-form. */
      const hemiAskEl = root.querySelector('#r-hemi-ask');
      if (hemiAskEl) {
        hemiAskEl.querySelectorAll('[data-room-hemi]').forEach(function (b) {
          b.addEventListener('click', function () {
            Store.updateProfile({ hemisphere: b.getAttribute('data-room-hemi') });
            hemiConfirmed = true;
            hemiAskEl.remove();
            LOOKUPS.ASPECTS.forEach(function (a) {
              const opt = aspectEl.querySelector('option[value="' + a + '"]');
              if (opt) opt.textContent = aspectOptionText(a);
            });
            aspectNote.textContent = 'Tell me this and I\'ll work out the light level. ' + settledHint();
            /* Before applyAspect, which returns early when no aspect is
               picked yet — and would leave the light hint still telling the
               reader to answer a question that is no longer on screen. */
            describeLight();
            applyAspect();
          });
        });
      }

      lightEl.addEventListener('change', describeLight);

      root.querySelector('#r-save').addEventListener('click', function () {
        const name = nameEl.value.trim();
        if (!name) { UI.toast('Give the room a name first', 'warn'); nameEl.focus(); return; }
        const data = {
          name: name,
          light: lightEl.value || null,
          aspect: aspectEl.value || null,
          humid: root.querySelector('#r-humid').value || null,
          notes: root.querySelector('#r-notes').value.trim()
        };
        if (editing) {
          Store.updateRoom(room.id, data);
          UI.closeSheet();
          UI.toast('Room updated', 'leaf');
          App.refresh();
        } else {
          const created = Store.addRoom(data);
          UI.closeSheet();
          UI.toast(created.name + ' added', 'leaf');
          App.go('/room/' + created.id);
        }
      });
    });
  }

  /* The "+" menu. */
  function addMenu() {
    UI.openSheet('Add to your greenhouse',
      '<div class="stack" style="gap:8px">' +
        '<button class="dx-opt" data-add="plant" style="margin:0">' +
          '<span class="dx-opt-ico">' + UI.icon('leaf') + '</span><span>' +
            '<span class="dx-opt-t">A plant</span>' +
            '<span class="dx-opt-d">Pick the species and I\'ll build its care schedule.</span>' +
          '</span></button>' +
        '<button class="dx-opt" data-add="room" style="margin:0">' +
          '<span class="dx-opt-ico">' + UI.icon('home') + '</span><span>' +
            '<span class="dx-opt-t">A room</span>' +
            '<span class="dx-opt-d">Tag it with its window aspect and I\'ll work out the light.</span>' +
          '</span></button>' +
      '</div>',
      function (root) {
        root.addEventListener('click', function (e) {
          const b = e.target.closest('[data-add]');
          if (!b) return;
          const kind = b.getAttribute('data-add');
          UI.closeSheet();
          setTimeout(function () { kind === 'plant' ? addPlantSheet(null) : roomSheet(null); }, 220);
        });
      });
  }

  /* ======================================================================
     The view
     ====================================================================== */

  function title() { return 'My Greenhouse'; }

  function sub() {
    const s = Schedule.summary();
    if (!s.plantCount) return 'Nothing growing here yet';
    return UI.plural(s.plantCount, 'plant') +
      (s.roomCount ? ' across ' + UI.plural(s.roomCount, 'room') : '');
  }

  function actions() {
    return '<button class="icon-btn" data-act="add" aria-label="Add">' + UI.icon('plus') + '</button>';
  }

  function onAction(act) { if (act === 'add') addMenu(); }

  function render() {
    const rooms = Store.get().rooms;
    const plants = Store.activePlants();

    if (!rooms.length && !plants.length) {
      /* "Room to grow", not "Your greenhouse is empty".

         The topbar subtitle on this view already reads "Nothing growing here
         yet" when the count is zero, so the old heading stated the same fact
         a second time eight words later — and it was the longer of the two,
         which meant it also wrapped: "YOUR GREENHOUSE IS / EMPTY" left one
         short word alone on a second line of display caps, directly beneath
         the widest line on the screen. A widow is poor typography anywhere,
         and especially in tracked capitals, where the eye takes in the shape
         of the block before it reads any of the words.

         Since the subtitle has the condition covered, the heading is free to
         do the more useful job of inviting rather than reporting. This one
         also quietly names the organising idea of the view — rooms — which
         the body copy immediately goes on to explain. */
      return UI.empty('leaf', 'Room to grow',
        'Let\'s start with a room — a windowsill counts. Or jump straight in and add your first plant.',
        '<div class="row" style="gap:8px;justify-content:center">' +
          '<button class="btn btn-ghost" data-open="room">Add a room</button>' +
          '<button class="btn" data-open="plant">Add a plant</button>' +
        '</div>');
    }

    let html =
      '<div class="tabs">' +
        '<button class="tab-btn' + (tab === 'rooms' ? ' is-on' : '') + '" data-tab="rooms">Rooms</button>' +
        '<button class="tab-btn' + (tab === 'plants' ? ' is-on' : '') + '" data-tab="plants">' +
          'All plants' + (plants.length ? ' (' + plants.length + ')' : '') + '</button>' +
      '</div>';

    if (tab === 'rooms') {
      const unassigned = plants.filter(function (p) { return !p.roomId; });

      html += rooms.length
        ? '<div class="grid grid-rooms">' + rooms.map(roomCard).join('') + '</div>' +
          '<button class="btn btn-soft btn-block" data-open="room" style="margin-top:12px">' +
            UI.icon('plus') + 'Add another room</button>'
        : UI.empty('home', 'No rooms yet',
            'Rooms are how I work out light levels. Tag one with its window aspect and every plant in it gets a schedule tuned to that spot.',
            '<button class="btn" data-open="room">Add your first room</button>');

      if (unassigned.length) {
        html += '<div class="section">' +
          '<div class="section-head"><h2 class="section-title">Not in a room yet</h2>' +
          '<span class="section-note">' + UI.plural(unassigned.length, 'plant') + '</span></div>' +
          '<div class="grid grid-plants">' + unassigned.map(plantCard).join('') + '</div>' +
          '<p class="hint" style="padding:0 2px">Put these in a room and I can factor the light into their watering.</p>' +
        '</div>';
      }
    } else {
      html += plants.length
        ? '<div class="grid grid-plants">' +
            plants.slice().sort(function (a, b) {
              return Schedule.waterDue(a).days - Schedule.waterDue(b).days;
            }).map(plantCard).join('') +
          '</div>' +
          '<button class="btn btn-soft btn-block" data-open="plant" style="margin-top:12px">' +
            UI.icon('plus') + 'Add a plant</button>'
        : UI.empty('leaf', 'No plants yet', 'Add your first and I\'ll build its care schedule from real species data.',
            '<button class="btn" data-open="plant">Add a plant</button>');
    }

    return html;
  }

  function mount(root) {
    root.addEventListener('click', function (e) {
      const t = e.target.closest('[data-tab]');
      /* As on the plant view: refresh() keeps the scroll, so the Rooms/All
         plants switcher is pulled back into view when the tab switched to is
         the shorter of the two. */
      if (t) {
        tab = t.getAttribute('data-tab');
        App.refresh();
        UI.keepTabsInView(document.getElementById('view'));
        return;
      }

      const open = e.target.closest('[data-open]');
      if (open) {
        open.getAttribute('data-open') === 'room' ? roomSheet(null) : addPlantSheet(null);
        return;
      }

      const rc = e.target.closest('[data-room]');
      if (rc) { App.go('/room/' + rc.getAttribute('data-room')); return; }

      const pc = e.target.closest('[data-plant]');
      if (pc) { App.go('/plant/' + pc.getAttribute('data-plant')); }
    });
  }

  return {
    title: title, sub: sub, actions: actions, onAction: onAction,
    render: render, mount: mount,
    /* shared */
    plantCard: plantCard, roomCard: roomCard, dropBadge: dropBadge, plantThumb: plantThumb,
    addPlantSheet: addPlantSheet, plantForm: plantForm, speciesPicker: speciesPicker,
    searchSpecies: searchSpecies, roomSheet: roomSheet, addMenu: addMenu
  };
})();
