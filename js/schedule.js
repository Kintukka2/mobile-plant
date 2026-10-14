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
                       (the three pot factors only where the species'
                       water.method says the pot sets the drying)
     · weather       — a hot dry spell shortens intervals

   Every adjustment is reported back through `explain()` so the app can tell
   the user *why* it suggests 6 days rather than the 8 on the label.
   ========================================================================== */

window.Schedule = (function () {

  /* ---------- Seasonal ---------- */
  function currentSeason() {
    return LOOKUPS.season(new Date(), Store.hemisphere());
  }

  function seasonPhrase() {
    const meta = LOOKUPS.SEASON_META[currentSeason()];
    const phase = LOOKUPS.seasonPhase(new Date(), Store.hemisphere());
    return meta && meta.phrase ? meta.phrase[phase] : '';
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

  /* Returns { days, base, ref, factors[], growing }.

     `base` is this season's species figure, so out of the growing season it
     already carries the dormancy factor listed below. `ref` is the growing-
     season figure, the one every factor, dormancy included, is measured
     from. The Care heading used to ask "Why <days> and not <base>?", and
     with dormancy the only factor those are the same number: "Why 12 and
     not 12?" on every plant in autumn (PrimeTestLab 8220, M-02). */
  /* The species' figure for a season. Most plants grow in spring and
     summer and rest in autumn and winter, which warm and cool describe. A
     few keep their own calendar: Living Stones grow in autumn and spring
     and rest in summer and winter, and a schedule built on warm and cool
     waters them on exactly the days that kill them. water.seasons names
     them season by season, and 0 is a rest with no water at all. */
  const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

  function seasonDays(sp, season) {
    const own = sp.water.seasons;
    if (own && typeof own[season] === 'number') return own[season];
    return LOOKUPS.SEASON_META[season].growing ? sp.water.warm : sp.water.cool;
  }

  /* The next season in which the species takes water again, for "Resting
     until autumn". Null for a species that never rests. */
  function nextWateredSeason(sp, season) {
    const at = SEASON_ORDER.indexOf(season);
    for (let i = 1; i <= 4; i++) {
      const k = SEASON_ORDER[(at + i) % 4];
      if (seasonDays(sp, k) > 0) return k;
    }
    return null;
  }

  function wateringInterval(plant) {
    const sp = Store.species(plant);
    if (!sp || !sp.water) return { days: 7, base: 7, ref: 7, factors: [], notes: [] };

    const growing = isGrowingSeason();
    const method = speciesMethod(sp);
    const season = currentSeason();
    const base = seasonDays(sp, season);
    const seasonMeta = LOOKUPS.SEASON_META[season];

    /* A rest is not a long interval. It is no watering at all, so nothing
       downstream may treat it as a number of days: waterDue() reports it,
       tasks() and the reminder digest skip it, and the plant page says when
       watering starts again. */
    if (base <= 0) {
      const until = nextWateredSeason(sp, season);
      return { days: 0, base: 0, ref: sp.water.warm, factors: [], growing: growing,
               resting: true, until: until ? LOOKUPS.SEASON_META[until].label : null };
    }

    let days = base;
    const factors = [];

    // --- Season (already baked into base, but explain it) ---
    if (sp.water.seasons) {
      if (base !== sp.water.warm) {
        factors.push({
          label: seasonMeta.label + ' timing',
          effect: base > sp.water.warm ? 'longer' : 'shorter',
          detail: 'It keeps its own seasons rather than resting in winter, so ' +
                  seasonMeta.label.toLowerCase() + ' sets the gap at ' + base + ' days.'
        });
      }
    } else if (!growing) {
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
          detail: room.name + ' is brighter than this plant\'s baseline, so ' +
                  (method.potDrying ? 'the soil dries' : 'it dries out') + ' faster.'
        });
      } else if (delta < 0) {
        const f = 1 + (0.14 * Math.abs(delta));
        days *= f;
        factors.push({
          label: 'Dim spot',
          effect: 'longer',
          detail: room.name + ' is dimmer than this plant\'s baseline, so ' +
                  (method.potDrying ? 'the soil dries' : 'it dries out') + ' more slowly and is easier to overwater.'
        });
      }
    }

    /* A plant with no pot has a 15cm plastic one on file, the form's
       default, and nothing should be read from it. A bromeliad's pot is
       real but its cup is what empties, so the pot does not set the pace. */
    if (method.potDrying) {
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
    }

    /* --- Weather / manual offset ---
       One field, two ways in: a weather nudge accepted on Today and Adjust
       schedule on the plant page both write waterOffset, and nothing records
       which. It used to say the forecast had set it, which told a reader who
       had nudged it by hand that the weather had. So it says what the
       adjustment is and that the reader chose it, and nothing about why. */
    if (plant.waterOffset) {
      days += plant.waterOffset;
      const by = Math.abs(plant.waterOffset);
      factors.push({
        label: (plant.waterOffset < 0 ? 'Shortened by ' : 'Lengthened by ') + UI.plural(by, 'day'),
        effect: plant.waterOffset < 0 ? 'shorter' : 'longer',
        detail: 'An adjustment you chose, from the forecast or by hand.'
      });
    }

    days = Math.max(1, Math.round(days));
    return { days: days, base: base, ref: sp.water.warm, factors: factors, growing: growing };
  }

  /* How a species takes its water, from LOOKUPS.WATER_METHODS. The form
     asks before there is a plant, so this reads the species; waterMethod()
     is the same answer for a plant already in the greenhouse. */
  function speciesMethod(sp) {
    const key = (sp && sp.water && sp.water.method) || 'pour';
    return LOOKUPS.WATER_METHODS[key] || LOOKUPS.WATER_METHODS.pour;
  }

  function waterMethod(plant) {
    return speciesMethod(Store.species(plant));
  }

  /* How much water, in millilitres, for this specific pot — or null for a
     species that is not watered by pouring, where a pot-based figure would
     be a number with nothing behind it. */
  function waterAmount(plant) {
    if (!waterMethod(plant).measured) return null;
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
    const iv = wateringInterval(plant);
    /* Sorts after every plant that is due, and is never due itself. */
    if (iv.resting) return { days: 9999, never: false, interval: 0, resting: true, until: iv.until };
    const interval = iv.days;
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
    /* Never, not "paused": carnivorous plants are burned by fertiliser and
       Living Stones split on it. `dormant` stays true so every caller that
       already skips a paused feed skips this one too. */
    if (sp.fert.never) return { noFeed: true, dormant: true, interval: 0, reason: sp.fert.note || '' };
    /* A plant that flowers in autumn and winter (Cyclamen) is fed then and
       not in summer, the reverse of the usual pause; fert.seasons names the
       seasons it is fed in. Without it, feeding follows the growing season. */
    const season = currentSeason();
    const own = sp.fert.seasons;
    if (own ? own.indexOf(season) === -1 : !isGrowingSeason()) {
      let next = 'spring';
      if (own) {
        const at = SEASON_ORDER.indexOf(season);
        for (let i = 1; i <= 4; i++) {
          const k = SEASON_ORDER[(at + i) % 4];
          if (own.indexOf(k) !== -1) { next = k; break; }
        }
      }
      return {
        dormant: true,
        interval: sp.fert.everyDays,
        reason: LOOKUPS.SEASON_META[season].label +
                (own ? ': it isn\'t growing, so no plant food until ' + next + '.'
                     : ': no plant food until growth restarts in spring.')
      };
    }
    const interval = sp.fert.everyDays;
    if (!plant.lastFertilised) {
      /* A plant that has only just come home is not fed on its first day.
         Nursery compost carries fertiliser, a move is a shock, and feeding
         roots that are settling in is how they burn. It also made the very
         first job a new reader was ever handed "Fertilise" a plant bought
         that morning, since the form dates it today. So one feed interval
         from the day it arrived, then the usual rhythm. Feeding late costs
         nothing; a plant that has been here longer is due as before. */
      const got = UI.fromISO(plant.acquired);
      const first = got ? UI.addDays(got, interval) : null;
      if (first && first > UI.today()) {
        return { days: UI.daysBetween(UI.today(), first), never: false, settling: true,
                 interval: interval, nextDate: first, dormant: false };
      }
      /* A plant with no arrival date was already at home when the reader
         added it in the introduction, so it is settled and owed a feed. But
         every one of them owed it on the first morning made day one a list
         of feeds on top of the waterings, so the first is held a week from
         the day it was added. After that it is due as any other. */
      const added = !got ? UI.fromISO(plant.createdAt) : null;
      const held = added ? UI.addDays(added, 7) : null;
      if (held && held > UI.today()) {
        return { days: UI.daysBetween(UI.today(), held), never: false, held: true,
                 interval: interval, nextDate: held, dormant: false };
      }
      return { days: 0, never: true, interval: interval, dormant: false };
    }
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
      if (!w.resting && w.days <= h) {
        const ml = waterAmount(plant);
        out.push({
          plantId: plant.id,
          type: 'water',
          days: w.days,
          never: w.never,
          detail: ml == null ? waterMethod(plant).task : ml + 'ml',
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
       a drink can kill it. Ranking a month-old feed above today's watering
       tells the reader to do the harmless thing first.

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

  /* A light rung as words in a sentence. The labels are written for a chip,
     where "Bright indirect" stands alone; lowercased into running text it
     ended a sentence on a bare adjective ("would much rather have bright
     indirect."), so any label without a noun of its own takes "light". */
  function lightWords(key, capital) {
    const label = LOOKUPS.LIGHT[key].label;
    const words = /\b(light|sun)$/i.test(label) ? label : label + ' light';
    return capital ? words : words.toLowerCase();
  }

  /* Is this plant in a room that suits it? */
  function lightMatch(plant) {
    const sp = Store.species(plant);
    const room = plant.roomId ? Store.getRoom(plant.roomId) : null;
    if (!sp || !room || !room.light) return null;

    const roomLight = room.light;

    /* No species lists 'none' in its avoid array — the value did not exist
       when that data was written — so a windowless room would otherwise fall
       through to the generic "expect slow, stretched growth", which is the
       wrong scale of warning. Nothing grows in the dark. Say so, and say
       what to do instead, because the reader almost certainly knows their
       bathroom has no window and wants the plan rather than the diagnosis. */
    if (roomLight === 'none') {
      return {
        verdict: 'bad',
        text: room.name + ' has no daylight, so it will lose its leaves unless you move it to a lit ' +
              'room every week or two or put a grow lamp over it.'
      };
    }

    if (roomLight === sp.light.ideal) {
      return { verdict: 'ideal', text: 'This is exactly the light it wants.' };
    }
    if ((sp.light.avoid || []).indexOf(roomLight) !== -1) {
      return {
        verdict: 'bad',
        text: lightWords(roomLight, true) + ' is bad for this plant, which wants ' +
              lightWords(sp.light.ideal) + '.'
      };
    }
    if ((sp.light.tolerates || []).indexOf(roomLight) !== -1) {
      return {
        verdict: 'ok',
        text: 'It will cope with ' + lightWords(roomLight) +
              ', though ' + lightWords(sp.light.ideal) + ' would suit it better.'
      };
    }
    return {
      verdict: 'poor',
      text: 'It wants ' + lightWords(sp.light.ideal) + ', so expect slow, stretched growth in ' +
            room.name + '.'
    };
  }

  /* Rank rooms by how well they suit a species — used when adding a plant. */
  function bestRoomsFor(speciesId) {
    const sp = window.PLANT_DATA.filter(function (s) { return s.id === speciesId; })[0];
    if (!sp) return [];
    return Store.get().rooms.map(function (room) {
      let score = 0;
      /* Below the 'unknown light' score of 1, not equal to it: a room we know
         nothing about might suit the plant, and a room with no window is
         known not to. Suggesting one would be worse than saying nothing. */
      if (room.light === 'none') score = -1;
      else if (!room.light) score = 1;
      else if (room.light === sp.light.ideal) score = 4;
      else if ((sp.light.tolerates || []).indexOf(room.light) !== -1) score = 3;
      else if ((sp.light.avoid || []).indexOf(room.light) !== -1) score = 0;
      else score = 1;

      /* Humidity lovers do better in naturally humid rooms — which moves a
         room up the list, but says nothing about its light. The light score
         is kept apart for the labels: added together, a humid room the plant
         only tolerates read "ideal light", and a humid room it should avoid
         lost its "poor light" warning. */
      const lightScore = score;
      if (sp.humidity === 'high' && room.humid === 'high') score += 1;
      return { room: room, score: score, light: lightScore };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  /* ---------- Pet safety ---------- */

  /* Warn if a species is toxic to a pet the user actually owns. */
  /* Species that would thrive in the rooms the reader actually has: an
     ideal light match per room, none they already grow, none that would
     hurt their pets. Two per room so one bright room does not take the
     whole list. Read by Discover's shortlist and by the plan once it can
     say how much light each room gets, so the two always agree.

     The experience answer orders the candidates: someone completely new or
     still finding their feet sees the forgiving ones first, because the
     first plant a beginner brings home is the one that decides whether
     there is a second. */
  function roomMatches(limit) {
    const rooms = Store.get().rooms.filter(function (r) { return !!r.light && r.light !== 'none'; });
    const owned = Store.activePlants().map(function (p) { return p.speciesId; });
    const exp = Store.get().profile.experience;
    const gentle = exp === 'new' || exp === 'some';
    const RANK = { easy: 0, medium: 1, hard: 2 };
    const pool = window.PLANT_DATA.slice();
    if (gentle) {
      pool.sort(function (a, b) { return (RANK[a.difficulty] || 0) - (RANK[b.difficulty] || 0); });
    }
    const picks = [];
    rooms.forEach(function (room) {
      pool.filter(function (sp) {
        return sp.light.ideal === room.light &&
               owned.indexOf(sp.id) === -1 &&
               picks.every(function (x) { return x.sp.id !== sp.id; }) &&
               !petRisk(sp);
      }).slice(0, 2).forEach(function (sp) { picks.push({ sp: sp, room: room }); });
    });
    return picks.slice(0, limit || 5);
  }

  function petRisk(sp) {
    const pets = Store.get().profile.pets || [];
    if (!pets.length || !sp || !sp.tox) return null;

    const order = { 'mild': 1, 'toxic': 2, 'very-toxic': 3 };
    const risks = [];
    pets.forEach(function (pet) {
      /* "Other" has no column of its own — the species data rates cats,
         dogs and people — so it borrows the worse of the two animals. A
         rabbit or a bird is not a cat, but a plant that would hurt either
         of those is not one to leave within reach of anything. */
      const keys = pet === 'other' ? ['cats', 'dogs'] : [pet];
      let rating = null;
      keys.forEach(function (k) {
        const r = sp.tox[k];
        if (r && r !== 'safe' && (!rating || order[r] > order[rating])) rating = r;
      });
      if (rating) risks.push({ pet: pet, rating: rating });
    });
    if (!risks.length) return null;

    const worst = risks.reduce(function (acc, r) {
      return order[r.rating] > order[acc.rating] ? r : acc;
    }, risks[0]);

    /* The names feed "Not safe for your cats or dogs". "Other" would read as
       "your other", so once it is in the mix the line says "your pets". */
    const names = risks.some(function (r) { return r.pet === 'other'; }) ? ['pets'] : risks.map(function (r) { return r.pet; });

    return {
      risks: risks,
      worst: worst.rating,
      pets: names,
      note: sp.tox.note
    };
  }

  /* ---------- Summary for the Today greeting ---------- */
  function summary() {
    const all = Store.activePlants();
    const due = tasks(0);
    /* Plants, not jobs, and only waterings. The greeting says "N plants are
       overdue for water", and it used to be handed every overdue task: a
       plant late for both water and feed counted twice and a plant late only
       for feed counted once, so six plants could read as seven thirsty. */
    const thirsty = {};
    due.forEach(function (t) { if (t.type === 'water' && t.days < 0) thirsty[t.plantId] = true; });
    const soon = tasks(3).filter(function (t) { return t.days > 0; });
    return {
      plantCount: all.length,
      roomCount: Store.get().rooms.length,
      dueCount: due.length,
      thirstyCount: Object.keys(thirsty).length,
      soonCount: soon.length,
      season: currentSeason(),
      seasonMeta: LOOKUPS.SEASON_META[currentSeason()],
      /* Where in the season, not just which one — the greeting says it out
         loud and twelve weeks is long enough for the difference to matter. */
      seasonPhrase: seasonPhrase()
    };
  }

  return {
    currentSeason: currentSeason, isGrowingSeason: isGrowingSeason,
    potVolumeL: potVolumeL, wateringInterval: wateringInterval, waterAmount: waterAmount,
    waterMethod: waterMethod, speciesMethod: speciesMethod,
    waterDue: waterDue, fertiliseDue: fertiliseDue, roomMatches: roomMatches,
    tasks: tasks, overdueCount: overdueCount,
    lightMatch: lightMatch, bestRoomsFor: bestRoomsFor, petRisk: petRisk,
    summary: summary
  };
})();
