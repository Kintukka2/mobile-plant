/* ==========================================================================
   Sprout — lookup tables & shared vocabulary
   ========================================================================== */

window.LOOKUPS = (function () {

  /* ---------- Light levels ----------
     `ico` names a glyph in UI.icon() and is the only mark in these tables.
     The hairline set shares the interface's stroke weight and takes its
     colour from the surrounding text; a colour emoji imports someone else's
     illustration style and renders differently on every platform, which is
     the opposite of a house style.

     There used to be a parallel `emoji` field on every entry, justified as
     "the right answer for plain-text contexts". It was read in exactly zero
     places — the two contexts that genuinely cannot hold markup (<option>
     labels and textContent sheet titles) simply use the label, and read
     better for it. Removed, so no future render site can pick it up by
     accident and reintroduce a cartoon into a hairline interface. */
  const LIGHT = {
    /* Rank 0, and the only rung that is not a quantity of daylight but the
       absence of a window. An interior bathroom or a windowless hall is a
       real room people keep plants in, and the app had no way to say so —
       'Low light' was the floor, which quietly told the reader that a
       cupboard and a north-facing sill were the same proposition. They are
       not: one supports a shade-tolerant plant indefinitely, the other
       supports nothing, and the advice has to differ. */
    'none': {
      label: 'No natural light',
      short: 'None',
      ico: 'sunOff',
      desc: 'No window at all. Nothing grows here for long without a lamp — see the note on rotating plants through.',
      rank: 0
    },
    'low': {
      label: 'Low light',
      short: 'Low',
      ico: 'moon',
      desc: 'No direct sun. You could read a book comfortably, but only just.',
      rank: 1
    },
    'medium': {
      label: 'Medium light',
      short: 'Medium',
      ico: 'cloud',
      desc: 'Bright enough to read all day, a few metres back from a window.',
      rank: 2
    },
    'bright-indirect': {
      label: 'Bright indirect',
      short: 'Bright',
      ico: 'cloudSun',
      desc: 'Near a window with a clear view of the sky, but out of the sun\'s direct path.',
      rank: 3
    },
    'direct': {
      label: 'Direct sun',
      short: 'Direct',
      ico: 'sun',
      desc: 'Several hours of unfiltered sunlight landing on the leaves.',
      rank: 4
    }
  };

  /* ---------- Compass aspects ----------
     What a window faces determines the light it gets — and it inverts
     between hemispheres. Poleward-facing windows are the dim ones. */
  const ASPECTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  const ASPECT_NAMES = {
    N: 'North', NE: 'North-east', E: 'East', SE: 'South-east',
    S: 'South', SW: 'South-west', W: 'West', NW: 'North-west',
    NONE: 'No window'
  };

  /* Not a compass point, so it is not in ASPECTS — but it belongs in the same
     question, because "which way does the window face?" has an answer for a
     room with no window and the form has to accept it. Shared by both
     hemisphere tables: a cupboard faces nowhere in either one. */
  const NO_WINDOW = {
    light: 'none',
    note: 'No window, so no daylight at all. A plant can live here for a week or two at a time, but it has to go back to a lit room to recover — or sit under a grow lamp.'
  };

  // Light profile per aspect in the NORTHERN hemisphere.
  const ASPECT_NORTH = {
    S:  { light: 'direct',          note: 'The brightest windows — long hours of direct sun. Great for cacti and citrus; scorches ferns.' },
    SE: { light: 'bright-indirect', note: 'Gentle direct morning sun, bright the rest of the day. Suits almost everything.' },
    SW: { light: 'direct',          note: 'Harsh hot afternoon sun. Sun-lovers thrive; tender leaves burn.' },
    E:  { light: 'bright-indirect', note: 'Soft morning sun then bright shade. The safest all-rounder for houseplants.' },
    W:  { light: 'direct',          note: 'Strong afternoon and evening sun, and it brings heat with it.' },
    NE: { light: 'medium',          note: 'Cool, soft light with a little early sun. Kind to ferns and calatheas.' },
    NW: { light: 'medium',          note: 'Moderate light with some late sun in summer.' },
    N:  { light: 'low',             note: 'No direct sun at all. Only the genuinely shade-tolerant will be happy.' },
    NONE: NO_WINDOW
  };

  // Southern hemisphere: north/south swap, east/west morning-vs-afternoon stays.
  const ASPECT_SOUTH = {
    N:  { light: 'direct',          note: 'The brightest windows — long hours of direct sun. Great for cacti and citrus; scorches ferns.' },
    NE: { light: 'bright-indirect', note: 'Gentle direct morning sun, bright the rest of the day. Suits almost everything.' },
    NW: { light: 'direct',          note: 'Harsh hot afternoon sun. Sun-lovers thrive; tender leaves burn.' },
    E:  { light: 'bright-indirect', note: 'Soft morning sun then bright shade. The safest all-rounder for houseplants.' },
    W:  { light: 'direct',          note: 'Strong afternoon and evening sun, and it brings heat with it.' },
    SE: { light: 'medium',          note: 'Cool, soft light with a little early sun. Kind to ferns and calatheas.' },
    SW: { light: 'medium',          note: 'Moderate light with some late sun in summer.' },
    S:  { light: 'low',             note: 'No direct sun at all. Only the genuinely shade-tolerant will be happy.' },
    NONE: NO_WINDOW
  };

  function aspectProfile(aspect, hemisphere) {
    const table = hemisphere === 'south' ? ASPECT_SOUTH : ASPECT_NORTH;
    return table[aspect] || null;
  }

  /* 'NORTH-facing window' is the right phrase; 'NONE-facing window' is not,
     and building the label by concatenation gave us the second one as soon as
     a non-compass answer existed. One function, so every render site says it
     the same way. */
  function aspectLabel(aspect) {
    if (!aspect) return null;
    if (aspect === 'NONE') return 'No window';
    return (ASPECT_NAMES[aspect] || aspect) + '-facing window';
  }

  /* ---------- Hemisphere, when there is no location ----------
     Which way a window faces means the opposite thing either side of the
     equator, and so does the season. The app knows this and has always had
     both tables — but with no location saved it fell back to 'north', which
     is a coin toss that lands wrong for everyone below the equator. A reader
     in Sydney was told a south-facing window gets direct sun; in Sydney the
     south side is the shaded one, and the north side is the bright one.

     The device's IANA time zone answers this for free, with no permission
     prompt and no network call — 'Australia/Sydney' is as good as a latitude
     for this one question. A saved location still wins, and the profile lets
     the reader set it outright, because a list of zone names is a good guess
     and not a fact.

     Whole-region prefixes first, then the mixed regions named individually.
     Zones omitted from the mixed lists resolve north, which is the correct
     default for the northern majority of Pacific, African and American
     zones. */
  const SOUTH_PREFIXES = ['Australia/', 'Antarctica/'];

  const SOUTH_ZONES = [
    /* Indian Ocean — every zone in the region bar the Maldives. */
    'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos',
    'Indian/Comoro', 'Indian/Kerguelen', 'Indian/Mahe', 'Indian/Mauritius',
    'Indian/Mayotte', 'Indian/Reunion',
    /* Pacific — the southern half; Honolulu, Guam, Majuro and friends are north. */
    'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham',
    'Pacific/Easter', 'Pacific/Efate', 'Pacific/Fakaofo', 'Pacific/Fiji',
    'Pacific/Funafuti', 'Pacific/Galapagos', 'Pacific/Gambier', 'Pacific/Guadalcanal',
    'Pacific/Kanton', 'Pacific/Enderbury', 'Pacific/Marquesas', 'Pacific/Nauru', 'Pacific/Niue',
    'Pacific/Norfolk', 'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Pitcairn',
    'Pacific/Port_Moresby', 'Pacific/Rarotonga', 'Pacific/Tahiti',
    'Pacific/Tongatapu', 'Pacific/Wallis',
    /* Africa below the equator. Nairobi is 1.3 degrees south; Kampala,
       Libreville and Sao Tome are just north of it. */
    'Africa/Blantyre', 'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Dar_es_Salaam',
    'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg', 'Africa/Kigali',
    'Africa/Kinshasa', 'Africa/Luanda', 'Africa/Lubumbashi', 'Africa/Lusaka',
    'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane', 'Africa/Nairobi',
    'Africa/Windhoek',
    /* South America below the equator. Bogota, Caracas, Cayenne, Paramaribo
       and Boa Vista are north of it. */
    'America/Araguaina', 'America/Asuncion', 'America/Bahia', 'America/Belem',
    'America/Campo_Grande', 'America/Cuiaba', 'America/Eirunepe', 'America/Fortaleza',
    'America/Guayaquil', 'America/La_Paz', 'America/Lima', 'America/Maceio',
    'America/Manaus', 'America/Montevideo', 'America/Noronha', 'America/Porto_Velho',
    'America/Punta_Arenas', 'America/Recife', 'America/Rio_Branco', 'America/Santarem',
    'America/Santiago', 'America/Sao_Paulo',
    /* Atlantic outliers. */
    'Atlantic/St_Helena', 'Atlantic/Stanley',
    /* Argentina, in the short form some engines canonicalise it to. The
       prefix test below catches 'America/Argentina/Cordoba'; Node hands back
       'America/Cordoba' for the same zone, and browsers disagree with each
       other about which direction they normalise in. Both spellings listed,
       because the cost of a wrong guess here is every season and every window
       aspect inverted for a reader in Buenos Aires. */
    'America/Buenos_Aires', 'America/Catamarca', 'America/Cordoba',
    'America/Jujuy', 'America/Mendoza', 'America/Rosario'
  ];

  function hemisphereFromTimeZone() {
    let tz = null;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) { /* no Intl, or no zone reported */ }
    if (!tz) return null;

    /* Every Argentine zone is southern, and there are a dozen of them. */
    if (tz.indexOf('America/Argentina/') === 0) return 'south';

    for (let i = 0; i < SOUTH_PREFIXES.length; i++) {
      if (tz.indexOf(SOUTH_PREFIXES[i]) === 0) return 'south';
    }
    return SOUTH_ZONES.indexOf(tz) !== -1 ? 'south' : 'north';
  }

  /* ---------- Room presets ---------- */
  /* Each preset suggests its own mark, so picking "Bathroom" from the quick
     start fills the icon in too and the reader only overrules it if they
     want something else. */
  const ROOM_PRESETS = [
    { name: 'Living Room', icon: 'sofa' },
    { name: 'Bedroom',     icon: 'bed' },
    { name: 'Kitchen',     icon: 'hob' },
    { name: 'Bathroom',    icon: 'bath' },
    { name: 'Study',       icon: 'book' },
    { name: 'Hallway',     icon: 'stairs' },
    { name: 'Balcony',     icon: 'railing' },
    { name: 'Sunroom',     icon: 'glasshouse' },
    { name: 'Dining Room', icon: 'cutlery' },
    { name: 'Entryway',    icon: 'door' },
    { name: 'Patio',       icon: 'parasol' },
    { name: 'Office',      icon: 'monitor' }
  ];

  /* What the room icon picker offers. The twelve above, then the five light
     levels — a room is as often "the bright one" as it is a named function,
     and those glyphs already exist for LIGHT, so a second drawing of a sun
     would be one more thing to keep in step for no gain. */
  const ROOM_ICONS = [
    'sofa', 'bed', 'hob', 'bath', 'book', 'stairs',
    'railing', 'glasshouse', 'cutlery', 'door', 'parasol', 'monitor',
    'sun', 'cloudSun', 'cloud', 'moon', 'sunOff'
  ];


  /* ---------- Humidity ---------- */
  const HUMIDITY = {
    'low':      { label: 'Dry air is fine', ico: 'arid',     desc: 'Happy in normal, dry household air.' },
    'medium':   { label: 'Average humidity', ico: 'drop',     desc: 'Comfortable in typical indoor humidity, around 40–50%.' },
    'high':     { label: 'Loves humidity', ico: 'droplets', desc: 'Wants 60%+ — group it with other plants, or try a bathroom.' }
  };

  /* ---------- Difficulty ----------
     The old traffic-light circles said nothing a word does not, and read as
     a bug tracker. One dial glyph across all three levels; the label and
     the pill colour carry the grading. */
  const DIFFICULTY = {
    'easy':   { label: 'Forgiving', ico: 'dial', desc: 'Hard to kill. Shrugs off a missed watering.' },
    'medium': { label: 'Steady hand', ico: 'dial', desc: 'Wants a routine, but tells you clearly when it\'s unhappy.' },
    'hard':   { label: 'Fussy', ico: 'dial', desc: 'Particular about humidity, light or water. Rewarding once settled.' }
  };

  /* ---------- Toxicity ----------
     `variant` is the pill variant UI.pill() takes, not a class name, and it
     lives here because two views render this ladder — a species page and
     your own plant — and the same rating has to wear the same chip on both.
     It used to be a `pill` field naming a class, which nothing read: both
     views computed the variant themselves. When the top rung moved to
     oxblood the dead field kept saying pill-terra-hi, and a rule stated in
     one place and contradicted in another is worse than no rule. One
     source, both readers. */
  const TOX = {
    'safe':          { label: 'Pet safe',      variant: '',      ico: 'shield' },
    'mild':          { label: 'Mildly toxic',  variant: 'sun',   ico: 'warn'   },
    'toxic':         { label: 'Toxic',         variant: 'terra', ico: 'ban'    },
    'very-toxic':    { label: 'Highly toxic',  variant: 'blood', ico: 'skull'  }
  };

  /* ---------- Care task types ----------
     No `color` field. There was one, naming a hue per task type, and nothing
     ever read it — which is just as well: colouring by *kind* of job would
     have competed with the colour that carries urgency, and urgency is the
     only thing the reader needs a colour for on a list of chores. */
  const TASKS = {
    water:     { label: 'Water',      verb: 'Watered',    ico: 'drop'     },
    fertilise: { label: 'Fertilise',  verb: 'Fertilised', ico: 'wheat'    },
    rotate:    { label: 'Rotate',     verb: 'Rotated',    ico: 'rotate'   },
    mist:      { label: 'Mist',       verb: 'Misted',     ico: 'mist'     },
    repot:     { label: 'Repot',      verb: 'Repotted',   ico: 'pot'      },
    prune:     { label: 'Prune',      verb: 'Pruned',     ico: 'scissors' },
    inspect:   { label: 'Check over', verb: 'Checked',    ico: 'search'   }
  };

  /* ---------- Diary entry kinds ---------- */
  const LOG_KINDS = {
    note:      { label: 'Note', ico: 'note'        },
    photo:     { label: 'Photo', ico: 'camera'      },
    growth:    { label: 'Measurement', ico: 'ruler'       },
    water:     { label: 'Watered', ico: 'drop'        },
    fertilise: { label: 'Fertilised', ico: 'wheat'       },
    repot:     { label: 'Repotted', ico: 'pot'         },
    prune:     { label: 'Pruned', ico: 'scissors'    },
    milestone: { label: 'Milestone', ico: 'star'        },
    problem:   { label: 'Problem', ico: 'stethoscope' },
    propagate: { label: 'Propagated', ico: 'sprout'      }
  };

  /* ---------- Seasons (hemisphere-aware) ----------
     Month index 0–11. Returns the meteorological season. */
  function season(date, hemisphere) {
    const m = date.getMonth();
    const north = ['winter','winter','spring','spring','spring','summer',
                   'summer','summer','autumn','autumn','autumn','winter'][m];
    if (hemisphere !== 'south') return north;
    return { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' }[north];
  }

  /* Each season is exactly three months, so where you are inside it is just
     the index of the month within that run. Worth having, because "spring"
     covers twelve weeks and the advice at either end of it is not the same
     — and "it's the middle of spring" tells a reader where they stand in a
     way that "spring" alone does not. */
  function seasonPhase(date, hemisphere) {
    const key = season(date, hemisphere);
    const north = ['winter','winter','spring','spring','spring','summer',
                   'summer','summer','autumn','autumn','autumn','winter'];
    const m = date.getMonth();
    /* Northern months for this season, in order; the southern reader's
       months are the same slots, six apart, so counting the run works for
       either hemisphere as long as we count in the table's own terms. */
    const run = [];
    for (let i = 0; i < 12; i++) {
      const k = hemisphere === 'south'
        ? { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' }[north[i]]
        : north[i];
      if (k === key) run.push(i);
    }
    /* Winter wraps the year end, so its run comes back as [0, 1, 11] and
       the reader in December is at the start of it rather than the end.
       Rotating the wrapped run puts the months back in lived order. */
    if (run.length === 3 && run[2] - run[0] > 2) run.unshift(run.pop());
    const at = run.indexOf(m);
    return at === 0 ? 'start' : at === 1 ? 'middle' : 'end';
  }

  /* The greeting reads as three beats: where you stand, then what it means.
     `phrase` is the first — a plain statement of the calendar — and `note`
     is the second, the consequence stated as an instruction.

     Neither says "feed". It is the word the houseplant world uses and it
     means nothing to someone who has not met it: a beginner reading "start
     feeding again" has no idea what to buy or what to do with it. "Plant
     food" names the thing on the shelf. */
  const SEASON_META = {
    spring: { label: 'Spring', ico: 'flower', growing: true,
              phrase: { start: 'Spring is just starting.',
                        middle: 'It\'s the middle of spring.',
                        end: 'Spring is nearly over.' },
              note: 'Expect thirstier plants, and it\'s time to start mixing plant food into the water again.' },
    summer: { label: 'Summer', ico: 'sun', growing: true,
              phrase: { start: 'Summer has just begun.',
                        middle: 'It\'s the middle of summer.',
                        end: 'Summer is nearly over.' },
              note: 'Expect the thirstiest plants of the year, and keep the plant food coming.' },
    autumn: { label: 'Autumn', ico: 'fall', growing: false,
              phrase: { start: 'Autumn is just starting.',
                        middle: 'It\'s the middle of autumn.',
                        end: 'Autumn is nearly over.' },
              note: 'Expect the soil to stay damp for longer, so water less often and stop the plant food.' },
    winter: { label: 'Winter', ico: 'snow', growing: false,
              phrase: { start: 'Winter is just starting.',
                        middle: 'It\'s the middle of winter.',
                        end: 'Winter is nearly over.' },
              note: 'Expect very little growth — water sparingly and skip the plant food, because cold wet soil kills more houseplants than anything else.' }
  };

  /* ---------- Pot materials affect drying speed ---------- */
  const POT_MATERIALS = {
    'plastic':   { label: 'Plastic',          dryFactor: 1.0,  note: 'Holds moisture well.' },
    'glazed':    { label: 'Glazed ceramic',   dryFactor: 1.0,  note: 'Holds moisture well.' },
    'terracotta':{ label: 'Terracotta',       dryFactor: 0.78, note: 'Breathes and wicks water away — dries noticeably faster.' },
    'concrete':  { label: 'Concrete',         dryFactor: 0.88, note: 'Slightly porous, dries a little faster.' },
    'metal':     { label: 'Metal',            dryFactor: 1.0,  note: 'Non-porous, but can cook roots in direct sun.' },
    'basket':    { label: 'Basket / fabric',  dryFactor: 0.7,  note: 'Very airy, dries out quickly.' }
  };

  const DRAINAGE = {
    'good':  { label: 'Has drainage holes', factor: 1.0 },
    'none':  { label: 'No drainage holes',  factor: 1.25,
               note: 'Without drainage you must water less and more carefully — there is nowhere for excess water to go.' }
  };

  return {
    LIGHT, ASPECTS, ASPECT_NAMES, aspectProfile, aspectLabel,
    hemisphereFromTimeZone: hemisphereFromTimeZone,
    ROOM_PRESETS, ROOM_ICONS, HUMIDITY, DIFFICULTY, TOX, TASKS, LOG_KINDS,
    season, seasonPhase, SEASON_META, POT_MATERIALS, DRAINAGE
  };
})();
