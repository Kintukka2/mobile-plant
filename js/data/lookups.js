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
    S: 'South', SW: 'South-west', W: 'West', NW: 'North-west'
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
    N:  { light: 'low',             note: 'No direct sun at all. Only the genuinely shade-tolerant will be happy.' }
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
    S:  { light: 'low',             note: 'No direct sun at all. Only the genuinely shade-tolerant will be happy.' }
  };

  function aspectProfile(aspect, hemisphere) {
    const table = hemisphere === 'south' ? ASPECT_SOUTH : ASPECT_NORTH;
    return table[aspect] || null;
  }

  /* ---------- Room presets ---------- */
  const ROOM_PRESETS = [
    { name: 'Living Room' },
    { name: 'Bedroom' },
    { name: 'Kitchen' },
    { name: 'Bathroom' },
    { name: 'Study' },
    { name: 'Hallway' },
    { name: 'Balcony' },
    { name: 'Sunroom' },
    { name: 'Dining Room' },
    { name: 'Entryway' },
    { name: 'Patio' },
    { name: 'Office' }
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

  /* ---------- Toxicity ---------- */
  const TOX = {
    'safe':          { label: 'Pet safe',       pill: 'pill', ico: 'shield' },
    'mild':          { label: 'Mildly toxic',   pill: 'pill-sun', ico: 'warn'   },
    'toxic':         { label: 'Toxic',          pill: 'pill-terra', ico: 'ban'    },
    'very-toxic':    { label: 'Highly toxic',   pill: 'pill-terra-hi', ico: 'skull'  }
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

  const SEASON_META = {
    spring: { label: 'Spring', ico: 'flower', growing: true,
              note: 'Growth is waking up. Start feeding again and expect thirstier plants.' },
    summer: { label: 'Summer', ico: 'sun', growing: true,
              note: 'Peak growing season. Water more often and keep feeding.' },
    autumn: { label: 'Autumn', ico: 'fall', growing: false,
              note: 'Growth is slowing. Ease off the fertiliser and stretch out watering.' },
    winter: { label: 'Winter', ico: 'snow', growing: false,
              note: 'Most plants are resting. Water sparingly and stop feeding — wet, cold soil is the main killer this time of year.' }
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
    LIGHT, ASPECTS, ASPECT_NAMES, aspectProfile,
    ROOM_PRESETS, HUMIDITY, DIFFICULTY, TOX, TASKS, LOG_KINDS,
    season, SEASON_META, POT_MATERIALS, DRAINAGE
  };
})();
