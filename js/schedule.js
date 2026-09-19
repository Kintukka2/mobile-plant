/* ==========================================================================
   Sprout — care scheduling engine
   --------------------------------------------------------------------------
   The dataset gives a baseline watering interval for each species, assuming a
   15cm plastic pot in the plant's ideal light. Real homes differ, so the
   interval is adjusted for:

     · season        — dormant plants need far less water
     · room light    — brighter light means faster drying
     · pot size      — small pots dry out much faster than large ones
     · pot material  — terracotta breathes and wicks moisture away
     · drainage      — no holes means water more cautiously
     · weather       — a hot dry spell shortens intervals

   Every adjustment is reported back through `explain()` so the app can tell
   the user *why* it suggests 6 days rather than the 8 on the label.
   ========================================================================== */

window.Schedule = (function () {

  /* ---------- Seasonal ---------- */
  function currentSeason() {
    return LOOKUPS.season(new Date(), Store.hemisphere());
  }

  function isGrowingSeason() {
    const meta = LOOKUPS.SEASON_META[currentSeason()];
    return meta ? meta.growing : true;
  }

  /* ---------- Pot geometry ----------
     Approximate a tapered pot as a cylinder of height ≈ 0.85 × diameter.
     Volume in litres; the reference plant is a 15cm pot at ~2.0L. */
  function potVolumeL(diameterCm) {
    const d = Math.max(5, Number(diameterCm) || 15);
    const r = d / 2;
    const h = d * 0.85;
    return (Math.PI * r * r * h) / 1000;
  }

  const REFERENCE_L = potVolumeL(15);

  /* Small pots dry faster. Scale by the cube root of the volume ratio so a
     pot half the volume dries roughly 1.26× faster, not 2× — surface-area-
     to-volume scaling, which matches how pots actually behave. */
  function potSizeFactor(diameterCm) {
    const ratio = potVolumeL(diameterCm) / REFERENCE_L;
    return Math.pow(ratio, 1 / 3);
  }

  /* ---------- The core calculation ---------- */

  /* Returns { days, base, factors[], notes[] } */
  function wateringInterval(plant) {
    const sp = Store.species(plant);
    if (!sp || !sp.water) return { days: 7, base: 7, factors: [], notes: [] };

    const growing = isGrowingSeason();
    const base = growing ? sp.water.warm : sp.water.cool;
    let days = base;
    const factors = [];

    // --- Season (already baked into base, but explain it) ---
    const seasonMeta = LOOKUPS.SEASON_META[currentSeason()];
    if (!growing) {
      factors.push({
        label: seasonMeta.label + ' dormancy',
        effect: 'longer',
        detail: 'Growth has slowed, so it drinks much less — ' + base + ' days rather than ' + sp.water.warm + '.'
      });
    }

    // --- Room light ---
    const room = plant.roomId ? Store.getRoom(plant.roomId) : null;
    if (room && room.light && LOOKUPS.LIGHT[room.light] && LOOKUPS.LIGHT[sp.light.ideal]) {
      const roomRank  = LOOKUPS.LIGHT[room.light].rank;
      const idealRank = LOOKUPS.LIGHT[sp.light.ideal].rank;
      const delta = roomRank - idealRank;
      if (delta > 0) {
        const f = 1 - (0.11 * delta);
        days *= f;
        factors.push({
          label: 'Bright spot',
          effect: 'shorter',
          detail: room.name + ' is brighter than this plant\'s baseline, so the soil dries faster.'
        });
      } else if (delta < 0) {
        const f = 1 + (0.14 * Math.abs(delta));
        days *= f;
        factors.push({
          label: 'Dim spot',
          effect: 'longer',
          detail: room.name + ' is dimmer than ideal — less light means slower drying and a real risk of overwatering.'
        });
      }
    }

    // --- Pot size ---
    const sizeF = potSizeFactor(plant.potCm);
    if (Math.abs(sizeF - 1) > 0.08) {
      days *= sizeF;
      factors.push({
        label: plant.potCm + 'cm pot',
        effect: sizeF < 1 ? 'shorter' : 'longer',
        detail: sizeF < 1
          ? 'A smaller pot holds less soil and dries out sooner.'
          : 'A larger pot holds more moisture and stays damp for longer.'
      });
    }

    // --- Pot material ---
    const mat = LOOKUPS.POT_MATERIALS[plant.potMaterial];
    if (mat && mat.dryFactor !== 1) {
      days *= mat.dryFactor;
      factors.push({
        label: mat.label,
        effect: 'shorter',
        detail: mat.note
      });
    }

    // --- Drainage ---
    const drain = LOOKUPS.DRAINAGE[plant.drainage];
    if (drain && drain.factor !== 1) {
      days *= drain.factor;
      factors.push({
        label: 'No drainage holes',
        effect: 'longer',
        detail: drain.note
      });
    }

    // --- Weather / manual offset ---
    if (plant.waterOffset) {
      days += plant.waterOffset;
      factors.push({
        label: plant.waterOffset < 0 ? 'Adjusted for dry weather' : 'Adjusted for wet weather',
        effect: plant.waterOffset < 0 ? 'shorter' : 'longer',
        detail: 'You accepted a ' + Math.abs(plant.waterOffset) + '-day adjustment based on your local forecast.'
      });
    }

    days = Math.max(1, Math.round(days));
    return { days: days, base: base, factors: factors, growing: growing };
  }

  /* How much water, in millilitres, for this specific pot. */
  function waterAmount(plant) {
    const sp = Store.species(plant);
    const pct = (sp && sp.water && sp.water.soakPct) || 0.25;
    const litres = potVolumeL(plant.potCm);
    // Soil occupies roughly 80% of the pot's gross volume.
    const ml = Math.round(litres * 1000 * 0.8 * pct);
    // Round to something a person can actually measure.
    const rounded = ml < 100 ? Math.round(ml / 10) * 10 : Math.round(ml / 50) * 50;
    return Math.max(30, rounded);
  }

  /* ---------- Due dates ---------- */

  /* Days until watering is due. Negative means overdue.
     A plant that has never been watered is due immediately. */
  function waterDue(plant) {
    const interval = wateringInterval(plant).days;
    if (!plant.lastWatered) return { days: 0, never: true, interval: interval };
    const last = UI.fromISO(plant.lastWatered);
    if (!last) return { days: 0, never: true, interval: interval };
    const next = UI.addDays(last, interval);
    return {
      days: UI.daysBetween(UI.today(), next),
      never: false,
      interval: interval,
      nextDate: next,
      lastDate: last
    };
  }

  /* Fertilising only happens in the growing season. */
  function fertiliseDue(plant) {
    const sp = Store.species(plant);
    if (!sp || !sp.fert) return null;
    if (!isGrowingSeason()) {
      return {
        dormant: true,
        interval: sp.fert.everyDays,
        reason: LOOKUPS.SEASON_META[currentSeason()].label +
                ' — hold off feeding until growth restarts in spring.'
      };
    }
    const interval = sp.fert.everyDays;
    if (!plant.lastFertilised) return { days: 0, never: true, interval: interval, dormant: false };
    const last = UI.fromISO(plant.lastFertilised);
    if (!last) return { days: 0, never: true, interval: interval, dormant: false };
    const next = UI.addDays(last, interval);
    return {
      days: UI.daysBetween(UI.today(), next),
      never: false,
      interval: interval,
      nextDate: next,
      lastDate: last,
      dormant: false
    };
  }

  /* ---------- Task list ---------- */

  /* Every care task due within `horizon` days, soonest first. */
  function tasks(horizon) {
    const h = (typeof horizon === 'number') ? horizon : 0;
    const out = [];

    Store.activePlants().forEach(function (plant) {
      const w = waterDue(plant);
      if (w.days <= h) {
        out.push({
          plantId: plant.id,
          type: 'water',
          days: w.days,
          never: w.never,
          detail: waterAmount(plant) + 'ml',
          overdue: w.days < 0
        });
      }

      const f = fertiliseDue(plant);
      if (f && !f.dormant && f.days <= h) {
        const sp = Store.species(plant);
        out.push({
          plantId: plant.id,
          type: 'fertilise',
          days: f.days,
          never: f.never,
          /* Set as fractions, because the spelled-out words did not fit.
             A Today row joins this to the due text with a middot and lets
             .truncate deal with the overflow — "24 days overdue · Quarter
             strength" came out as "24 days overdue · Quarter stren…" at
             390px, clipped mid-word. One extra digit in the day count was
             all it took; the same row at "9 days overdue" fitted.

             Truncation is right for a plant's name, which the reader chose
             and which can be any length. It is wrong for a string this file
             generates from a three-value enum, where the longest form is
             known at author time and can simply be made to fit. Leaning on
             the ellipsis for our own copy is how you ship a row that is
             correct at one number and broken at another.

             The fraction is also how dilution is written on the bottle, so
             it reads as the more precise form rather than an abbreviation,
             and it caps the longest variant at "Full strength" — three
             characters under the old worst case, leaving room for a
             three-digit overdue count. Precomposed Latin-1 glyphs rather
             than a fraction built from a slash, so each is one character
             that Jost covers. */
          detail: (sp.fert.strength === 'full' ? 'Full' :
                   sp.fert.strength === 'quarter' ? '\u00BC' : '\u00BD') + ' strength',
          overdue: f.days < 0
        });
      }
    });

    /* Sorted by what matters, which is not the same as by how late it is.

       This used to be a straight `a.days - b.days`, with water beating
       feeding only on an exact tie — a tiebreak that almost never fires,
       since two jobs rarely land on precisely the same day. The result on
       the fixture greenhouse was a "Needs you today" list of seven jobs
       whose first five were all feeds, at 24, 10, 9, 6 and 5 days late,
       with the one plant that actually wanted water sitting sixth.

       That ordering is backwards for the thing this app is for. Missing a
       feed by three weeks costs a plant some growth it will make up; missing
       a drink can kill it. The view's own greeting says as much — "most
       plants forgive a late drink far more readily than an early one" — and
       feeding is forgiven more readily still. Ranking a month-old feed above
       today's watering tells the reader to do the harmless thing first.

       So everything already due collapses into one bucket, because inside it
       the kind of job matters more than its precise lateness: drinks first,
       most overdue at the top, then feeds on the same basis. Anything still
       in the future stays strictly chronological, which is what "Coming up"
       needs — a seven-day lookahead is read as a calendar, and grouping it
       by type there would scramble the dates for no gain. */
    return out.sort(function (a, b) {
      const aNow = a.days <= 0;
      const bNow = b.days <= 0;
      if (aNow !== bNow) return aNow ? -1 : 1;

      if (aNow) {
        if (a.type !== b.type) return a.type === 'water' ? -1 : 1;
        return a.days - b.days;
      }

      if (a.days !== b.days) return a.days - b.days;
      return a.type === 'water' ? -1 : 1;
    });
  }

  function overdueCount() {
    return tasks(0).filter(function (t) { return t.days <= 0; }).length;
  }

  /* ---------- Light matching ---------- */

  /* Is this plant in a room that suits it? */
  function lightMatch(plant) {
    const sp = Store.species(plant);
    const room = plant.roomId ? Store.getRoom(plant.roomId) : null;
    if (!sp || !room || !room.light) return null;

    const roomLight = room.light;
    if (roomLight === sp.light.ideal) {
      return { verdict: 'ideal', text: 'This is exactly the light it wants.' };
    }
    if ((sp.light.avoid || []).indexOf(roomLight) !== -1) {
      return {
        verdict: 'bad',
        text: LOOKUPS.LIGHT[roomLight].label + ' is specifically bad for this plant. ' +
              'It would much rather have ' + LOOKUPS.LIGHT[sp.light.ideal].label.toLowerCase() + '.'
      };
    }
    if ((sp.light.tolerates || []).indexOf(roomLight) !== -1) {
      return {
        verdict: 'ok',
        text: 'It will cope with ' + LOOKUPS.LIGHT[roomLight].label.toLowerCase() +
              ', though ' + LOOKUPS.LIGHT[sp.light.ideal].label.toLowerCase() + ' would suit it better.'
      };
    }
    return {
      verdict: 'poor',
      text: 'This plant really wants ' + LOOKUPS.LIGHT[sp.light.ideal].label.toLowerCase() +
            '. Expect slow, stretched growth here.'
    };
  }

  /* Rank rooms by how well they suit a species — used when adding a plant. */
  function bestRoomsFor(speciesId) {
    const sp = window.PLANT_DATA.filter(function (s) { return s.id === speciesId; })[0];
    if (!sp) return [];
    return Store.get().rooms.map(function (room) {
      let score = 0;
      if (!room.light) score = 1;
      else if (room.light === sp.light.ideal) score = 4;
      else if ((sp.light.tolerates || []).indexOf(room.light) !== -1) score = 3;
      else if ((sp.light.avoid || []).indexOf(room.light) !== -1) score = 0;
      else score = 1;

      // Humidity lovers do better in naturally humid rooms.
      if (sp.humidity === 'high' && room.humid === 'high') score += 1;
      return { room: room, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  /* ---------- Pet safety ---------- */

  /* Warn if a species is toxic to a pet the user actually owns. */
  function petRisk(sp) {
    const pets = Store.get().profile.pets || [];
    if (!pets.length || !sp || !sp.tox) return null;

    const risks = [];
    pets.forEach(function (pet) {
      const rating = sp.tox[pet];
      if (rating && rating !== 'safe') {
        risks.push({ pet: pet, rating: rating });
      }
    });
    if (!risks.length) return null;

    const worst = risks.reduce(function (acc, r) {
      const order = { 'mild': 1, 'toxic': 2, 'very-toxic': 3 };
      return order[r.rating] > order[acc.rating] ? r : acc;
    }, risks[0]);

    return {
      risks: risks,
      worst: worst.rating,
      pets: risks.map(function (r) { return r.pet; }),
      note: sp.tox.note
    };
  }

  /* ---------- Summary for the Today greeting ---------- */
  function summary() {
    const all = Store.activePlants();
    const due = tasks(0);
    const overdue = due.filter(function (t) { return t.days < 0; });
    const soon = tasks(3).filter(function (t) { return t.days > 0; });
    return {
      plantCount: all.length,
      roomCount: Store.get().rooms.length,
      dueCount: due.length,
      overdueCount: overdue.length,
      soonCount: soon.length,
      season: currentSeason(),
      seasonMeta: LOOKUPS.SEASON_META[currentSeason()]
    };
  }

  return {
    currentSeason: currentSeason, isGrowingSeason: isGrowingSeason,
    potVolumeL: potVolumeL, wateringInterval: wateringInterval, waterAmount: waterAmount,
    waterDue: waterDue, fertiliseDue: fertiliseDue,
    tasks: tasks, overdueCount: overdueCount,
    lightMatch: lightMatch, bestRoomsFor: bestRoomsFor, petRisk: petRisk,
    summary: summary
  };
})();
