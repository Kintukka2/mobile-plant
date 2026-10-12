/* ==========================================================================
   Sprout — curated plant dataset
   --------------------------------------------------------------------------
   Care figures are species-specific and assume a ~15cm pot in plastic or
   glazed ceramic, in the light level listed as `ideal`. The scheduling engine
   adjusts these for pot size, pot material, drainage, room light and season.

   water.warm  = days between waterings during the growing season
   water.cool  = days between waterings during dormancy
   water.soakPct = fraction of pot volume to apply as water (poured plants
                   only; the other methods are not measured)
   water.method = a key in LOOKUPS.WATER_METHODS; left out means 'pour'.
                  Only a poured plant is given a measured amount.
   water.seasons = optional days per season, { spring, summer, autumn,
                  winter }, for a plant that keeps its own calendar; 0 means
                  it rests and takes no water at all. A season left out
                  falls back to warm or cool.
   fert.never   = true for a plant that must never be fertilised, with
                  fert.note saying why. It is given no feeding task.
   fert.seasons = optional list of the seasons it is fed in, for a plant
                  that grows outside spring and summer (Cyclamen).
   fert.everyDays = days between feeds, growing season only
   prop[].roots   = a bare duration ('3–5 weeks') or a phrase that reads on
                    its own ('Already rooted'). The plant page puts
                    "Roots in" in front of durations only: in front of
                    anything else it printed "Roots in Immediate".

   Toxicity ratings follow ASPCA classifications: 'safe' | 'mild' | 'toxic'
   | 'very-toxic'.
   ========================================================================== */

window.PLANT_DATA = (function () {

  /* Fill in defaults so each record only states what's distinctive. */
  function normalise(p) {
    return Object.assign({
      aka: [],
      family: '',
      origin: '',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 100,
      humidity: 'medium',
      minC: 12,
      idealC: [18, 26],
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite stirred through for drainage.',
      repot: 'Every 2 years in spring, moving up one pot size.',
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid houseplant feed' },
      prop: [],
      seed: null,
      likes: [],
      dislikes: [],
      problems: [],
      tags: []
    }, p);
  }

  const PLANTS = [

    /* ====================== EASY FOLIAGE ====================== */
    {
      id: 'monstera-deliciosa',
      common: 'Monstera',
      aka: ['Swiss Cheese Plant', 'Fruit Salad Plant'],
      botanical: 'Monstera deliciosa',
      family: 'Araceae',
      origin: 'Rainforests of southern Mexico and Panama',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 300,
      water: {
        warm: 8, cool: 14, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3–5cm of soil is dry to your finger. Pour slowly until it runs from the drainage holes, then tip away anything left in the saucer.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Those famous holes only develop in good light. In a dim corner it survives, but produces small, solid, disappointing leaves.'
      },
      humidity: 'medium', minC: 15, idealC: [20, 28],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed, NPK around 20-20-20' },
      soil: 'Chunky and free-draining — two parts potting mix, one part perlite, one part orchid bark.',
      repot: 'Every 2 years in spring. It likes to be a little snug; a pot that is far too big holds wet soil around the roots.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Insoluble calcium oxalate crystals throughout the plant. Chewing causes intense mouth burning, drooling and vomiting — rarely dangerous, but genuinely painful.' },
      prop: [{
        m: 'Stem cutting in water', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Find a node — the slightly swollen band on the stem where a leaf and aerial root emerge. This is essential; a leaf alone will never root.',
          'Cut 2–3cm below the node with clean secateurs, taking one or two leaves with it.',
          'Sit the node in a jar of room-temperature water, keeping the leaves dry.',
          'Change the water every 3–4 days so it stays clear and oxygenated.',
          'Once roots reach 5–8cm, pot into a chunky mix and keep it damp for the first fortnight while it adjusts.'
        ]
      }],
      likes: ['Something to climb — a moss pole or plank will double its leaf size', 'A good soak, then a chance to dry out', 'Warm, bright rooms'],
      dislikes: ['Sitting in water', 'Cold draughts', 'Being moved constantly'],
      problems: ['yellow-lower-leaves', 'brown-crispy-edges', 'no-fenestration', 'leggy-stretching', 'spider-mites', 'root-rot', 'drooping'],
      tags: ['statement', 'climbing', 'fast-growing', 'beginner']
    },

    {
      id: 'epipremnum-aureum',
      common: 'Golden Pothos',
      aka: ['Devil\'s Ivy', 'Money Plant'],
      botanical: 'Epipremnum aureum',
      family: 'Araceae',
      origin: 'French Polynesia, naturalised across the tropics',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 200,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Let the top half of the pot dry out, then water thoroughly. It will wilt dramatically when thirsty and recover within hours — a useful, if theatrical, signal.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'The most shade-tolerant of the popular vines. In low light the golden variegation fades to plain green; move it brighter and it returns.'
      },
      humidity: 'low', minC: 12, idealC: [18, 29],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals. Causes mouth irritation, drooling and vomiting if chewed. Trailing vines are tempting for cats — hang it high.' },
      prop: [
        { m: 'Stem cutting in water', diff: 'easy', season: 'Any time of year', roots: '2–3 weeks',
          steps: [
            'Cut a length of vine with at least four leaves, snipping just below a node.',
            'Strip the lowest one or two leaves so their nodes sit bare.',
            'Stand the bare nodes in water — a glass on a windowsill is plenty.',
            'Roots appear within a fortnight. Pot several cuttings together for a full-looking plant.'
          ] },
        { m: 'Layering', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
          steps: [
            'Stand a small pot of damp potting mix beside the plant.',
            'Lay a trailing vine across it and pin one node to the surface with a bent paperclip, still attached to the parent.',
            'Keep that pot damp. Roots grow from the node into the mix within a few weeks.',
            'Once a gentle tug meets resistance, cut the vine on the parent\'s side of the node. The new plant is already potted.'
          ] }
      ],
      likes: ['Being pruned — it branches and thickens up', 'Almost any light level', 'Neglect, frankly'],
      dislikes: ['Constantly soggy soil', 'Cold windowsills in winter'],
      problems: ['yellow-lower-leaves', 'brown-crispy-edges', 'leggy-stretching', 'variegation-loss', 'root-rot', 'fungus-gnats'],
      tags: ['trailing', 'beginner', 'low-light', 'fast-growing', 'air-purifying']
    },

    {
      id: 'dracaena-trifasciata',
      common: 'Snake Plant',
      aka: ['Mother-in-Law\'s Tongue', 'Sansevieria'],
      botanical: 'Dracaena trifasciata',
      family: 'Asparagaceae',
      origin: 'Dry, rocky West Africa',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 90,
      water: {
        warm: 18, cool: 35, soakPct: 0.2, dryBetween: true,
        note: 'Let the soil dry out completely, then water. When in doubt, wait another week — far more snake plants die of kindness than of thirst.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low', 'direct'], avoid: [],
        note: 'Genuinely tolerates anything from a dim hallway to a sunny sill. It simply grows faster in brighter light.'
      },
      humidity: 'low', minC: 10, idealC: [18, 30],
      fert: { everyDays: 56, strength: 'half', type: 'Cactus and succulent feed' },
      soil: 'Free-draining cactus and succulent mix. Ordinary potting compost holds far too much water.',
      repot: 'Every 3–4 years — it is happy being crowded, and often only needs repotting when it cracks the pot.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Contains saponins. Chewing leads to nausea, vomiting and diarrhoea. Unpleasant rather than dangerous, but worth keeping out of reach.' },
      prop: [
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'Slide the whole plant out of its pot and brush the soil off the rhizomes.',
            'Find a natural split where a cluster of leaves has its own thick rhizome and roots.',
            'Cut or pull it away, making sure your division keeps some roots.',
            'Pot into dry cactus mix and wait a week before the first watering so any cuts can callous over.'
          ] },
        { m: 'Leaf cutting', diff: 'medium', season: 'Spring or summer', roots: '6–10 weeks',
          steps: [
            'Cut a healthy leaf into 5cm sections, noting which end pointed downwards — only that end will root.',
            'Leave the sections on a windowsill for two days until the cut edges dry and seal.',
            'Push them 2cm into damp cactus mix, original bottom edge down.',
            'Be patient. Note that variegated forms lose their yellow edges this way — use division to keep the stripe.'
          ] }
      ],
      likes: ['Being forgotten', 'Tight pots', 'Dry air'],
      dislikes: ['Wet feet', 'Cold below 10°C', 'Rich, moisture-retentive soil'],
      problems: ['root-rot', 'mushy-base', 'leaves-falling-over', 'brown-crispy-edges'],
      tags: ['beginner', 'low-light', 'drought-tolerant', 'air-purifying', 'architectural']
    },

    {
      id: 'zamioculcas-zamiifolia',
      common: 'ZZ Plant',
      aka: ['Zanzibar Gem', 'Eternity Plant'],
      botanical: 'Zamioculcas zamiifolia',
      family: 'Araceae',
      origin: 'Dry grassland and forest floors of eastern Africa',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 90,
      water: {
        warm: 18, cool: 32, soakPct: 0.2, dryBetween: true,
        note: 'Those thick stems are water stores — it is built for drought. Water only when the soil is dry all the way through, and skip it entirely if you are unsure.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'One of the very few plants that genuinely copes with a windowless office under fluorescent light. Direct sun scorches the glossy leaves.'
      },
      humidity: 'low', minC: 12, idealC: [18, 28],
      fert: { everyDays: 56, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Free-draining mix — potting compost with a generous third of perlite or a cactus mix.',
      repot: 'Every 3 years. The rhizomes will eventually push the plant up out of its pot when it is truly ready.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals in every part. The sap can irritate skin — worth wearing gloves when dividing it.' },
      prop: [
        { m: 'Division of rhizomes', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'Unpot and wash enough soil away to see the potato-like rhizomes clearly.',
            'Separate a clump that has both a rhizome and its own stems.',
            'Pot into dry, gritty mix and wait a week before watering.',
            'Leaf cuttings also work but can take the better part of a year to form a rhizome — division is far quicker.'
          ] },
        { m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '6–10 weeks',
          steps: [
            'Pull a few individual leaflets from a stem, or cut a whole stem into sections.',
            'Let the cut ends dry for a day, then push them 1–2cm into damp, gritty mix.',
            'Keep them warm and only barely damp. Roots come first, then a small rhizome forms at each base.',
            'Be patient: the first new shoot can take most of a year to appear.'
          ] }
      ],
      likes: ['Long gaps between waterings', 'Low light', 'Being left alone'],
      dislikes: ['Overwatering — the single most common cause of death', 'Cold, wet soil'],
      problems: ['yellow-lower-leaves', 'root-rot', 'mushy-base', 'leggy-stretching'],
      tags: ['beginner', 'low-light', 'drought-tolerant', 'architectural', 'office']
    },

    {
      id: 'philodendron-hederaceum',
      common: 'Heartleaf Philodendron',
      aka: ['Sweetheart Plant'],
      botanical: 'Philodendron hederaceum',
      family: 'Araceae',
      origin: 'Central America and the Caribbean',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 180,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Keep it lightly moist in summer but never wet. Let the top 3cm dry between waterings.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Softer and faster-growing than pothos in the same spot. Direct sun bleaches the leaves.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 27],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals — mouth burning, drooling and vomiting if chewed.' },
      prop: [{
        m: 'Stem cutting in water', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Snip a vine below a node, keeping three or four leaves.',
          'Remove the lowest leaf and stand that node in water.',
          'Refresh the water twice a week.',
          'Pot up once roots are 4–5cm long.'
        ]
      }],
      likes: ['Regular pinching back to stay bushy', 'Hanging baskets and high shelves', 'Warmth'],
      dislikes: ['Dry, compacted soil', 'Cold draughts'],
      problems: ['yellow-lower-leaves', 'leggy-stretching', 'brown-crispy-edges', 'fungus-gnats', 'root-rot'],
      tags: ['trailing', 'beginner', 'low-light', 'fast-growing']
    },

    {
      id: 'chlorophytum-comosum',
      common: 'Spider Plant',
      aka: ['Ribbon Plant', 'Spider Ivy'],
      botanical: 'Chlorophytum comosum',
      family: 'Asparagaceae',
      origin: 'Coastal South Africa',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 45,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top few centimetres dry out. Sensitive to fluoride and chlorine in tap water — brown leaf tips are usually the cause. Rainwater or water left to stand overnight helps.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Bright indirect light produces the most babies. Direct sun scorches the leaf tips.'
      },
      humidity: 'medium', minC: 8, idealC: [16, 24],
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and one of the safest choices for a home with pets. Cats are oddly drawn to chewing the leaves — mildly stimulating for them, but harmless.' },
      prop: [
        { m: 'Plantlet (spiderette)', diff: 'easy', season: 'Any time of year', roots: '1–2 weeks',
          steps: [
            'Look for a baby plantlet on the end of a long arching stem, ideally one already showing stubby root nubs.',
            'You can either pot the plantlet while still attached to the parent, or snip it free.',
            'Press it into damp potting mix so the base sits just at soil level.',
            'Keep evenly moist for two weeks. If still attached, cut the runner once it has taken hold.'
          ] },
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'Slide a crowded plant out of its pot. The thick white roots will fill most of it.',
            'Pull or cut the clump into two or three pieces, each with its own leaves and a share of roots.',
            'Pot each piece at the depth it grew before, in fresh mix.',
            'Water in and keep it out of direct sun for a week while it settles.'
          ] }
      ],
      likes: ['Being pot-bound — it flowers and pups more freely', 'Hanging baskets', 'Cool rooms'],
      dislikes: ['Fluoridated tap water', 'Hot direct sun', 'Waterlogged roots'],
      problems: ['brown-tips-only', 'pale-washed-out', 'yellow-lower-leaves', 'root-rot'],
      tags: ['trailing', 'beginner', 'pet-safe', 'air-purifying', 'easy-propagation', 'low-light']
    },

    {
      id: 'aspidistra-elatior',
      common: 'Cast Iron Plant',
      aka: ['Bar Room Plant'],
      botanical: 'Aspidistra elatior',
      family: 'Asparagaceae',
      origin: 'Shaded forest floors of Japan and Taiwan',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 12, cool: 24, soakPct: 0.2, dryBetween: true,
        note: 'Water when the top half of the pot is dry. It tolerates a missed month better than a soggy week.'
      },
      light: {
        ideal: 'low', tolerates: ['medium', 'bright-indirect'], avoid: ['direct'],
        note: 'Named for its indestructibility — it thrives in the dark corners where nothing else will. Direct sun bleaches and scorches it badly.'
      },
      humidity: 'low', minC: 5, idealC: [15, 24],
      fert: { everyDays: 56, strength: 'half', type: 'Balanced liquid feed' },
      repot: 'Every 4–5 years. It resents disturbance and sulks for a season afterwards.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around cats and dogs.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Unpot in spring and locate the creeping rhizomes below the soil.',
          'Cut a section carrying at least two or three leaves and its own roots.',
          'Pot up at the same depth and water sparingly until you see new growth.',
          'Expect it to sit still for several months before it settles — this is normal.'
        ]
      }],
      likes: ['Deep shade', 'Cool rooms', 'Being ignored for years'],
      dislikes: ['Direct sun', 'Frequent repotting', 'Overwatering'],
      problems: ['brown-crispy-edges', 'pale-washed-out', 'root-rot', 'spider-mites'],
      tags: ['beginner', 'low-light', 'pet-safe', 'drought-tolerant']
    },

    {
      id: 'aglaonema-commutatum',
      common: 'Chinese Evergreen',
      aka: ['Aglaonema'],
      botanical: 'Aglaonema commutatum',
      family: 'Araceae',
      origin: 'Tropical forest floors of Southeast Asia',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Let the top third dry out before watering again. Pink and red cultivars are slightly thirstier than the plain green forms.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'Dark green varieties handle genuinely low light. The pink, red and silver cultivars need brighter indirect light to keep their colour.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 27],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals causing oral irritation, drooling and vomiting.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Mature plants throw up separate shoots from the base — these are your divisions.',
          'Unpot and tease the root ball apart, keeping roots with each shoot.',
          'Pot individually and keep warm and lightly moist for a fortnight.'
        ]
      }],
      likes: ['Warm, draught-free spots', 'Medium light', 'Consistent routine'],
      dislikes: ['Cold below 15°C — leaves blacken', 'Direct sun', 'Draughty hallways'],
      problems: ['yellow-lower-leaves', 'brown-crispy-edges', 'cold-damage', 'spider-mites', 'root-rot'],
      tags: ['beginner', 'low-light', 'colourful', 'air-purifying']
    },

    {
      id: 'pilea-peperomioides',
      common: 'Chinese Money Plant',
      aka: ['Pancake Plant', 'UFO Plant'],
      botanical: 'Pilea peperomioides',
      family: 'Urticaceae',
      origin: 'Yunnan province, southern China',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 30,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3cm are dry. The leaves droop and go slightly soft when thirsty, and perk up within a few hours of watering.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Rotate the pot a quarter turn each week — it leans hard towards the light and will grow permanently lopsided otherwise.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 25],
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [
        { m: 'Offset pups', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
          steps: [
            'Small pups appear in the soil beside the mother plant, or from the stem itself.',
            'Wait until a pup is 5–7cm tall, then cut it away below soil level with a little root attached.',
            'Pot into damp mix, or root it in water first if it has no roots yet.',
            'A generous mother plant produces pups for years — this is the classic plant to pass on to friends.'
          ] },
        { m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
          steps: [
            'Useful when the main stem has grown tall and bare: cut the top 8–10cm off with clean secateurs.',
            'Stand the cutting in a glass of water, or push it 2cm into damp mix.',
            'Roots appear within a few weeks; pot it once they are 2–3cm long.',
            'The cut stump on the parent often sprouts new shoots of its own.'
          ] }
      ],
      likes: ['Weekly rotation to stay symmetrical', 'Bright indirect light', 'Being divided and shared'],
      dislikes: ['Direct sun', 'Sitting in water', 'Dark corners'],
      problems: ['leaves-curling', 'yellow-lower-leaves', 'leggy-stretching', 'drooping', 'fungus-gnats'],
      tags: ['beginner', 'pet-safe', 'easy-propagation', 'compact']
    },

    {
      id: 'peperomia-obtusifolia',
      common: 'Baby Rubber Plant',
      aka: ['Peperomia'],
      botanical: 'Peperomia obtusifolia',
      family: 'Piperaceae',
      origin: 'Florida, Mexico and the Caribbean',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 30,
      water: {
        warm: 10, cool: 18, soakPct: 0.2, dryBetween: true,
        note: 'Thick, semi-succulent leaves store water, so it needs less than it looks like it should. Let the soil dry most of the way through.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Happy under a grow light or in a north-facing room. Direct sun causes pale, washed-out patches.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      soil: 'Light and airy — potting mix with plenty of perlite, or a peat-free orchid-style blend.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic. One of the best genuinely pet-safe choices.' },
      prop: [{
        m: 'Leaf or stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Take a stem cutting with two or three leaves, or even a single leaf with 2cm of stalk.',
          'Let the cut end dry for an hour, then push it into damp, gritty mix.',
          'Cover loosely with a clear bag to hold humidity, opening it daily for air.',
          'Tug gently after a month — resistance means roots.'
        ]
      }],
      likes: ['Small pots', 'Drying out between drinks', 'Medium to bright indirect light'],
      dislikes: ['Overwatering — it rots quickly', 'Heavy, wet soil', 'Cold'],
      problems: ['root-rot', 'yellow-lower-leaves', 'leaves-falling-off', 'leggy-stretching'],
      tags: ['beginner', 'pet-safe', 'compact', 'office', 'low-light']
    },

    {
      id: 'dracaena-fragrans',
      common: 'Corn Plant',
      aka: ['Mass Cane', 'Happy Plant', 'Dracaena Massangeana'],
      botanical: 'Dracaena fragrans',
      family: 'Asparagaceae',
      origin: 'Forest understorey of tropical Africa',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 180,
      water: {
        warm: 10, cool: 18, soakPct: 0.25, dryBetween: true,
        note: 'Let the top half of the pot dry before watering, then water thoroughly and let it drain. Brown leaf tips usually mean hard or fluoridated tap water; rainwater or filtered water stops them spreading.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'It grows wild in the shade of taller trees, so it copes with a dim corner better than almost any tree-sized plant. In low light the yellow stripe fades; direct sun bleaches and scorches the leaves.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 27],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage, in a heavy pot so the canes stay upright.',
      repot: 'Every 2–3 years in spring. It grows slowly and is happy a little snug.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'safe',
        note: 'Listed by the ASPCA as toxic to cats and dogs. Contains saponins, which cause vomiting, drooling and loss of appetite; cats may also show dilated pupils.' },
      prop: [
        { m: 'Cane cutting', diff: 'easy', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Cut a length of bare cane 10–20cm long, noting which end was uppermost.',
            'Push the lower end 3–4cm into damp potting mix, or stand it in water.',
            'Keep it warm and bright. New shoots break from the side of the cane once it has rooted.',
            'The cut stump on the parent usually sprouts again just below the cut.'
          ] },
        { m: 'Tip cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
          steps: [
            'Cut off the leafy top with 5–10cm of stem below the leaves.',
            'Strip the lowest two or three leaves and stand the stem in water.',
            'Pot it once the roots are 3–5cm long.'
          ] }
      ],
      likes: ['A shady spot', 'Rainwater or filtered water', 'Being left to dry between drinks'],
      dislikes: ['Fluoridated tap water', 'Direct sun', 'Cold draughts'],
      problems: ['tap-water-minerals', 'overwatering', 'brown-tips-only', 'yellow-lower-leaves', 'variegation-loss', 'spider-mites'],
      tags: ['beginner', 'low-light', 'office', 'tree', 'architectural']
    },

    {
      id: 'peperomia-caperata',
      common: 'Ripple Peperomia',
      aka: ['Emerald Ripple', 'Radiator Plant'],
      botanical: 'Peperomia caperata',
      family: 'Piperaceae',
      origin: 'Rainforests of Brazil',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 20,
      water: {
        warm: 9, cool: 16, soakPct: 0.2, dryBetween: true,
        note: 'The thick, crinkled leaves hold water, so let the top half of the pot dry before watering. Water at the soil rather than over the leaves: water caught in the ripples rots them.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Bright filtered light keeps the plant compact and the leaves deeply rippled. It copes with less, growing slowly and a little looser; direct sun scorches the leaves.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Light and very free-draining: two parts potting mix to one part perlite or orchid bark.',
      repot: 'Every 2–3 years. Its roots are small, so move it up only one pot size, into something shallow.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [
        { m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
          steps: [
            'Cut a healthy leaf with 2–3cm of its stalk.',
            'Push the stalk into damp, gritty mix so the leaf stands upright.',
            'Cover loosely with a clear bag and keep it warm and out of direct sun.',
            'New plantlets grow from the base of the stalk in a month or two.'
          ] },
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'Ease a mature plant from its pot and look for separate crowns.',
            'Tease them apart, keeping roots with each crown.',
            'Pot each into a small pot of the same gritty mix and water lightly.'
          ] }
      ],
      likes: ['A small, shallow pot', 'Drying out between drinks', 'Bright filtered light'],
      dislikes: ['Wet soil', 'Water sitting in the leaf ripples', 'Cold windowsills'],
      problems: ['overwatering', 'root-rot', 'drooping', 'limp-leaves', 'mushy-base'],
      tags: ['pet-safe', 'beginner', 'low-light', 'compact', 'patterned']
    },

    {
      id: 'peperomia-argyreia',
      common: 'Watermelon Peperomia',
      aka: ['Watermelon Begonia', 'Peperomia argyreia'],
      botanical: 'Peperomia argyreia',
      family: 'Piperaceae',
      origin: 'Rainforest floor of northern South America, chiefly Brazil',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 20,
      water: {
        warm: 9, cool: 16, soakPct: 0.2, dryBetween: true,
        note: 'The thick leaves and red stalks hold water, so let the top half of the mix dry before watering. Wet soil rots the stalks at the base, where they all meet.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light keeps the silver stripes sharp. In low light the stalks stretch and the pattern fades; direct sun scorches the leaves.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Chunky and quick-draining: potting mix with equal parts perlite and orchid bark.',
      repot: 'Every 2–3 years in spring. Its root system is small and it does best in a small pot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [
        { m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '4–6 weeks',
          steps: [
            'Cut a healthy leaf with 2–3cm of its stalk.',
            'Push the stalk into damp perlite or seed compost. A leaf cut across in half roots too, each half stood cut edge down.',
            'Cover it to hold humidity, and keep it warm and bright, out of sun.',
            'Small plants appear at the base in six to eight weeks.'
          ] },
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'An older plant grows into several crowns.',
            'Unpot it and gently pull the crowns apart, each with its own roots.',
            'Pot each into a small pot of fresh chunky mix.'
          ] }
      ],
      likes: ['Drying out between drinks', 'A small pot', 'Bright indirect light'],
      dislikes: ['Wet soil', 'Direct sun', 'Cold draughts'],
      problems: ['overwatering', 'root-rot', 'mushy-base', 'drooping', 'leggy-stretching', 'variegation-loss', 'mealybugs'],
      tags: ['pet-safe', 'beginner', 'compact', 'patterned', 'office']
    },

    {
      id: 'pilea-cadierei',
      common: 'Aluminium Plant',
      aka: ['Watermelon Pilea', 'Pilea cadierei'],
      botanical: 'Pilea cadierei',
      family: 'Urticaceae',
      origin: 'Limestone hills of southern China and northern Vietnam',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 30,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water once the top 2cm are dry. It wilts quickly when dry and picks up within hours of a drink, but repeated wilting costs it the lower leaves.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light keeps it bushy and the silver markings bright. In shade it grows tall and gappy.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 26],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      repot: 'Every spring. Old plants turn woody and bare at the base, so it is best started again from cuttings every two or three years.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
        steps: [
          'Cut an 8cm shoot tip just below a leaf joint.',
          'Strip the lowest pair of leaves.',
          'Root it in water or push it straight into damp potting mix.',
          'Pot several cuttings together for a bushy plant, and pinch the tips once they grow.'
        ]
      }],
      likes: ['Regular pinching out', 'Bright indirect light', 'Even moisture'],
      dislikes: ['Drying out completely', 'Direct sun', 'Cold'],
      problems: ['leggy-stretching', 'needs-pruning', 'underwatering', 'drooping', 'yellow-lower-leaves', 'spider-mites', 'mealybugs'],
      tags: ['pet-safe', 'beginner', 'compact', 'fast-growing', 'patterned', 'easy-propagation']
    },

    {
      id: 'asparagus-densiflorus',
      common: 'Asparagus Fern',
      aka: ['Sprengeri Fern', 'Emerald Fern', 'Asparagus aethiopicus'],
      botanical: 'Asparagus densiflorus',
      family: 'Asparagaceae',
      origin: 'Coastal scrub and forest margins of South Africa',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 90,
      water: {
        warm: 6, cool: 12, soakPct: 0.3, dryBetween: true,
        note: 'Water when the top few centimetres are dry. Its thick, tuberous roots store water, so it survives a dry spell, but kept bone dry for long it yellows and sheds its needles.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'direct'], avoid: ['low'],
        note: 'Bright light keeps it dense. A little morning sun suits it; hot midday sun yellows the needles.'
      },
      humidity: 'medium', minC: 7, idealC: [13, 24],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced liquid feed' },
      repot: 'Every spring. The tuberous roots fill a pot fast, and can split a plastic one.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs, as Asparagus densiflorus \'Sprengeri\'. The berries cause vomiting, abdominal pain and diarrhoea, and repeated contact with the stems can inflame the skin. It is not a fern.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Wear gloves: the stems carry small hooked spines.',
          'Unpot it and cut the root mass into two or three pieces with a sharp knife, each with stems and tubers.',
          'Pot each piece into fresh mix at the same depth.',
          'Water well and keep it out of sun for a week.'
        ]
      }],
      likes: ['Bright light', 'A roomy pot', 'Regular feeding'],
      dislikes: ['Drying out for weeks', 'Hot midday sun', 'Deep shade'],
      problems: ['yellow-lower-leaves', 'leaves-falling-off', 'underwatering', 'pot-bound', 'low-humidity', 'spider-mites', 'mealybugs'],
      tags: ['beginner', 'trailing', 'fast-growing', 'cool-tolerant']
    },

    /* ====================== STATEMENT FOLIAGE ====================== */
    {
      id: 'ficus-lyrata',
      common: 'Fiddle Leaf Fig',
      aka: ['Fiddleleaf', 'Banjo Fig'],
      botanical: 'Ficus lyrata',
      family: 'Moraceae',
      origin: 'Lowland rainforests of western Africa',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 250,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Water thoroughly only when the top 5cm are properly dry — push a finger right in to check. It hates both extremes, and inconsistency is what causes leaf drop.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'Needs genuinely bright light — right beside a large window. It is famously dramatic about being moved, so find the right spot and then leave it there.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 27],
      fert: { everyDays: 21, strength: 'half', type: 'High-nitrogen feed to support big leaves' },
      soil: 'Well-draining and slightly chunky — potting mix with perlite and a little bark.',
      repot: 'Every 2 years in spring. Dust the leaves monthly; large flat leaves collect a surprising amount.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'The milky sap contains ficin and psoralen — irritating to skin and mouth, causing drooling and vomiting if chewed.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Late spring or early summer', roots: '6–10 weeks',
        steps: [
          'Take a cutting 20–25cm long with two or three leaves, cutting just below a node.',
          'Rinse the cut end to stop the milky sap sealing it over, then let it dry for 20 minutes.',
          'Stand in water in a bright, warm spot, or pot into damp mix with rooting hormone.',
          'Change the water weekly. Roots are slow — do not give up before two months.'
        ]
      }],
      likes: ['One bright spot it can stay in permanently', 'Rotating a quarter turn monthly', 'Warm, stable rooms'],
      dislikes: ['Being moved', 'Draughts from doors and air conditioning', 'Cold water straight from the tap', 'Erratic watering'],
      problems: ['brown-spots-leaves', 'leaves-falling-off', 'leaf-drop-sudden', 'brown-crispy-edges', 'spider-mites', 'root-rot', 'leaning'],
      tags: ['statement', 'tree', 'tricky', 'large']
    },

    {
      id: 'ficus-elastica',
      common: 'Rubber Plant',
      aka: ['Rubber Fig', 'Rubber Tree'],
      botanical: 'Ficus elastica',
      family: 'Moraceae',
      origin: 'Southeast Asia and the eastern Himalayas',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 200,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Let the top third of the pot dry out. Considerably more forgiving than its fiddle leaf cousin.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'direct'], avoid: ['low'],
        note: 'Variegated forms such as Tineke and Ruby need brighter light than the plain burgundy types to hold their colour.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 28],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Milky latex sap irritates skin and mouth. Wipe up drips after pruning — pets lick floors.' },
      prop: [
        { m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Cut a stem tip 15cm long with two or three leaves.',
            'Blot the sap with a damp cloth until it stops running.',
            'Remove the lowest leaf and pot into damp, gritty mix.',
            'Tent loosely with a clear bag to keep humidity up while it roots.'
          ] },
        { m: 'Air layering', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Choose a stem where you want the new plant to start, and make a shallow upward cut about 3cm long just below a node.',
            'Wedge the cut open with a matchstick. The white sap is an irritant, so wear gloves.',
            'Wrap a handful of damp sphagnum moss around the cut, then cover it tightly with cling film tied at both ends.',
            'Keep the moss damp. When roots fill it, cut the stem below the moss and pot the top, moss and all.'
          ] }
      ],
      likes: ['Monthly leaf dusting — it breathes through those big glossy leaves', 'Being pruned to branch out', 'Bright light'],
      dislikes: ['Cold draughts', 'Soggy soil', 'Sudden moves to darker rooms'],
      problems: ['leaves-falling-off', 'yellow-lower-leaves', 'brown-spots-leaves', 'leggy-stretching', 'scale', 'root-rot'],
      tags: ['statement', 'tree', 'beginner', 'air-purifying']
    },

    {
      id: 'strelitzia-nicolai',
      common: 'Bird of Paradise',
      aka: ['Giant White Bird of Paradise', 'Wild Banana'],
      botanical: 'Strelitzia nicolai',
      family: 'Strelitziaceae',
      origin: 'Coastal thickets of eastern South Africa',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 250,
      water: {
        warm: 8, cool: 14, soakPct: 0.3, dryBetween: true,
        note: 'A big plant with a big thirst in summer. Water deeply when the top 5cm dry out, then let it drain completely.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'One of the few houseplants that genuinely wants hours of direct sun. In dim light it produces sparse, floppy leaves and will never flower.'
      },
      humidity: 'medium', minC: 13, idealC: [20, 30],
      fert: { everyDays: 21, strength: 'full', type: 'Balanced feed, high potassium in summer to encourage flowering' },
      soil: 'Rich but free-draining — good potting mix with perlite and a little composted bark.',
      repot: 'Every 2–3 years. It flowers better when slightly root-bound, so resist over-potting.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'The seeds and fruit contain toxins that cause vomiting and drowsiness. The leaves are far less of a concern than the seed pods.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Already rooted',
        steps: [
          'This is a physical job — a mature plant has a dense, woody rhizome.',
          'Unpot and identify a fan of leaves with its own roots at the base.',
          'Cut cleanly through the rhizome with a sharp, sterilised knife.',
          'Pot the division and keep it slightly dry for two weeks so the wound can seal rather than rot.',
          'Expect a full season of sulking before new growth appears.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Spring, indoors in warmth', germDays: '1–3 months', depthMm: 15,
        steps: [
          'Pull the fluffy tuft off each seed, then soak the seeds in warm water for two days.',
          'Sow each one about 1.5cm deep in a small pot of damp seed compost.',
          'Keep it at 25°C or above. A heated propagator or a warm spot above a radiator helps a great deal.',
          'Keep the compost damp but not wet, and be patient: some seeds take three months.',
          'Pot on once the second leaf opens. A plant from seed takes five years or more to flower.'
        ]
      },
      likes: ['All the sun you can give it', 'Deep watering then good drainage', 'Being slightly pot-bound'],
      dislikes: ['Dark corners', 'Cold below 13°C', 'Constant repotting'],
      problems: ['leaves-curling', 'brown-crispy-edges', 'no-flowers', 'spider-mites', 'yellow-lower-leaves', 'leaf-splitting'],
      tags: ['statement', 'large', 'sun-lover', 'architectural']
    },

    {
      id: 'monstera-adansonii',
      common: 'Swiss Cheese Vine',
      aka: ['Monkey Mask', 'Adansonii'],
      botanical: 'Monstera adansonii',
      family: 'Araceae',
      origin: 'Central and South American rainforests',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 150,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Thinner leaves than its big cousin mean it dries out faster and wilts sooner. Keep it lightly moist through summer.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Unlike deliciosa, this one is born with holes. Bright indirect light keeps the internodes short and the vine full.'
      },
      humidity: 'high', minC: 15, idealC: [20, 28],
      soil: 'Chunky and airy — two parts potting mix to one part each of perlite and orchid bark.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals — oral burning, drooling and vomiting if chewed.' },
      prop: [{
        m: 'Stem cutting in water', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Cut the vine just below a node — you can take several cuttings from one long vine.',
          'Each cutting needs at least one node and one leaf.',
          'Root in water, changing it every few days.',
          'Plant three or four rooted cuttings in one pot for a lush, full result.'
        ]
      }],
      likes: ['Trailing from a shelf or climbing a small pole', 'Humidity', 'Regular pruning'],
      dislikes: ['Dry air — it browns at the edges', 'Drying out completely', 'Direct sun'],
      problems: ['brown-crispy-edges', 'yellow-lower-leaves', 'leggy-stretching', 'spider-mites', 'drooping'],
      tags: ['trailing', 'climbing', 'fast-growing', 'beginner', 'humidity-lover']
    },

    {
      id: 'alocasia-amazonica',
      common: 'African Mask Plant',
      aka: ['Alocasia Polly', 'Elephant Ear'],
      botanical: 'Alocasia × amazonica',
      family: 'Araceae',
      origin: 'A garden hybrid, its parents from Southeast Asia',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 60,
      water: {
        warm: 5, cool: 10, soakPct: 0.25, dryBetween: false,
        note: 'Wants to stay evenly moist but never sodden — the hardest balance in houseplant care. Let only the top 2cm dry between waterings.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright but filtered. Direct sun burns straight through those thin, dramatic leaves.'
      },
      humidity: 'high', minC: 16, idealC: [20, 28],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Very airy and fast-draining — coco coir or peat with plenty of perlite and bark.',
      repot: 'Annually in spring. Check for corms while you are in there — they are free plants.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'High concentration of calcium oxalate crystals. Among the more severe of the common houseplants — significant mouth swelling and pain if chewed.' },
      prop: [{
        m: 'Corm division', diff: 'medium', season: 'Spring', roots: '4–8 weeks',
        steps: [
          'When repotting, look for small round corms — like tiny bulbs — clinging to the roots.',
          'Twist them off gently. Peel the brown papery skin from each one.',
          'Sit each corm on damp sphagnum moss in a covered container, pointed end up and half exposed.',
          'Keep warm and humid. A root and then a tiny leaf will appear over several weeks.',
          'Pot into airy mix once the first leaf has properly opened.'
        ]
      }],
      likes: ['High humidity — 60% or more', 'Warmth and stability', 'Bright filtered light'],
      dislikes: ['Dry air', 'Cold', 'Drying out fully', 'Sitting wet'],
      problems: ['brown-crispy-edges', 'drooping', 'spider-mites', 'yellow-lower-leaves', 'dormancy-dieback', 'root-rot'],
      tags: ['dramatic', 'tricky', 'humidity-lover', 'colourful']
    },

    {
      id: 'schefflera-arboricola',
      common: 'Umbrella Plant',
      aka: ['Dwarf Umbrella Tree', 'Schefflera'],
      botanical: 'Schefflera arboricola',
      family: 'Araliaceae',
      origin: 'Taiwan and Hainan',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 180,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Let the top third dry out. Drops leaves in protest if kept too wet for too long.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Good light keeps it compact. In dim rooms it stretches into a leggy, sparse thing that leans towards the window.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals causing oral irritation, drooling and vomiting.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–6 weeks',
        steps: [
          'Take a 12–15cm stem tip cutting just below a node.',
          'Strip the lower leaves and dip the cut end in rooting hormone.',
          'Pot into damp mix and tent with a clear bag.',
          'Keep warm and out of direct sun until new growth shows.'
        ]
      }],
      likes: ['Hard pruning — it responds by branching thickly', 'Bright light', 'Regular rotation'],
      dislikes: ['Overwatering', 'Cold draughts', 'Low light'],
      problems: ['leaves-falling-off', 'leggy-stretching', 'scale', 'spider-mites', 'yellow-lower-leaves'],
      tags: ['tree', 'beginner', 'fast-growing', 'air-purifying']
    },

    {
      id: 'dracaena-marginata',
      common: 'Dragon Tree',
      aka: ['Madagascar Dragon Tree'],
      botanical: 'Dracaena marginata',
      family: 'Asparagaceae',
      origin: 'Madagascar',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 180,
      water: {
        warm: 12, cool: 21, soakPct: 0.2, dryBetween: true,
        note: 'Let at least the top half dry out. Very sensitive to fluoride in tap water — use rainwater or filtered water if your tips keep browning.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Copes with medium light, though growth slows to a crawl. Direct sun bleaches the red leaf margins.'
      },
      humidity: 'low', minC: 13, idealC: [18, 26],
      fert: { everyDays: 56, strength: 'half', type: 'Balanced liquid feed, fluoride-free' },
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'safe',
        note: 'Saponins cause vomiting, drooling and dilated pupils in cats. Common enough in vet clinics that it is worth siting carefully.' },
      prop: [{
        m: 'Cane cutting', diff: 'easy', season: 'Spring or summer', roots: '3–6 weeks',
        steps: [
          'Cut the woody cane wherever you like — the parent will resprout below the cut, usually with two or three new heads.',
          'Cut the removed top into sections, keeping track of which end was up.',
          'Root the leafy top in water or damp mix.',
          'Bare cane sections will also sprout if laid half-buried in damp mix, right way up.'
        ]
      }],
      likes: ['Filtered or rainwater', 'Drying out between waterings', 'Being cut back to branch'],
      dislikes: ['Fluoridated water', 'Overwatering', 'Cold draughts'],
      problems: ['brown-tips-only', 'yellow-lower-leaves', 'root-rot', 'spider-mites', 'leaning'],
      tags: ['tree', 'beginner', 'architectural', 'drought-tolerant', 'air-purifying', 'low-light']
    },

    {
      id: 'codiaeum-variegatum',
      common: 'Croton',
      aka: ['Joseph\'s Coat', 'Variegated Croton'],
      botanical: 'Codiaeum variegatum',
      family: 'Euphorbiaceae',
      origin: 'Indonesia, Malaysia and the Pacific islands',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 120,
      water: {
        warm: 6, cool: 12, soakPct: 0.25, dryBetween: false,
        note: 'Keep evenly moist through summer — it drops leaves if it dries out fully, and again if it sits wet. Water when the top 2cm are dry.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'The wild reds, oranges and yellows are entirely light-dependent. Anything less than very bright light and it reverts to plain green.'
      },
      humidity: 'high', minC: 16, idealC: [20, 29],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced feed' },
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'Euphorbia-family latex sap — irritating to skin, eyes and mouth. Causes burning, vomiting and, in quantity, bloody diarrhoea. Handle with gloves.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Late spring', roots: '4–6 weeks',
        steps: [
          'Wearing gloves, take a 10–12cm tip cutting.',
          'Rinse the sap from the cut end and let it dry briefly.',
          'Dip in rooting hormone and pot into damp mix.',
          'High humidity is essential — tent it and keep it at 21°C or above.'
        ]
      }],
      likes: ['Bright light for maximum colour', 'High humidity', 'Consistent moisture'],
      dislikes: ['Being moved — it drops leaves', 'Cold draughts', 'Dry air', 'Drying out'],
      problems: ['leaves-falling-off', 'variegation-loss', 'spider-mites', 'brown-crispy-edges', 'leaf-drop-sudden'],
      tags: ['colourful', 'tricky', 'sun-lover', 'dramatic', 'humidity-lover']
    },

    {
      id: 'dieffenbachia-seguine',
      common: 'Dumb Cane',
      aka: ['Dieffenbachia', 'Leopard Lily'],
      botanical: 'Dieffenbachia seguine',
      family: 'Araceae',
      origin: 'Rainforests of the Caribbean and tropical Central and South America',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 120,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3cm of soil is dry, thoroughly, then let it drain. Lower leaves yellow and drop when it is kept too wet or too cold.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Bright indirect light keeps the cream markings strong. It copes with medium and low light, growing more slowly and greener; direct sun scorches the leaves.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage.',
      repot: 'Every 2 years in spring, moving up one pot size. Wear gloves: the sap is an irritant.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'Listed by the ASPCA as toxic to cats and dogs. Insoluble calcium oxalate crystals cause intense burning and swelling of the mouth, tongue and throat; the common name comes from the swelling that stops speech. In people, swelling of the throat needs medical attention. Wear gloves when cutting it.' },
      prop: [
        { m: 'Cane cutting', diff: 'easy', season: 'Spring or summer', roots: '4–6 weeks',
          steps: [
            'Wearing gloves, cut a bare length of stem into pieces 5–8cm long, each with at least one node.',
            'Lay them on their sides half buried in damp potting mix, buds facing up.',
            'Keep them warm and bright. Roots and a new shoot grow from the nodes.',
            'Wash the knife afterwards; the sap irritates skin and eyes.'
          ] },
        { m: 'Tip cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
          steps: [
            'Cut the top 15cm off a leggy plant, below a node.',
            'Remove the lowest leaves and stand the stem in water.',
            'Pot it once the roots are 3–5cm long. The stump left behind usually resprouts.'
          ] }
      ],
      likes: ['Warmth', 'Bright indirect light', 'Drying a little between drinks'],
      dislikes: ['Cold below 15°C', 'Wet soil', 'Direct sun'],
      problems: ['overwatering', 'cold-damage', 'yellow-lower-leaves', 'leaves-falling-off', 'root-rot', 'spider-mites'],
      tags: ['beginner', 'low-light', 'statement', 'patterned']
    },

    {
      id: 'ficus-benjamina',
      common: 'Weeping Fig',
      aka: ['Benjamin Fig', 'Ficus Tree', 'Weeping Ficus'],
      botanical: 'Ficus benjamina',
      family: 'Moraceae',
      origin: 'Forests from southern Asia to northern Australia',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 200,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3–5cm of soil is dry, thoroughly, then let it drain. It drops leaves when it is kept either soggy or dry, so a steady routine matters more than the exact amount.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light, including some direct sun, keeps it dense. Find it a spot and leave it there: moving it, even to a better spot, is the commonest cause of sudden leaf drop.'
      },
      humidity: 'medium', minC: 13, idealC: [16, 26],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage.',
      repot: 'Every 2–3 years in spring. It drops leaves after repotting, so do it only when the roots fill the pot.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs. The milky sap irritates the mouth, stomach and skin. People with a latex allergy can react to it too.' },
      prop: [
        { m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Cut a 10–15cm tip from a firm, leafy stem.',
            'Rinse the milky sap from the cut, then remove the lowest leaves.',
            'Push it into damp, gritty mix and cover loosely with a clear bag.',
            'Keep it warm and out of direct sun until new leaves appear.'
          ] },
        { m: 'Air layering', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Make a shallow upward cut 3cm long into a stem, just below a node, and wedge it open.',
            'Wrap damp sphagnum moss around the cut and seal it in cling film tied at both ends.',
            'Keep the moss damp. When roots fill it, cut the stem below the moss and pot the top.'
          ] }
      ],
      likes: ['Staying in one place', 'Bright light with a little sun', 'A steady watering routine'],
      dislikes: ['Being moved', 'Cold draughts', 'Sudden changes'],
      problems: ['transplant-shock', 'draughts', 'leaf-drop-sudden', 'leaves-falling-off', 'scale', 'spider-mites'],
      tags: ['tree', 'statement']
    },

    {
      id: 'alocasia-zebrina',
      common: 'Alocasia Zebrina',
      aka: ['Zebra Alocasia', 'Tiger Alocasia'],
      botanical: 'Alocasia zebrina',
      family: 'Araceae',
      origin: 'Rainforests of the Philippines',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 90,
      water: {
        warm: 6, cool: 12, soakPct: 0.25, dryBetween: false,
        note: 'Keep the soil lightly moist in summer, watering when the top 2–3cm is dry. Water much less in winter: it slows down and may drop leaves, and wet soil around a resting corm rots it.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright filtered light. The striped stems lean hard towards the window, so turn the pot each week. Direct sun scorches the thin leaves.'
      },
      humidity: 'high', minC: 15, idealC: [20, 28],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Chunky and free-draining: potting mix with orchid bark and perlite in roughly equal parts.',
      repot: 'Every 1–2 years in spring. Look for small corms in the root ball while it is out.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'The ASPCA lists every Alocasia as toxic to cats and dogs. Insoluble calcium oxalate crystals cause intense mouth pain, drooling, swelling and vomiting. Wear gloves when dividing it.' },
      prop: [{
        m: 'Division or corms', diff: 'medium', season: 'Spring', roots: '4–8 weeks',
        steps: [
          'Unpot it in spring and look for offsets and for small round corms among the roots.',
          'Cut away an offset with its own roots and pot it straight into damp, chunky mix.',
          'Half bury the corms in damp sphagnum or perlite in a covered tub, in a warm spot.',
          'Pot each corm on once it has a leaf and a few centimetres of root.'
        ]
      }],
      likes: ['Warmth and humidity', 'Bright filtered light', 'A chunky, airy mix'],
      dislikes: ['Cold', 'Wet soil in winter', 'Dry air'],
      problems: ['dormancy', 'spider-mites', 'overwatering', 'dormancy-dieback', 'yellow-lower-leaves', 'drooping'],
      tags: ['statement', 'humidity-lover', 'patterned', 'tricky', 'dramatic']
    },

    {
      id: 'dypsis-lutescens',
      common: 'Areca Palm',
      aka: ['Butterfly Palm', 'Golden Cane Palm', 'Yellow Palm'],
      botanical: 'Dypsis lutescens',
      family: 'Arecaceae',
      origin: 'Forests of Madagascar',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 200,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3cm is dry, then let it drain completely. Rainwater or filtered water helps: salts and fluoride in tap water brown the frond tips.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light. Direct sun yellows the fronds; in low light it thins out and stops making new canes.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'half', type: 'Palm feed, or a balanced feed with magnesium' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage.',
      repot: 'Every 2–3 years. It likes to be snug, and its roots are brittle, so handle the root ball gently.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Shop plants are several seedlings grown together, so a large clump can be split.',
          'Unpot it and gently pull or cut the root ball into two or three sections, each with several canes.',
          'Pot each section at its old depth and keep it out of direct sun while it settles.',
          'Expect a few fronds to brown afterwards; the palm resents root disturbance.'
        ]
      }],
      likes: ['Bright indirect light', 'Rainwater', 'A snug pot'],
      dislikes: ['Direct sun', 'Dry air', 'Hard tap water'],
      problems: ['low-humidity', 'spider-mites', 'tap-water-minerals', 'brown-tips-only', 'yellow-lower-leaves', 'frond-dieback'],
      tags: ['pet-safe', 'palm', 'statement', 'large']
    },

    {
      id: 'pachira-aquatica',
      common: 'Money Tree',
      aka: ['Pachira', 'Guiana Chestnut', 'Malabar Chestnut'],
      botanical: 'Pachira aquatica',
      family: 'Malvaceae',
      origin: 'Freshwater swamps and riverbanks from southern Mexico to northern Brazil',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 180,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Water thoroughly once the top half of the mix is dry, then empty the saucer. The swollen base of the trunk stores water, so it forgives a missed week far better than a pot that never dries.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'direct'], avoid: ['low'],
        note: 'Bright indirect light, with a little morning sun if you have it. Turn it a quarter every few weeks: it leans hard towards the window.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Free-draining potting mix with a third part perlite or fine bark.',
      repot: 'Every 2–3 years in spring. A snug pot keeps it compact and the braided trunks steady.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Cut a 15cm green shoot just below a leaf joint.',
          'Remove the lower leaves and dip the cut end in rooting powder.',
          'Push it into damp perlite and potting mix, and cover it with a clear bag.',
          'Keep it warm and bright, out of direct sun. A cutting grows a plain stem; the braided trunk is several young plants twisted together.'
        ]
      }],
      likes: ['Drying out between drinks', 'Bright light', 'Being turned now and then'],
      dislikes: ['A wet pot', 'Being moved about', 'Cold draughts'],
      problems: ['overwatering', 'root-rot', 'yellow-lower-leaves', 'leaf-drop-sudden', 'leaning', 'needs-rotation', 'spider-mites'],
      tags: ['pet-safe', 'beginner', 'tree', 'statement']
    },

    {
      id: 'yucca-elephantipes',
      common: 'Spineless Yucca',
      aka: ['Yucca', 'Yucca elephantipes', 'Giant Yucca'],
      botanical: 'Yucca gigantea',
      family: 'Asparagaceae',
      origin: 'Dry hillsides and scrub of southern Mexico and Central America',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 200,
      water: {
        warm: 12, cool: 24, soakPct: 0.25, dryBetween: true,
        note: 'Let the top half of the pot dry before watering, and in winter let it dry almost completely. Too much water rots the cane from the base long before the leaves show it.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect', 'medium'], avoid: ['low'],
        note: 'Full sun or the brightest window you have. It survives medium light, but grows thin, pale and floppy and leans hard towards the glass.'
      },
      humidity: 'low', minC: 7, idealC: [15, 28],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Free-draining: two parts potting mix to one part grit or perlite.',
      repot: 'Every 2–3 years in spring, into a heavy pot only one size larger, so the tall canes cannot tip it over.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'safe',
        note: 'Listed by the ASPCA as toxic to cats and dogs (Yucca species). It contains saponins, which cause vomiting. The leaf tips are stiff and sharp, which matters more around a small child than the chemistry does.' },
      prop: [{
        m: 'Cane cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Saw a length of cane at least 20cm long from a tall plant. The stump left behind sprouts again.',
          'Mark which end is the top: a cane potted upside down never roots.',
          'Let the cut ends dry for a day, then push the bottom end 5cm into gritty mix.',
          'Keep it barely damp and bright. New shoots break from the sides of the cane once it has rooted.'
        ]
      }],
      likes: ['Full sun', 'Drying out', 'A heavy pot'],
      dislikes: ['A wet pot in winter', 'Shade', 'Being overpotted'],
      problems: ['overwatering', 'root-rot', 'mushy-base', 'brown-tips-only', 'yellow-lower-leaves', 'leaning', 'too-little-light', 'scale'],
      tags: ['sun-lover', 'beginner', 'tree', 'statement', 'architectural', 'drought-tolerant']
    },

    {
      id: 'philodendron-bipinnatifidum',
      common: 'Tree Philodendron',
      aka: ['Philodendron selloum', 'Lacy Tree Philodendron', 'Split-leaf Philodendron', 'Hope Philodendron'],
      botanical: 'Thaumatophyllum bipinnatifidum',
      family: 'Araceae',
      origin: 'Forests and swamps of south-eastern Brazil, Paraguay and northern Argentina',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 150,
      water: {
        warm: 7, cool: 14, soakPct: 0.25, dryBetween: true,
        note: 'Water thoroughly once the top 3–5cm are dry, and let the pot drain. The thick aerial roots it sends over the rim can be tucked into the soil or left to hang.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'direct'], avoid: ['low'],
        note: 'Bright indirect light grows the deeply cut leaves. It takes some direct morning sun; in medium light new leaves come smaller and less divided.'
      },
      humidity: 'medium', minC: 10, idealC: [18, 28],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Chunky and free-draining: potting mix with orchid bark and perlite.',
      repot: 'Every 2 years in spring. It grows wider than it grows tall, so give it floor space as well as a bigger pot.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs, under the name Philodendron selloum. Insoluble calcium oxalates cause oral pain, drooling, vomiting and difficulty swallowing.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'An older plant often grows a side shoot from its trunk. Cut it away with a length of trunk and any aerial roots.',
          'Let the cut dry for a few hours.',
          'Pot it into damp chunky mix, burying the aerial roots.',
          'Keep it warm and bright, out of direct sun, and stake it until it stands by itself.'
        ]
      }],
      likes: ['Room to spread', 'Bright light', 'Drying out a little between drinks'],
      dislikes: ['Low light', 'Cold below 10°C', 'A soggy pot'],
      problems: ['yellow-lower-leaves', 'overwatering', 'root-rot', 'too-little-light', 'brown-crispy-edges', 'leaning', 'spider-mites', 'mealybugs'],
      tags: ['beginner', 'statement', 'large', 'architectural']
    },

    {
      id: 'cycas-revoluta',
      common: 'Sago Palm',
      aka: ['King Sago', 'Japanese Sago Palm', 'Cycad'],
      botanical: 'Cycas revoluta',
      family: 'Cycadaceae',
      origin: 'Coastal scrub and cliffs of southern Japan and the Ryukyu Islands',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 120,
      water: {
        warm: 14, cool: 28, soakPct: 0.25, dryBetween: true,
        note: 'Let the pot dry halfway down before watering, and keep water out of the crown at the centre, where it rots. In winter it barely drinks.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light, with some direct sun. It puts out one flush of new fronds a year, all at once: turn it then, because fronds that grow towards the window stay lopsided for years.'
      },
      humidity: 'medium', minC: 7, idealC: [15, 27],
      fert: { everyDays: 42, strength: 'half', type: 'Palm feed with magnesium and manganese, only while new fronds are growing' },
      soil: 'Gritty and fast-draining: cactus mix with extra bark.',
      repot: 'Every 3–4 years in spring. It grows very slowly and dislikes having its roots disturbed.',
      tox: { cats: 'very-toxic', dogs: 'very-toxic', humans: 'toxic',
        note: 'Listed by the ASPCA as toxic to cats and dogs. Every part contains cycasin, and the seeds the most: a few seeds can be fatal. It causes vomiting, black tarry stools, jaundice, bruising and liver failure, and is one of the most dangerous plants a dog can chew. It is not a palm, despite the name. Keep it entirely out of reach, or choose another plant.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'medium', season: 'Spring', roots: '3–6 months',
        steps: [
          'Older plants grow small offsets, called pups, around the base of the trunk.',
          'Wear gloves. Twist or cut a pup away and pull off its leaves.',
          'Let the wound dry for a week, then set it half-buried in gritty mix.',
          'Water sparingly. Roots take months to form, and the first fronds longer still.'
        ]
      }],
      likes: ['Bright light', 'Drying out between drinks', 'Being left alone'],
      dislikes: ['Water in the crown', 'A wet pot in winter', 'Root disturbance'],
      problems: ['yellow-lower-leaves', 'overwatering', 'root-rot', 'crown-rot', 'nutrient-deficiency', 'scale', 'mealybugs'],
      tags: ['beginner', 'statement', 'architectural', 'drought-tolerant']
    },

    {
      id: 'begonia-rex',
      common: 'Rex Begonia',
      aka: ['Painted-leaf Begonia', 'King Begonia', 'Begonia rex-cultorum'],
      botanical: 'Begonia rex hybrids',
      family: 'Begoniaceae',
      origin: 'Hybrids of Begonia rex, from the forest floor of north-east India and the eastern Himalaya',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 40,
      water: {
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: true,
        note: 'Let the top 2cm dry, then water at the soil, never over the leaves. It sits on a shallow rhizome that rots in a wet pot, so err on the dry side.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light keeps the colours deep. Direct sun burns the thin leaves within an afternoon.'
      },
      humidity: 'high', minC: 15, idealC: [18, 24],
      fert: { everyDays: 14, strength: 'quarter', type: 'Balanced liquid feed' },
      soil: 'Light and open: peat-free compost with perlite and a little bark.',
      repot: 'Every spring, into a wide, shallow pot. The rhizome creeps sideways rather than down.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs (Begonia species). Soluble calcium oxalates cause vomiting and drooling; the underground rhizome is the most toxic part.' },
      prop: [
        { m: 'Leaf vein cutting', diff: 'medium', season: 'Spring or summer', roots: '4–6 weeks',
          steps: [
            'Take a healthy mature leaf and turn it face down.',
            'With a clean blade, make short cuts across several of the main veins.',
            'Lay it face up on damp seed compost and pin it down so the cuts touch the surface.',
            'Cover the tray and keep it warm and bright, out of sun. Small plants form where the veins were cut.'
          ] },
        { m: 'Rhizome division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'Unpot the plant and find where the rhizome branches.',
            'Cut it into pieces, each with leaves and roots of its own.',
            'Pot each piece at the same depth it was growing.',
            'Water lightly until new leaves appear.'
          ] }
      ],
      likes: ['Humid, moving air', 'Bright indirect light', 'Water at the soil'],
      dislikes: ['Wet leaves', 'Direct sun', 'Cold draughts', 'A soggy pot'],
      problems: ['powdery-mildew', 'low-humidity', 'brown-crispy-edges', 'leaves-curling', 'overwatering', 'root-rot', 'mealybugs'],
      tags: ['colourful', 'patterned', 'humidity-lover', 'dramatic']
    },

    {
      id: 'caladium-bicolor',
      common: 'Caladium',
      aka: ['Angel Wings', 'Heart of Jesus', 'Fancy-leaf Caladium', 'Caladium hortulanum'],
      botanical: 'Caladium bicolor',
      family: 'Araceae',
      origin: 'Forest edges and riverbanks of tropical South America',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 45,
      water: {
        warm: 5, cool: 12, soakPct: 0.25, dryBetween: false,
        seasons: { spring: 7, summer: 5, autumn: 12, winter: 0 },
        note: 'It grows from a tuber and keeps its own calendar. In spring, water lightly to wake it, then more as the leaves unfurl, keeping the mix evenly moist through summer but never soggy. In autumn the leaves yellow and flop: water less as they go. Through winter it rests and gets none, the dry tuber left in its pot somewhere warm, at 15°C or more.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light. The thin, papery leaves scorch in direct sun and turn mostly green in shade.'
      },
      humidity: 'high', minC: 15, idealC: [21, 30],
      fert: { everyDays: 14, strength: 'half', type: 'Balanced liquid feed while it is in leaf' },
      soil: 'Rich, light and moisture-holding: peat-free compost with a little perlite.',
      repot: 'Each spring, when the rested tuber goes into fresh mix, knobbly side up and about 5cm deep.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs, under the name Caladium hortulanum. Insoluble calcium oxalates cause pain and swelling of the mouth, tongue and lips, drooling, vomiting and difficulty swallowing.' },
      prop: [{
        m: 'Tuber division', diff: 'medium', season: 'Spring', roots: '3–6 weeks',
        steps: [
          'In spring, before replanting, look for a large tuber with several growing eyes.',
          'Cut it into pieces with a clean knife, each with at least one eye.',
          'Leave the cut faces to dry for a day or two.',
          'Plant each knobbly side up in warm, barely damp mix and keep it at 21°C or more until shoots appear.'
        ]
      }],
      likes: ['Warmth', 'Humid air', 'A dry winter rest'],
      dislikes: ['Cold below 15°C', 'Direct sun', 'Water while it rests'],
      problems: ['dormancy', 'dormancy-dieback', 'too-much-light', 'low-humidity', 'brown-crispy-edges', 'root-rot'],
      tags: ['colourful', 'patterned', 'humidity-lover', 'dramatic']
    },

    /* ====================== FERNS & HUMIDITY LOVERS ====================== */
    {
      id: 'nephrolepis-exaltata',
      common: 'Boston Fern',
      aka: ['Sword Fern'],
      botanical: 'Nephrolepis exaltata',
      family: 'Nephrolepidaceae',
      origin: 'Humid forests of tropical America',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 60,
      water: {
        warm: 4, cool: 7, soakPct: 0.3, dryBetween: false,
        note: 'Never let it dry out — dry soil means instant crispy fronds that will not recover. Keep the mix consistently damp, like a wrung-out sponge.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Dappled light, as it would get on a forest floor. Direct sun crisps the fronds within days.'
      },
      humidity: 'high', minC: 13, idealC: [16, 24],
      fert: { everyDays: 28, strength: 'quarter', type: 'Weak balanced feed — ferns burn easily' },
      soil: 'Moisture-retentive but airy — peat-free compost with coco coir and a little perlite.',
      repot: 'Annually in spring; it fills a pot quickly with dense roots.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Completely non-toxic and one of the best choices for homes with cats and dogs.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Unpot and look for natural clumps of fronds with their own roots.',
          'Pull or cut the root ball into two or three sections.',
          'Pot each into moisture-retentive mix at the same depth.',
          'Keep humid and shaded for a fortnight — expect some frond loss while it recovers.'
        ]
      }],
      likes: ['Bathrooms and kitchens', 'Standing on a pebble tray', 'Consistently damp soil', 'Cool rooms'],
      dislikes: ['Dry air and radiators', 'Drying out even once', 'Direct sun', 'Strong fertiliser'],
      problems: ['brown-crispy-edges', 'frond-dieback', 'pale-washed-out', 'scale', 'drooping'],
      tags: ['pet-safe', 'humidity-lover', 'trailing', 'air-purifying', 'bathroom']
    },

    {
      id: 'asplenium-nidus',
      common: 'Bird\'s Nest Fern',
      aka: ['Crow\'s Nest Fern'],
      botanical: 'Asplenium nidus',
      family: 'Aspleniaceae',
      origin: 'Tropical Asia, east Africa and eastern Australia',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: false,
        note: 'Water the soil around the edge of the pot, never into the central rosette — water pooling in the crown causes rot.'
      },
      light: {
        ideal: 'medium', tolerates: ['bright-indirect', 'low'], avoid: ['direct'],
        note: 'An epiphyte from the forest understorey. Medium, filtered light suits it best.'
      },
      humidity: 'high', minC: 15, idealC: [18, 26],
      fert: { everyDays: 42, strength: 'quarter', type: 'Very dilute balanced feed' },
      soil: 'Loose and organic — a peat-free mix with bark and perlite, as it naturally grows on trees.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Spores', diff: 'hard', season: 'When spores ripen', roots: '3–6 months',
        steps: [
          'This fern cannot be divided — it grows from a single central rosette.',
          'Look for brown stripes on the frond undersides; these are ripe spore cases.',
          'Scrape spores onto damp sterile compost in a covered container.',
          'Keep at 21°C in indirect light. A green film appears first, then tiny fronds.',
          'It is a genuinely slow, fiddly process — most people simply buy another plant.'
        ]
      }],
      likes: ['Humid bathrooms', 'Water at the soil, not in the crown', 'Filtered light'],
      dislikes: ['Water in the central nest', 'Dry air', 'Direct sun', 'Being touched — new fronds bruise easily'],
      problems: ['brown-crispy-edges', 'crown-rot', 'pale-washed-out', 'scale'],
      tags: ['pet-safe', 'humidity-lover', 'bathroom', 'architectural', 'low-light']
    },

    {
      id: 'adiantum-raddianum',
      common: 'Maidenhair Fern',
      aka: ['Delta Maidenhair'],
      botanical: 'Adiantum raddianum',
      family: 'Pteridaceae',
      origin: 'Tropical South America',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 40,
      water: {
        warm: 3, cool: 5, soakPct: 0.3, dryBetween: false,
        note: 'The thirstiest plant in this collection. The soil must never dry out — not once, not for an afternoon. Many people stand the pot in a shallow tray of water.'
      },
      light: {
        ideal: 'medium', tolerates: ['bright-indirect', 'low'], avoid: ['direct'],
        note: 'Soft, indirect light only. Those delicate fronds burn in even an hour of direct sun.'
      },
      humidity: 'high', minC: 15, idealC: [16, 24],
      fert: { everyDays: 42, strength: 'quarter', type: 'Very dilute balanced feed' },
      soil: 'Moisture-retentive and rich — coco coir based mix with a little perlite.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Unpot and cut the rhizome mass into sections, each with several fronds and good roots.',
          'Pot immediately into damp mix — do not let the roots dry out for even a moment.',
          'Cut the fronds back by half to reduce water loss while it re-establishes.',
          'Keep in a humid, shaded spot and expect a few weeks of sulking.'
        ]
      }],
      likes: ['Constant moisture', 'Steamy bathrooms', 'Being cut right back when it crisps — it regrows from the base'],
      dislikes: ['Drying out', 'Dry air', 'Direct sun', 'Draughts', 'Being fussed over'],
      problems: ['low-humidity', 'underwatering', 'brown-crispy-edges', 'frond-dieback', 'drooping', 'pale-washed-out'],
      tags: ['pet-safe', 'humidity-lover', 'tricky', 'bathroom', 'delicate', 'low-light']
    },

    {
      id: 'calathea-orbifolia',
      common: 'Calathea Orbifolia',
      aka: ['Prayer Plant', 'Goeppertia'],
      botanical: 'Goeppertia orbifolia',
      family: 'Marantaceae',
      origin: 'Bolivian rainforest understorey',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 80,
      water: {
        warm: 5, cool: 9, soakPct: 0.25, dryBetween: false,
        note: 'Keep evenly moist, never wet or dry. Very sensitive to tap water minerals — use rainwater, filtered or distilled water to avoid brown edges.'
      },
      light: {
        ideal: 'medium', tolerates: ['bright-indirect', 'low'], avoid: ['direct'],
        note: 'A forest floor plant. Bright indirect at most — direct sun fades the silver striping and scorches the leaves.'
      },
      humidity: 'high', minC: 16, idealC: [18, 26],
      fert: { everyDays: 28, strength: 'quarter', type: 'Dilute balanced feed' },
      soil: 'Moisture-retentive but airy — coco coir with perlite and a little fine bark.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic. All calatheas are safe around cats and dogs, which makes them a favourite for pet owners willing to fuss.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Only divide a genuinely mature, multi-stemmed clump — small plants rarely survive it.',
          'Unpot and gently tease the rhizomes apart, keeping three or more leaves per division.',
          'Pot into damp mix and tent with a clear bag for two weeks to hold humidity.',
          'Keep warm and shaded while it recovers.'
        ]
      }],
      likes: ['Filtered or rainwater', 'High humidity — 60% and up', 'Warm, stable temperatures', 'Medium light'],
      dislikes: ['Tap water', 'Dry air', 'Cold', 'Direct sun', 'Drying out'],
      problems: ['brown-crispy-edges', 'leaves-curling', 'spider-mites', 'pale-washed-out', 'drooping', 'yellow-lower-leaves'],
      tags: ['pet-safe', 'humidity-lover', 'tricky', 'patterned', 'colourful', 'low-light']
    },

    {
      id: 'maranta-leuconeura',
      common: 'Prayer Plant',
      aka: ['Herringbone Plant', 'Rabbit\'s Foot'],
      botanical: 'Maranta leuconeura',
      family: 'Marantaceae',
      origin: 'Brazilian rainforest',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 30,
      water: {
        warm: 5, cool: 9, soakPct: 0.25, dryBetween: false,
        note: 'Keep lightly and evenly moist. Use filtered or rainwater where you can — it is nearly as fussy as its calathea cousins.'
      },
      light: {
        ideal: 'medium', tolerates: ['bright-indirect', 'low'], avoid: ['direct'],
        note: 'Watch it fold its leaves up at dusk and open them at dawn — that is the praying it is named for, and a healthy plant does it noticeably.'
      },
      humidity: 'high', minC: 15, idealC: [18, 26],
      fert: { everyDays: 28, strength: 'quarter', type: 'Dilute balanced feed' },
      soil: 'Moisture-retentive and airy — coco coir with perlite.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–4 weeks',
        steps: [
          'Take a cutting just below a node, keeping two or three leaves.',
          'Root in water or directly in damp moss.',
          'Cover to keep humidity high while it roots.',
          'Division of a mature clump works equally well.'
        ]
      }],
      likes: ['Humidity', 'Filtered water', 'Trailing over the edge of a shelf', 'Medium light'],
      dislikes: ['Dry air', 'Hard tap water', 'Cold', 'Direct sun'],
      problems: ['brown-crispy-edges', 'leaves-curling', 'spider-mites', 'pale-washed-out', 'yellow-lower-leaves'],
      tags: ['pet-safe', 'humidity-lover', 'patterned', 'trailing', 'compact', 'low-light']
    },

    {
      id: 'fittonia-albivenis',
      common: 'Nerve Plant',
      aka: ['Mosaic Plant', 'Fittonia'],
      botanical: 'Fittonia albivenis',
      family: 'Acanthaceae',
      origin: 'Peruvian rainforest floor',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 15,
      water: {
        warm: 3, cool: 5, soakPct: 0.3, dryBetween: false,
        note: 'Dramatically faints flat when thirsty and recovers within an hour of watering. Entertaining, but repeated fainting weakens it — keep it evenly damp.'
      },
      light: {
        ideal: 'medium', tolerates: ['bright-indirect', 'low'], avoid: ['direct'],
        note: 'Low to medium light suits it. Perfect for a terrarium or a bathroom shelf.'
      },
      humidity: 'high', minC: 16, idealC: [18, 26],
      fert: { everyDays: 42, strength: 'quarter', type: 'Dilute balanced feed' },
      soil: 'Moisture-retentive — coco coir or peat-free compost with a little perlite.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
        steps: [
          'Snip a 5cm stem tip below a node.',
          'Remove the lowest leaves and stand in water or push into damp moss.',
          'Cover to hold humidity — this one roots very readily.',
          'Pot up several together for a dense cushion of colour.'
        ]
      }],
      likes: ['Terrariums and cloches', 'Constant humidity', 'Being pinched back to stay bushy'],
      dislikes: ['Drying out', 'Dry air', 'Direct sun', 'Cold'],
      problems: ['underwatering', 'low-humidity', 'drooping', 'brown-crispy-edges', 'leggy-stretching', 'pale-washed-out'],
      tags: ['pet-safe', 'humidity-lover', 'compact', 'colourful', 'terrarium', 'low-light']
    },

    {
      id: 'chamaedorea-elegans',
      common: 'Parlour Palm',
      aka: ['Neanthe Bella Palm'],
      botanical: 'Chamaedorea elegans',
      family: 'Arecaceae',
      origin: 'Rainforests of southern Mexico and Guatemala',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 120,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Let the top 3cm dry out. Palms are unforgiving about root rot, so err on the dry side and never leave it standing in a full saucer.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'The Victorians grew these in dim parlours for good reason — it handles low light better than almost any other palm.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      fert: { everyDays: 56, strength: 'half', type: 'Balanced feed — palms are light feeders' },
      repot: 'Every 3 years. Palms hate root disturbance, so only pot on when genuinely necessary.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic. A genuinely pet-safe palm — unlike the sago palm, which is not a true palm and is lethally toxic.' },
      prop: [{
        m: 'Seed', diff: 'hard', season: 'Spring', roots: 'Germinates in 2–4 months',
        steps: [
          'Palms cannot be divided or taken as cuttings — each stem grows from a single point.',
          'Sow fresh seed 1cm deep in damp seed compost.',
          'Keep at a steady 27°C, ideally on a heat mat, and covered to hold humidity.',
          'Germination is slow and uneven. Multi-stemmed shop plants are simply several seedlings potted together.'
        ]
      }],
      likes: ['Low to medium light', 'Slightly cramped pots', 'Steady, draught-free warmth'],
      dislikes: ['Overwatering', 'Direct sun', 'Root disturbance', 'Fluoridated water'],
      problems: ['brown-tips-only', 'yellow-lower-leaves', 'spider-mites', 'root-rot', 'pale-washed-out'],
      tags: ['pet-safe', 'low-light', 'beginner', 'palm', 'air-purifying']
    },

    {
      id: 'howea-forsteriana',
      common: 'Kentia Palm',
      aka: ['Thatch Palm', 'Paradise Palm'],
      botanical: 'Howea forsteriana',
      family: 'Arecaceae',
      origin: 'Lord Howe Island, Australia',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 250,
      water: {
        warm: 9, cool: 16, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 5cm are dry, then let it drain fully. Tolerates a little neglect better than most palms.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Elegant and adaptable — the classic hotel-lobby palm because it copes with imperfect light so gracefully.'
      },
      humidity: 'medium', minC: 10, idealC: [18, 26],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced feed with magnesium' },
      repot: 'Every 3–4 years. Resents disturbance, so pot on only when roots fill the pot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Seed', diff: 'hard', season: 'Spring', roots: 'Germinates in 3–12 months',
        steps: [
          'Cannot be divided — clumps sold in shops are several seedlings grown together.',
          'Soak fresh seed for two days, then sow in damp compost.',
          'Keep at 27°C with high humidity. Germination is famously slow and erratic.',
          'For most people, buying a young plant is the sensible route.'
        ]
      }],
      likes: ['Bright indirect light', 'Even moisture in summer', 'Being left in place'],
      dislikes: ['Direct sun', 'Waterlogging', 'Root disturbance', 'Cold draughts'],
      problems: ['brown-tips-only', 'yellow-lower-leaves', 'spider-mites', 'scale', 'root-rot'],
      tags: ['pet-safe', 'palm', 'large', 'beginner', 'architectural', 'low-light']
    },

    {
      id: 'spathiphyllum-wallisii',
      common: 'Peace Lily',
      aka: ['Spath', 'White Sails'],
      botanical: 'Spathiphyllum wallisii',
      family: 'Araceae',
      origin: 'Tropical Americas and Southeast Asia',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 60,
      water: {
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: false,
        note: 'It wilts theatrically when thirsty and recovers within hours — a handy signal, though letting it faint repeatedly damages the roots over time.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'Flowers best in bright indirect light but survives happily in genuinely dim rooms — it simply stops blooming.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 27],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced feed; too much causes green flowers' },
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals — mouth burning, drooling, vomiting. Worth knowing: this is NOT a true lily. True lilies (Lilium, Hemerocallis) cause fatal kidney failure in cats; a peace lily is painful but not deadly.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Unpot a mature clump and look for crowns — each has its own leaves and roots.',
          'Tease the crowns apart by hand, cutting only where you must.',
          'Pot each with two or more leaves into fresh mix.',
          'Keep shaded and evenly moist for a fortnight while it settles.'
        ]
      }],
      likes: ['Medium light', 'Even moisture', 'Filtered water — it browns with hard tap water'],
      dislikes: ['Direct sun', 'Drying out fully', 'Cold below 15°C', 'Overfeeding'],
      problems: ['brown-crispy-edges', 'drooping', 'no-flowers', 'yellow-lower-leaves', 'root-rot', 'green-flowers'],
      tags: ['low-light', 'beginner', 'flowering', 'air-purifying']
    },

    {
      id: 'anthurium-andraeanum',
      common: 'Flamingo Flower',
      aka: ['Anthurium', 'Painter\'s Palette'],
      botanical: 'Anthurium andraeanum',
      family: 'Araceae',
      origin: 'Colombia and Ecuador',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 45,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Let the top third dry out. As an epiphyte its roots need air as much as water — soggy soil is the fastest way to lose it.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light is what drives flowering. In medium light it stays healthy but stops producing those red spathes.'
      },
      humidity: 'high', minC: 16, idealC: [20, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'High-phosphorus feed to encourage flowering' },
      soil: 'Very chunky and airy — orchid bark with coco coir and perlite. Standard compost suffocates it.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals throughout. Causes intense oral burning, swelling and drooling if chewed.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Unpot and find offsets — side shoots with their own aerial roots.',
          'Cut an offset away with a sterilised blade, keeping as much root as possible.',
          'Pot into a chunky, airy mix.',
          'Keep warm and humid; expect flowers again within a year.'
        ]
      }],
      likes: ['Chunky, airy potting mix', 'High humidity', 'Bright indirect light', 'Being slightly pot-bound'],
      dislikes: ['Dense wet compost', 'Direct sun', 'Cold', 'Dry air'],
      problems: ['no-flowers', 'brown-crispy-edges', 'yellow-lower-leaves', 'root-rot', 'scale'],
      tags: ['flowering', 'colourful', 'humidity-lover']
    },

    {
      id: 'calathea-lancifolia',
      common: 'Rattlesnake Plant',
      aka: ['Calathea Lancifolia', 'Goeppertia insignis'],
      botanical: 'Goeppertia insignis',
      family: 'Marantaceae',
      origin: 'Rainforest floor in Brazil',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 60,
      water: {
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: false,
        note: 'Keep the soil lightly moist, watering when the top 2cm feels dry. Use rainwater or filtered water: it is sensitive to the fluoride and salts in tap water, which brown the leaf edges.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'A forest-floor plant, happy a few metres from a window. Direct sun fades the markings and curls the leaves.'
      },
      humidity: 'high', minC: 16, idealC: [18, 26],
      fert: { everyDays: 28, strength: 'quarter', type: 'Balanced liquid feed' },
      soil: 'Moisture-retentive but airy: potting mix with coir and a little perlite.',
      repot: 'Every 2 years in spring.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs, under the older names Calathea insignis and Calathea lancifolia.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Already rooted',
        steps: [
          'Divide only a mature clump with several crowns.',
          'Unpot it and tease the rhizomes apart, keeping three or more leaves and good roots on each piece.',
          'Pot each into damp mix and cover loosely with a clear bag for a week or two.',
          'Some leaves may curl or brown while it settles; new ones follow.'
        ]
      }],
      likes: ['Rainwater', 'Humid air', 'Medium light'],
      dislikes: ['Tap water', 'Direct sun', 'Drying out'],
      problems: ['low-humidity', 'tap-water-minerals', 'underwatering', 'brown-crispy-edges', 'leaves-curling', 'spider-mites'],
      tags: ['pet-safe', 'patterned', 'humidity-lover', 'low-light', 'bathroom']
    },

    {
      id: 'hypoestes-phyllostachya',
      common: 'Polka Dot Plant',
      aka: ['Freckle Face', 'Hypoestes'],
      botanical: 'Hypoestes phyllostachya',
      family: 'Acanthaceae',
      origin: 'Forests of Madagascar',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 30,
      water: {
        warm: 4, cool: 7, soakPct: 0.25, dryBetween: false,
        note: 'Keep the soil evenly moist. It wilts dramatically when dry and recovers within an hour of a drink, but repeated wilting browns the leaf edges.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light keeps the spots vivid and the plant bushy. In low light the colour fades to green and the stems stretch.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 26],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage.',
      repot: 'Annually in spring. It is short-lived, so many growers simply restart it from cuttings each year.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '1–2 weeks',
        steps: [
          'Snip 5–8cm tips, just below a pair of leaves.',
          'Strip the lowest leaves and stand the stems in water, or push them into damp mix.',
          'Roots appear within a fortnight. Pot several together for a full plant.',
          'Pinch out the tips as they grow to keep them bushy.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Spring, indoors', germDays: '7–14 days', depthMm: 2,
        steps: [
          'Sow thinly on the surface of damp seed compost and barely cover.',
          'Keep it at 20–24°C, in bright light but out of direct sun.',
          'The spots appear once seedlings have their first true leaves.',
          'Pot on into small pots at four leaves, and pinch out the tips at six.'
        ]
      },
      likes: ['Evenly moist soil', 'Regular pinching', 'Bright indirect light'],
      dislikes: ['Drying out', 'Low light', 'Cold'],
      problems: ['underwatering', 'needs-pruning', 'drooping', 'leggy-stretching', 'variegation-loss', 'aphids'],
      tags: ['pet-safe', 'colourful', 'compact', 'fast-growing', 'easy-propagation']
    },

    {
      id: 'rhapis-excelsa',
      common: 'Lady Palm',
      aka: ['Broadleaf Lady Palm', 'Bamboo Palm'],
      botanical: 'Rhapis excelsa',
      family: 'Arecaceae',
      origin: 'Woodland understorey of southern China and Taiwan',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 150,
      water: {
        warm: 8, cool: 14, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3cm is dry, thoroughly, then let it drain. Rainwater or filtered water keeps the frond tips from browning.'
      },
      light: {
        ideal: 'medium', tolerates: ['low', 'bright-indirect'], avoid: ['direct'],
        note: 'One of the most shade-tolerant palms. It grows slowly in low light but keeps its deep green; direct sun yellows and scorches the fans.'
      },
      humidity: 'medium', minC: 7, idealC: [15, 26],
      fert: { everyDays: 42, strength: 'half', type: 'Palm feed, or a balanced feed' },
      soil: 'A standard indoor potting mix with a couple of handfuls of perlite for drainage.',
      repot: 'Every 3 years in spring. It grows slowly and is happy crowded.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs, under the older name Rhapis flabelliformis.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
        steps: [
          'It spreads by underground stems, sending up new canes around the clump.',
          'Unpot it and cut away a group of canes with its own roots and rhizome.',
          'Pot it at its old depth in fresh mix and keep it shaded while it settles.'
        ]
      }],
      likes: ['Shade', 'Cool rooms', 'Rainwater'],
      dislikes: ['Direct sun', 'Hard tap water', 'Wet feet'],
      problems: ['tap-water-minerals', 'brown-tips-only', 'scale', 'overwatering', 'yellow-lower-leaves'],
      tags: ['pet-safe', 'palm', 'low-light', 'beginner', 'cool-tolerant', 'architectural']
    },

    {
      id: 'platycerium-bifurcatum',
      common: 'Staghorn Fern',
      aka: ['Elkhorn Fern', 'Platycerium'],
      botanical: 'Platycerium bifurcatum',
      family: 'Polypodiaceae',
      origin: 'High on tree trunks in the rainforests of eastern Australia, New Guinea and Java',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 90,
      water: {
        warm: 7, cool: 14, dryBetween: true, method: 'soak',
        note: 'It grows on a board or in a basket rather than a pot, and drinks through its roots and the flat shield fronds at the back. Soak the whole mount, face down, in tepid water for 10–20 minutes, then let it drip dry before hanging it back up. The mount should feel light before the next soak. Leave the soft grey felt on the antler fronds alone: wiping it off strips their protection.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light, as it gets high in a rainforest tree. Direct sun bleaches and burns the fronds.'
      },
      humidity: 'high', minC: 10, idealC: [16, 27],
      fert: { everyDays: 28, strength: 'quarter', type: 'Balanced liquid feed added to the soaking water' },
      soil: 'None in a pot: it is mounted on a board over a pad of sphagnum moss, or grown in a slatted basket of bark and moss.',
      repot: 'Never repotted. When the shield fronds outgrow the board, mount it, board and all, on a larger one.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'medium', season: 'Spring', roots: '4–8 weeks',
        steps: [
          'A mature plant sends up small plants, called pups, beside the main one.',
          'Cut a pup away with its roots and a piece of the shield frond behind it.',
          'Tie it with fishing line, not wire, onto a small board over a pad of damp sphagnum moss.',
          'Keep it humid and soak it lightly until it grips the board by itself.'
        ]
      }],
      likes: ['A thorough soak, then drying off', 'Humid air', 'Bright, filtered light'],
      dislikes: ['A pot of soil', 'Direct sun', 'Its felt being wiped'],
      problems: ['low-humidity', 'frond-dieback', 'brown-crispy-edges', 'natural-ageing', 'too-much-light', 'scale'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'humidity-lover', 'statement', 'unusual']
    },

    {
      id: 'davallia-fejeensis',
      common: 'Rabbit\'s Foot Fern',
      aka: ['Davallia', 'Deer\'s Foot Fern'],
      botanical: 'Davallia fejeensis',
      family: 'Davalliaceae',
      origin: 'Rainforests of Fiji, growing on trees and rocks',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 45,
      water: {
        warm: 5, cool: 9, soakPct: 0.25, dryBetween: false,
        note: 'Keep the mix lightly moist, letting only the surface dry between drinks. Water the mix rather than the furry rhizomes creeping over the rim: they take moisture from the air and rot if kept wet.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light. It takes more light and drier air than most ferns, but direct sun crisps the fronds.'
      },
      humidity: 'medium', minC: 10, idealC: [16, 24],
      fert: { everyDays: 28, strength: 'quarter', type: 'Balanced liquid feed' },
      soil: 'Open and airy: potting mix with orchid bark and perlite.',
      repot: 'Every 2–3 years in spring, into a wide, shallow pot or hanging basket. Never bury the rhizomes.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Rhizome cutting', diff: 'easy', season: 'Spring or summer', roots: '4–6 weeks',
        steps: [
          'Cut a 5–8cm length of furry rhizome with at least one frond.',
          'Pin it onto the surface of damp mix with a bent wire. Do not bury it.',
          'Cover it with a clear bag and keep it warm and bright, out of sun.',
          'New fronds show once it has rooted.'
        ]
      }],
      likes: ['Lightly moist mix', 'A shallow pot or basket', 'Bright, filtered light'],
      dislikes: ['Buried rhizomes', 'Direct sun', 'Drying out completely'],
      problems: ['brown-crispy-edges', 'frond-dieback', 'underwatering', 'low-humidity', 'overwatering', 'scale', 'mealybugs'],
      tags: ['pet-safe', 'beginner', 'trailing', 'epiphyte', 'unusual']
    },

    /* ====================== SUCCULENTS & CACTI ====================== */
    {
      id: 'aloe-vera',
      common: 'Aloe Vera',
      aka: ['Medicinal Aloe', 'Burn Plant'],
      botanical: 'Aloe vera',
      family: 'Asphodelaceae',
      origin: 'The Arabian Peninsula',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 18, cool: 35, soakPct: 0.2, dryBetween: true,
        note: 'Soak thoroughly, then let the soil dry out completely before the next watering. Never water into the centre of the rosette.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'Wants several hours of direct sun. Introduce it to strong sun gradually though — it can sunburn if moved abruptly from a dim shop.'
      },
      humidity: 'low', minC: 10, idealC: [18, 28],
      fert: { everyDays: 84, strength: 'half', type: 'Cactus and succulent feed, spring and summer only' },
      soil: 'Gritty, fast-draining cactus mix. Add extra coarse sand or pumice if in doubt.',
      repot: 'Every 3 years, or when offsets crowd the pot. Terracotta is ideal for the extra airflow.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'safe',
        note: 'The latex layer just under the leaf skin contains saponins and anthraquinones — causes vomiting, diarrhoea and lethargy in pets. Safe for humans to use topically.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Look for small pups pushing up around the base of the parent.',
          'Unpot the whole plant and separate a pup that is at least 8cm tall, ideally with its own roots.',
          'Let the cut surfaces dry and callous for two or three days — this is essential to prevent rot.',
          'Pot into dry cactus mix and wait a full week before the first light watering.'
        ]
      }],
      likes: ['Full sun', 'Terracotta pots', 'Long dry spells'],
      dislikes: ['Overwatering — by far the main killer', 'Cold wet soil', 'Water in the crown'],
      problems: ['mushy-base', 'root-rot', 'leaves-curling', 'pale-washed-out', 'sunburn', 'leaves-falling-over'],
      tags: ['succulent', 'sun-lover', 'drought-tolerant', 'beginner', 'edible-use']
    },

    {
      id: 'crassula-ovata',
      common: 'Jade Plant',
      aka: ['Money Tree', 'Lucky Plant'],
      botanical: 'Crassula ovata',
      family: 'Crassulaceae',
      origin: 'South Africa and Mozambique',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 90,
      water: {
        warm: 18, cool: 40, soakPct: 0.2, dryBetween: true,
        note: 'Water only when the soil is bone dry and the leaves feel slightly less firm. In winter it may need water only once a month or less.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'Full sun keeps it compact and brings out red edges on the leaves. In low light it stretches and the stems grow weak.'
      },
      humidity: 'low', minC: 7, idealC: [18, 28],
      fert: { everyDays: 84, strength: 'half', type: 'Cactus and succulent feed' },
      soil: 'Gritty cactus mix with extra pumice or coarse sand.',
      repot: 'Every 3–4 years. It makes a lovely bonsai-style specimen if kept in a shallow pot.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Cause unknown but well documented — vomiting, lethargy and loss of coordination in cats and dogs. Worth siting out of reach.' },
      prop: [{
        m: 'Leaf or stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Twist off a whole plump leaf, or cut a stem 8cm long.',
          'Leave it on a dry windowsill for three to five days until the wound calluses over. Skipping this step causes rot.',
          'Lay leaves on top of dry cactus mix, or push stem cuttings 2cm in.',
          'Mist lightly every few days rather than watering. Tiny roots and a rosette will appear.',
          'Begin normal watering once the new plant is established.'
        ]
      }],
      likes: ['Full sun', 'Bone-dry soil between waterings', 'Terracotta', 'Being pruned into shape'],
      dislikes: ['Overwatering', 'Cold damp conditions', 'Low light'],
      problems: ['leaves-falling-off', 'root-rot', 'mushy-base', 'leggy-stretching', 'mealybugs', 'leaves-curling'],
      tags: ['succulent', 'sun-lover', 'drought-tolerant', 'beginner', 'bonsai']
    },

    {
      id: 'echeveria-elegans',
      common: 'Echeveria',
      aka: ['Mexican Snowball', 'Hen and Chicks'],
      botanical: 'Echeveria elegans',
      family: 'Crassulaceae',
      origin: 'Semi-desert Mexico',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 15,
      water: {
        warm: 14, cool: 30, soakPct: 0.2, dryBetween: true,
        note: 'Water the soil directly, never over the rosette — water trapped between the leaves rots the centre out. Let it dry completely between drinks.'
      },
      light: {
        ideal: 'direct', tolerates: [], avoid: ['low', 'medium', 'bright-indirect'],
        note: 'Needs four to six hours of direct sun. Anything less and it stretches upward into a pale, unrecognisable tower — that is etiolation, and it cannot be reversed.'
      },
      humidity: 'low', minC: 7, idealC: [18, 28],
      fert: { everyDays: 84, strength: 'quarter', type: 'Dilute cactus feed' },
      soil: 'Very gritty — half cactus mix, half pumice or coarse sand.',
      repot: 'Every 2 years in spring. Terracotta strongly preferred.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '4–6 weeks',
        steps: [
          'Gently twist a leaf off so it comes away whole, with its base intact — a torn leaf will not root.',
          'Lay the leaves on dry cactus mix in bright indirect light and leave them alone for a week.',
          'Mist lightly every few days once you see pink roots.',
          'A tiny rosette forms at the leaf base. Once it has its own roots, the original leaf shrivels — that is correct.',
          'Pot up the rosette and begin normal watering.'
        ]
      }],
      likes: ['Direct sun', 'Gritty soil', 'Terracotta pots', 'Being left dry'],
      dislikes: ['Water sitting in the rosette', 'Low light', 'Humidity', 'Overwatering'],
      problems: ['leggy-stretching', 'root-rot', 'mushy-base', 'mealybugs', 'sunburn', 'pale-washed-out'],
      tags: ['succulent', 'sun-lover', 'pet-safe', 'compact', 'drought-tolerant']
    },

    {
      id: 'haworthiopsis-attenuata',
      common: 'Zebra Haworthia',
      aka: ['Zebra Plant', 'Haworthia'],
      botanical: 'Haworthiopsis attenuata',
      family: 'Asphodelaceae',
      origin: 'Eastern Cape, South Africa',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 12,
      water: {
        warm: 16, cool: 35, soakPct: 0.2, dryBetween: true,
        note: 'Water around the base only, letting the soil dry fully between. It stores water in those firm leaves and needs very little.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'More shade-tolerant than most succulents — it grows under shrubs in the wild. Bright indirect light is ideal; harsh midday sun can bronze it.'
      },
      humidity: 'low', minC: 7, idealC: [18, 27],
      fert: { everyDays: 84, strength: 'quarter', type: 'Dilute cactus feed' },
      soil: 'Gritty cactus mix with added pumice.',
      repot: 'Every 2–3 years, usually when offsets fill the pot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets — a good succulent choice for a cat household.' },
      prop: [{
        m: 'Offsets', diff: 'easy', season: 'Spring', roots: '3–5 weeks',
        steps: [
          'Unpot and find the small offsets clustered around the parent rosette.',
          'Separate them by hand, keeping any roots they have already made.',
          'Let the wounds dry for two days.',
          'Pot into dry gritty mix and wait a week before watering.'
        ]
      }],
      likes: ['Bright indirect light', 'Small pots', 'Drying out completely'],
      dislikes: ['Overwatering', 'Deep shade', 'Rich moisture-retentive soil'],
      problems: ['root-rot', 'mushy-base', 'leaves-curling', 'pale-washed-out', 'sunburn'],
      tags: ['succulent', 'pet-safe', 'compact', 'drought-tolerant', 'beginner', 'office']
    },

    {
      id: 'curio-rowleyanus',
      common: 'String of Pearls',
      aka: ['String of Beads', 'Senecio rowleyanus'],
      botanical: 'Curio rowleyanus',
      family: 'Asteraceae',
      origin: 'Dry southwest Africa',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 90,
      water: {
        warm: 14, cool: 28, soakPct: 0.2, dryBetween: true,
        note: 'Water only when the pearls start to look slightly flattened rather than perfectly round. Shallow roots rot with terrible ease.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'Wants very bright light with perhaps a little gentle direct morning sun. Insufficient light causes long bare gaps between the pearls.'
      },
      humidity: 'low', minC: 10, idealC: [18, 26],
      fert: { everyDays: 84, strength: 'quarter', type: 'Dilute cactus feed' },
      soil: 'Very gritty and shallow — cactus mix with plenty of pumice. It has a fine, shallow root system.',
      repot: 'Every 2–3 years into a wide shallow pot rather than a deep one.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Causes vomiting, drooling and skin irritation. The dangling strands are extremely tempting to cats — hang it genuinely out of reach or choose something else.' },
      prop: [{
        m: 'Stem cutting laid on soil', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Cut a strand 10–15cm long.',
          'Remove a few pearls from the cut end to expose bare stem.',
          'Coil the strand on top of dry gritty mix and press the bare section lightly into the surface.',
          'Mist every few days rather than soaking. Roots form wherever stem touches soil.',
          'Coiling several strands in one pot gives a much fuller plant.'
        ]
      }],
      likes: ['Very bright light', 'Shallow wide pots', 'Drying out fully', 'Hanging high'],
      dislikes: ['Overwatering', 'Deep pots', 'Low light', 'Humidity'],
      problems: ['shrivelled-pearls', 'root-rot', 'leggy-stretching', 'mealybugs', 'mushy-base'],
      tags: ['succulent', 'trailing', 'tricky', 'drought-tolerant']
    },

    {
      id: 'schlumbergera-truncata',
      common: 'Christmas Cactus',
      aka: ['Holiday Cactus', 'Zygocactus'],
      botanical: 'Schlumbergera truncata',
      family: 'Cactaceae',
      origin: 'Coastal mountain forests of southeast Brazil',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 40,
      water: {
        warm: 10, cool: 18, soakPct: 0.25, dryBetween: true,
        note: 'Unlike desert cacti this is a forest epiphyte and wants more water — let the top third dry, then water properly. Keep it drier for six weeks before you want flowers.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'It grows in trees, not deserts, so bright indirect light suits it. Direct sun reddens and scorches the segments.'
      },
      humidity: 'medium', minC: 10, idealC: [16, 24],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced feed; switch to high-potassium in autumn for buds' },
      soil: 'Airy epiphyte mix — orchid bark, coco coir and perlite.',
      repot: 'Every 3–4 years. It flowers more freely when a little pot-bound.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets — unlike true Christmas plants such as poinsettia and mistletoe.' },
      prop: [{
        m: 'Segment cutting', diff: 'easy', season: 'Late spring', roots: '3–5 weeks',
        steps: [
          'Twist off a Y-shaped piece two or three segments long — twisting is better than cutting.',
          'Let it dry on a windowsill for two days so the wound calluses.',
          'Push the base 1cm into damp airy mix.',
          'Water sparingly until new growth appears.'
        ]
      }],
      likes: ['Bright indirect light', 'Cool nights and long darkness in autumn to set buds', 'Being pot-bound'],
      dislikes: ['Direct sun', 'Being moved once buds form — they drop', 'Waterlogging'],
      problems: ['bud-drop', 'no-flowers', 'root-rot', 'shrivelled-segments', 'mealybugs'],
      tags: ['succulent', 'pet-safe', 'flowering', 'trailing', 'beginner']
    },

    {
      id: 'beaucarnea-recurvata',
      common: 'Ponytail Palm',
      aka: ['Elephant\'s Foot', 'Nolina'],
      botanical: 'Beaucarnea recurvata',
      family: 'Asparagaceae',
      origin: 'Semi-desert eastern Mexico',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 150,
      water: {
        warm: 21, cool: 45, soakPct: 0.2, dryBetween: true,
        note: 'That swollen base is a water reservoir. Soak it thoroughly, then leave it alone for weeks. In winter, once a month is plenty.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'Wants the brightest spot you have. It tolerates bright indirect light but grows painfully slowly.'
      },
      humidity: 'low', minC: 7, idealC: [18, 28],
      fert: { everyDays: 84, strength: 'half', type: 'Cactus feed, growing season only' },
      soil: 'Very gritty cactus mix — sharp drainage is non-negotiable.',
      repot: 'Every 4–5 years. It stays smaller and neater in a tight pot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic. Not a true palm, and importantly not to be confused with the sago palm, which is lethal to dogs.' },
      prop: [{
        m: 'Offsets', diff: 'medium', season: 'Spring', roots: '6–10 weeks',
        steps: [
          'Mature plants occasionally produce pups at the base of the caudex.',
          'Cut a pup away with a sterilised blade, taking a slice of the parent base with it if you can.',
          'Dust the wound with cinnamon or sulphur and let it dry for a week.',
          'Pot into dry gritty mix and water very sparingly until rooted.'
        ]
      }],
      likes: ['Full sun', 'Long droughts', 'Tight pots', 'Terracotta'],
      dislikes: ['Overwatering — the caudex rots and softens', 'Cold wet soil', 'Deep shade'],
      problems: ['brown-tips-only', 'mushy-base', 'root-rot', 'spider-mites', 'pale-washed-out'],
      tags: ['succulent', 'pet-safe', 'sun-lover', 'drought-tolerant', 'architectural', 'beginner']
    },

    {
      id: 'kalanchoe-blossfeldiana',
      common: 'Flaming Katy',
      aka: ['Kalanchoe', 'Widow\'s Thrill'],
      botanical: 'Kalanchoe blossfeldiana',
      family: 'Crassulaceae',
      origin: 'Madagascar',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 30,
      water: {
        warm: 14, cool: 28, soakPct: 0.2, dryBetween: true,
        note: 'Water at the base when the soil is dry through. Water sitting among the leaves and flowers invites rot.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'Bright light drives the flowering. It needs short days — around 14 hours of darkness for six weeks — to set new buds.'
      },
      humidity: 'low', minC: 10, idealC: [18, 27],
      fert: { everyDays: 42, strength: 'half', type: 'High-potassium feed while budding' },
      soil: 'Gritty cactus mix.',
      tox: { cats: 'very-toxic', dogs: 'very-toxic', humans: 'toxic',
        note: 'Contains bufadienolide cardiac glycosides — these affect heart rhythm. Beyond vomiting and diarrhoea it can cause dangerous arrhythmias. One of the genuinely serious houseplants for pets; keep it well away or avoid it entirely.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Take a 8cm non-flowering stem tip.',
          'Strip the lower leaves and let the cut dry for two days.',
          'Push into dry gritty mix and water very lightly.',
          'It roots readily — keep it in bright light.'
        ]
      }],
      likes: ['Bright light', 'Drying out between waterings', 'Deadheading spent flowers'],
      dislikes: ['Overwatering', 'Water on the leaves', 'Low light'],
      problems: ['no-flowers', 'root-rot', 'mushy-base', 'leggy-stretching', 'mealybugs', 'powdery-mildew'],
      tags: ['succulent', 'flowering', 'colourful', 'sun-lover', 'compact', 'beginner']
    },

    {
      id: 'mammillaria-elongata',
      common: 'Ladyfinger Cactus',
      aka: ['Gold Lace Cactus', 'Mammillaria'],
      botanical: 'Mammillaria elongata',
      family: 'Cactaceae',
      origin: 'Rocky hillsides of central Mexico',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 15,
      water: {
        warm: 14, cool: 35, soakPct: 0.2, dryBetween: true,
        note: 'Water thoroughly only when the soil is dry all the way through, then let it drain. Keep it almost dry from late autumn to early spring: a cool, dry rest is what makes it flower.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'A sunny windowsill. Short of sun, the fingers stretch thin and pale towards the glass and do not thicken again.'
      },
      humidity: 'low', minC: 5, idealC: [18, 30],
      fert: { everyDays: 56, strength: 'quarter', type: 'Cactus and succulent feed' },
      soil: 'Very gritty cactus mix, with extra grit or pumice. It must drain in seconds.',
      repot: 'Every 2–3 years, into a wide, shallow pot as the clump spreads. Handle it with folded paper against the spines.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA; the related Mammillaria fragilis is listed as non-toxic to cats and dogs. The spines are the hazard: they lodge in paws and mouths.' },
      prop: [{
        m: 'Offsets', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Twist or cut a finger away from the clump at its base, using folded paper to hold it.',
          'Leave it on a dry windowsill for a few days so the cut seals.',
          'Set it on the surface of dry cactus mix and water lightly a week later.'
        ]
      }],
      likes: ['Full sun', 'A cool, dry winter', 'Gritty soil'],
      dislikes: ['Wet soil', 'Shade', 'Watering in winter'],
      problems: ['root-rot', 'overwatering', 'mealybugs', 'leggy-stretching', 'leaning', 'mushy-base'],
      tags: ['pet-safe', 'succulent', 'sun-lover', 'compact', 'drought-tolerant', 'beginner', 'flowering']
    },

    {
      id: 'opuntia-microdasys',
      common: 'Bunny Ears Cactus',
      aka: ['Angel\'s Wings', 'Polka Dot Cactus'],
      botanical: 'Opuntia microdasys',
      family: 'Cactaceae',
      origin: 'Chihuahuan Desert of northern Mexico',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 45,
      water: {
        warm: 14, cool: 35, soakPct: 0.2, dryBetween: true,
        note: 'Water thoroughly only when the soil is completely dry, then let it drain. Keep it nearly dry in winter.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'The sunniest window you have. In shade the new pads grow thin, pale and floppy.'
      },
      humidity: 'low', minC: 5, idealC: [18, 32],
      fert: { everyDays: 56, strength: 'quarter', type: 'Cactus and succulent feed' },
      soil: 'Very gritty cactus mix, in a heavy terracotta pot so the pads do not tip it over.',
      repot: 'Every 2–3 years in spring. Wear thick gloves and handle it with folded newspaper.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'mild',
        note: 'The ASPCA lists Opuntia as non-toxic to cats and dogs. It has no long spines, but the dots are clusters of fine barbed bristles (glochids) that come away at a touch and lodge in skin. Remove them with sticky tape rather than fingers.' },
      prop: [{
        m: 'Pad cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Wearing thick gloves, twist or cut a pad away at the joint.',
          'Leave it somewhere dry for a week until the cut end has sealed.',
          'Stand it upright, cut end 2cm into dry cactus mix, and water lightly after another week.'
        ]
      }],
      likes: ['Full sun', 'Gritty soil', 'A dry winter'],
      dislikes: ['Wet soil', 'Shade', 'Being handled'],
      problems: ['root-rot', 'overwatering', 'mealybugs', 'leggy-stretching', 'sunburn', 'mushy-base'],
      tags: ['pet-safe', 'succulent', 'sun-lover', 'drought-tolerant', 'beginner']
    },

    {
      id: 'lithops',
      common: 'Living Stones',
      aka: ['Lithops', 'Pebble Plant', 'Flowering Stones'],
      botanical: 'Lithops species',
      family: 'Aizoaceae',
      origin: 'Arid stony plains of southern Africa, mostly Namibia and South Africa',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 4,
      water: {
        warm: 14, cool: 28, soakPct: 0.2, dryBetween: true,
        seasons: { spring: 21, summer: 0, autumn: 14, winter: 0 },
        note: 'It keeps its own calendar. It grows and flowers in autumn, when it is watered thoroughly every couple of weeks. Through winter a new pair of leaves forms inside the old pair and lives on its water, so it gets none at all. In spring, once the old pair has dried to a papery skin, it is watered lightly. In high summer it rests again and gets none.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'The sunniest window you have, four hours of direct sun or more. Short of light, the pairs grow tall and pale and topple sideways.'
      },
      humidity: 'low', minC: 5, idealC: [15, 30],
      fert: { never: true, note: 'It needs none. Fertiliser makes the leaves swell soft and split.' },
      soil: 'Almost all mineral: two parts horticultural grit or pumice to one part cactus mix, with a grit top dressing.',
      repot: 'Every 3–4 years, in late summer before growth starts, into a deep pot for its long taproot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'The ASPCA lists Lithops (as Lithops naureeniae) as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Division', diff: 'medium', season: 'Late summer', roots: '3–5 weeks',
        steps: [
          'An old plant often grows into a clump of several pairs, each with its own roots.',
          'Unpot it while it is dry and gently pull or cut a pair away with its roots.',
          'Let any cut dry for a few days, then pot it into dry gritty mix.',
          'Wait a week before the first light watering.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Late summer or autumn', germDays: '1–3 weeks', depthMm: 1,
        steps: [
          'Sow the dust-fine seed on the surface of damp, sieved gritty compost and barely cover it with fine grit.',
          'Cover the pot with clear film and keep it bright, out of direct sun, at 15–25°C.',
          'Mist to keep the surface damp, then let it dry between mistings once the seedlings appear.',
          'Leave the seedlings together in the same pot for their first year.'
        ]
      },
      likes: ['Full sun', 'Its own calendar of watering', 'Grit, not compost'],
      dislikes: ['Water in winter or high summer', 'Shade', 'Fertiliser'],
      problems: ['leaf-pair-change', 'overwatering', 'root-rot', 'shrivelled-segments', 'mushy-base', 'leggy-stretching'],
      tags: ['pet-safe', 'succulent', 'sun-lover', 'compact', 'drought-tolerant', 'unusual']
    },

    {
      id: 'sedum-morganianum',
      common: 'Burro\'s Tail',
      aka: ['Donkey\'s Tail', 'Lamb\'s Tail', 'Sedum'],
      botanical: 'Sedum morganianum',
      family: 'Crassulaceae',
      origin: 'Southern Mexico, where it is known only in cultivation',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 14, cool: 30, soakPct: 0.2, dryBetween: true,
        note: 'Water thoroughly once the mix is dry all the way through, then let it drain. The fat leaves drop at a touch, so water at the soil with a narrow spout rather than over the stems.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'Bright light with a few hours of gentle sun keeps the tails tight and blue-grey. In weaker light the leaves space out along the stems.'
      },
      humidity: 'low', minC: 7, idealC: [15, 28],
      fert: { everyDays: 42, strength: 'half', type: 'Cactus and succulent feed' },
      soil: 'Gritty cactus mix with extra perlite.',
      repot: 'Rarely, every 3–4 years, into a pot it can hang from. Every move costs it leaves, so choose its spot once.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [
        { m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
          steps: [
            'Gather leaves that have fallen off: every one can grow a plant.',
            'Leave them for a few days until the broken end has sealed.',
            'Lay them on top of dry gritty mix in bright light, out of direct sun.',
            'Mist lightly once roots and a tiny rosette appear.'
          ] },
        { m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
          steps: [
            'Cut a 10cm tail and strip the leaves from the bottom 3cm.',
            'Let the cut dry for a few days.',
            'Push it into dry gritty mix and water lightly a week later.'
          ] }
      ],
      likes: ['Bright light with some sun', 'Drying out completely', 'Being left where it is'],
      dislikes: ['Being handled', 'A wet pot', 'Low light'],
      problems: ['shrivelled-pearls', 'leaves-falling-off', 'overwatering', 'root-rot', 'mushy-base', 'leggy-stretching', 'mealybugs'],
      tags: ['pet-safe', 'beginner', 'succulent', 'trailing', 'drought-tolerant']
    },

    /* ====================== VINES & TRAILERS ====================== */
    {
      id: 'ceropegia-woodii',
      common: 'String of Hearts',
      aka: ['Rosary Vine', 'Chain of Hearts'],
      botanical: 'Ceropegia woodii',
      family: 'Apocynaceae',
      origin: 'Eastern South Africa and Zimbabwe',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 200,
      water: {
        warm: 12, cool: 24, soakPct: 0.2, dryBetween: true,
        note: 'Semi-succulent, so let it dry out well between waterings. The leaves go slightly soft and thin when it is genuinely thirsty.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light keeps the leaves close together and brings out the silver marbling and pink undersides. Dim light gives long, bare, sparse strands.'
      },
      humidity: 'low', minC: 10, idealC: [18, 26],
      fert: { everyDays: 56, strength: 'quarter', type: 'Dilute cactus or balanced feed' },
      soil: 'Gritty and free-draining — cactus mix with added perlite.',
      repot: 'Every 2–3 years. Look for tubers along the strands and in the soil.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets, though long trailing strands may still get batted about by a curious cat.' },
      prop: [{
        m: 'Tuber or strand layering', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Look along the strands for small grey-brown tubers at the leaf nodes.',
          'Coil a length of strand on top of damp gritty mix so those tubers touch the soil.',
          'Pin it in place with a bent paperclip and mist lightly every few days.',
          'Each tuber that contacts soil will root and send up a new strand.',
          'Once rooted, snip the connection to the parent if you want a separate plant.'
        ]
      }],
      likes: ['Bright light', 'Hanging high with long strands', 'Drying out between waterings'],
      dislikes: ['Overwatering', 'Dense wet soil', 'Deep shade'],
      problems: ['leggy-stretching', 'root-rot', 'shrivelled-pearls', 'mealybugs', 'yellow-lower-leaves'],
      tags: ['succulent', 'trailing', 'pet-safe', 'fast-growing', 'beginner']
    },

    {
      id: 'hoya-carnosa',
      common: 'Wax Plant',
      aka: ['Hoya', 'Porcelain Flower'],
      botanical: 'Hoya carnosa',
      family: 'Apocynaceae',
      origin: 'East Asia and Australia',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 200,
      water: {
        warm: 12, cool: 21, soakPct: 0.2, dryBetween: true,
        note: 'Thick waxy leaves store water. Let the soil dry most of the way through — this is an epiphyte, and its roots want air.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light is what produces those clusters of scented star flowers. It may take a few years to bloom, and patience is the main requirement.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 28],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced feed; high-potassium encourages blooms' },
      soil: 'Chunky epiphyte mix — orchid bark, perlite and a little coco coir.',
      repot: 'Every 3 years at most. It flowers best when pot-bound and resents disturbance.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets. The flowers produce sticky nectar that can drip — worth knowing for furniture rather than for safety.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Take a cutting with two or three pairs of leaves, cutting just below a node.',
          'Remove the lowest pair of leaves.',
          'Root in water, damp sphagnum moss or perlite.',
          'Once roots reach 3–4cm, pot into a chunky airy mix.'
        ]
      }],
      likes: ['Being left pot-bound', 'Bright light', 'Drying out between drinks', 'Something to climb or trail from'],
      dislikes: ['Repotting', 'Having spent flower spurs cut off — it reblooms from the same spur', 'Soggy soil'],
      problems: ['no-flowers', 'yellow-lower-leaves', 'root-rot', 'mealybugs', 'leggy-stretching'],
      tags: ['trailing', 'climbing', 'pet-safe', 'flowering', 'beginner']
    },

    {
      id: 'tradescantia-zebrina',
      common: 'Inch Plant',
      aka: ['Wandering Dude', 'Silver Inch Plant'],
      botanical: 'Tradescantia zebrina',
      family: 'Commelinaceae',
      origin: 'Southern Mexico and Central America',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 120,
      water: {
        warm: 6, cool: 11, soakPct: 0.25, dryBetween: true,
        note: 'Keep lightly moist in summer — it grows fast and drinks accordingly. Let the top 2cm dry between waterings.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light produces the deep purple undersides and silver stripes. In dim light it fades to a dull green and grows leggy.'
      },
      humidity: 'medium', minC: 10, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      tox: { cats: 'mild', dogs: 'mild', humans: 'mild',
        note: 'The sap causes contact dermatitis in pets and people — itchy skin and mild stomach upset if eaten. Not dangerous, but wear gloves if you are sensitive.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Any time of year', roots: '1–2 weeks',
        steps: [
          'Snip any 8cm length of stem below a node — this plant roots with almost comical ease.',
          'Strip the bottom leaves and stand in water, or push straight into damp soil.',
          'Roots often appear within a week.',
          'Plant five or six cuttings per pot for the full, cascading look.'
        ]
      }],
      likes: ['Hard pinching back — it gets bald and leggy otherwise', 'Bright light', 'Hanging baskets'],
      dislikes: ['Low light', 'Being left unpruned', 'Soggy soil'],
      problems: ['leggy-stretching', 'variegation-loss', 'brown-crispy-edges', 'yellow-lower-leaves', 'spider-mites'],
      tags: ['trailing', 'fast-growing', 'colourful', 'beginner', 'easy-propagation']
    },

    {
      id: 'syngonium-podophyllum',
      common: 'Arrowhead Plant',
      aka: ['Goosefoot', 'Syngonium'],
      botanical: 'Syngonium podophyllum',
      family: 'Araceae',
      origin: 'Central and South America',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 150,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Let the top third dry out. Fast-growing and forgiving of the occasional missed watering.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Pink and variegated cultivars need brighter light to hold their colour. The plain green forms cope with genuinely dim rooms.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 27],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals — oral burning, drooling and vomiting if chewed.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
        steps: [
          'Cut below a node, keeping two or three leaves.',
          'Root in water or damp moss.',
          'Pot up once roots reach 4cm.',
          'Pinch the growing tips to keep it bushy rather than letting it vine.'
        ]
      }],
      likes: ['Regular pinching to stay compact', 'A pole to climb — leaves change shape and get larger', 'Warmth'],
      dislikes: ['Direct sun', 'Cold draughts', 'Drying out completely'],
      problems: ['yellow-lower-leaves', 'leggy-stretching', 'brown-crispy-edges', 'spider-mites', 'variegation-loss'],
      tags: ['trailing', 'climbing', 'beginner', 'fast-growing', 'colourful', 'low-light']
    },

    {
      id: 'hedera-helix',
      common: 'English Ivy',
      aka: ['Common Ivy'],
      botanical: 'Hedera helix',
      family: 'Araliaceae',
      origin: 'Europe and western Asia',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 200,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Let the top 3cm dry out. Prefers to run a little dry rather than wet, and cool roots.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Variegated forms need brighter light. Direct sun scorches the leaves, and heat brings on spider mites.'
      },
      humidity: 'medium', minC: 5, idealC: [13, 21],
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'Contains triterpenoid saponins. Causes vomiting, diarrhoea, drooling and abdominal pain; the sap also gives many people contact dermatitis.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–4 weeks',
        steps: [
          'Take a 10cm cutting from a young, flexible stem below a node.',
          'Strip the lower leaves and stand in water or damp mix.',
          'Keep cool and out of direct sun.',
          'Pot up once roots are established.'
        ]
      }],
      likes: ['Cool rooms — it dislikes central heating', 'Regular misting to deter spider mites', 'Being cut back hard'],
      dislikes: ['Hot dry air', 'Direct sun', 'Waterlogged soil'],
      problems: ['spider-mites', 'brown-crispy-edges', 'variegation-loss', 'leggy-stretching', 'yellow-lower-leaves'],
      tags: ['trailing', 'climbing', 'fast-growing', 'cool-tolerant', 'low-light']
    },

    {
      id: 'scindapsus-pictus',
      common: 'Satin Pothos',
      aka: ['Silver Pothos', 'Silk Pothos', 'Scindapsus'],
      botanical: 'Scindapsus pictus',
      family: 'Araceae',
      origin: 'Forests of Southeast Asia, from Thailand to the Philippines',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 200,
      water: {
        warm: 8, cool: 14, soakPct: 0.25, dryBetween: true,
        note: 'Let the top half of the pot dry, then water thoroughly. The leaves curl inward along their length when it is thirsty and flatten again within a day of a drink.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'Bright indirect light keeps the silver splash bright. It copes with low light, growing slower and greener; direct sun scorches it.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 29],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'A standard indoor potting mix with orchid bark and perlite for drainage.',
      repot: 'Every 2 years in spring.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Listed by the ASPCA as toxic to cats and dogs. Calcium oxalate crystals cause mouth irritation, drooling and vomiting if chewed. Not a true pothos, but just as harmful.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'Cut a length of vine with at least two nodes, just below a node.',
          'Stand it in water with the nodes submerged, or push the nodes into damp mix.',
          'It roots more slowly than Golden Pothos; keep it warm.',
          'Pot several cuttings together for a fuller plant.'
        ]
      }],
      likes: ['Drying out between drinks', 'Something to trail from or climb', 'Warmth'],
      dislikes: ['Wet soil', 'Cold windowsills', 'Direct sun'],
      problems: ['overwatering', 'root-rot', 'underwatering', 'leaves-curling', 'yellow-lower-leaves', 'leggy-stretching'],
      tags: ['trailing', 'climbing', 'beginner', 'low-light', 'patterned']
    },

    {
      id: 'rhaphidophora-tetrasperma',
      common: 'Mini Monstera',
      aka: ['Monstera Minima', 'Philodendron Minima', 'Ginny'],
      botanical: 'Rhaphidophora tetrasperma',
      family: 'Araceae',
      origin: 'Rainforests of southern Thailand and Peninsular Malaysia',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 200,
      water: {
        warm: 7, cool: 12, soakPct: 0.25, dryBetween: true,
        note: 'Water when the top 3–5cm of soil is dry, thoroughly, then let it drain.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light gives large, deeply split leaves. In low light new leaves come small and unsplit on long bare stems.'
      },
      humidity: 'medium', minC: 15, idealC: [18, 28],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Chunky and free-draining: two parts potting mix, one part perlite, one part orchid bark.',
      repot: 'Every 1–2 years in spring. Give it a moss pole or plank to climb at the same time.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Not listed by the ASPCA. Like Monstera and the other aroids, it contains insoluble calcium oxalate crystals, which cause mouth pain, drooling and vomiting if chewed.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '2–4 weeks',
        steps: [
          'Cut a stem 2–3cm below a node, with one or two leaves. A node without a leaf still roots.',
          'Stand the node in water, or in damp sphagnum moss.',
          'Pot into chunky mix once the roots are 5cm long.',
          'Cut back a leggy plant this way and the stump branches from below the cut.'
        ]
      }],
      likes: ['Something to climb', 'Bright indirect light', 'Room to grow fast'],
      dislikes: ['Low light', 'Wet soil', 'Cold draughts'],
      problems: ['overwatering', 'spider-mites', 'thrips', 'needs-support', 'yellow-lower-leaves', 'leggy-stretching'],
      tags: ['climbing', 'fast-growing', 'beginner', 'easy-propagation']
    },

    {
      id: 'hoya-kerrii',
      common: 'Sweetheart Hoya',
      aka: ['Valentine Hoya', 'Wax Heart', 'Lucky Heart'],
      botanical: 'Hoya kerrii',
      family: 'Apocynaceae',
      origin: 'Forests of Thailand, Laos, Cambodia and Vietnam',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 150,
      water: {
        warm: 14, cool: 28, soakPct: 0.2, dryBetween: true,
        note: 'The thick heart-shaped leaves store water, so let the soil dry right through before watering. Soft, wrinkled leaves mean it is thirsty.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light, with some gentle direct sun if you have it, which it needs to flower. In low light it stops growing.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 28],
      fert: { everyDays: 42, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Very airy: orchid bark, perlite and potting mix in equal parts.',
      repot: 'Rarely. It flowers best snug in its pot.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Single hearts are often sold potted on their own. A leaf with no piece of stem and node at its base roots but never grows a vine.',
          'For a plant that will climb, cut a length of vine with at least one node and a leaf or two.',
          'Push the node into damp, airy mix, or root it in water first.',
          'Keep it warm and bright. A new vine can take months to appear.'
        ]
      }],
      likes: ['Drying out completely', 'Bright light', 'A snug pot'],
      dislikes: ['Wet soil', 'Being moved while in bud', 'Low light'],
      problems: ['overwatering', 'root-rot', 'mealybugs', 'no-flowers', 'mushy-base'],
      tags: ['pet-safe', 'beginner', 'trailing', 'drought-tolerant', 'unusual']
    },

    /* ====================== FLOWERING ====================== */
    {
      id: 'phalaenopsis-orchid',
      common: 'Moth Orchid',
      aka: ['Phalaenopsis', 'Phal'],
      botanical: 'Phalaenopsis hybrids',
      family: 'Orchidaceae',
      origin: 'Tropical Asia and northern Australia',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 45,
      water: {
        warm: 7, cool: 10, soakPct: 0.4, dryBetween: true,
        note: 'Do not water the pot — soak it. Hold the whole pot under a running tap or in a bowl for a minute, then let it drain completely. Healthy roots are silver-green when dry and bright green when wet.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'An east-facing sill is close to perfect. Leaves should be a mid olive-green; dark green means too little light, reddish means too much.'
      },
      humidity: 'high', minC: 16, idealC: [18, 28],
      fert: { everyDays: 14, strength: 'quarter', type: 'Orchid feed — weakly, weekly' },
      soil: 'No soil at all. Coarse bark chips only — it is an epiphyte that grows on tree trunks, and compost will rot its roots.',
      repot: 'Every 2 years after flowering, into fresh bark. Trim any dead, papery roots.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets — one of the best flowering choices for a pet household.' },
      prop: [{
        m: 'Keiki (baby plant)', diff: 'medium', season: 'After flowering', roots: '6–12 months',
        steps: [
          'Occasionally a plantlet — a keiki — forms on an old flower spike.',
          'Leave it attached until it has two or three leaves and roots at least 5cm long.',
          'Cut the spike 3cm either side of the keiki.',
          'Pot into fine bark and keep humid.',
          'Note that dividing the main plant is not possible; it grows from a single point.'
        ]
      }],
      likes: ['A thorough soak then complete drainage', 'Bright indirect light', 'A 5–10°C night-time temperature drop to trigger flowering'],
      dislikes: ['Water sitting in the crown between the leaves', 'Being potted in soil', 'Ice cubes — a persistent and harmful myth', 'Cold draughts'],
      problems: ['no-flowers', 'bud-drop', 'root-rot', 'crown-rot', 'yellow-lower-leaves', 'limp-leaves'],
      tags: ['flowering', 'pet-safe', 'epiphyte', 'bathroom', 'humidity-lover']
    },

    {
      id: 'saintpaulia-ionantha',
      common: 'African Violet',
      aka: ['Saintpaulia', 'Streptocarpus ionanthus'],
      botanical: 'Streptocarpus ionanthus',
      family: 'Gesneriaceae',
      origin: 'Cloud forests of Tanzania and Kenya',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 15,
      water: {
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: true, method: 'bottom',
        note: 'Water from below — stand the pot in a saucer of tepid water for 20 minutes, then tip away what is left. Water on those furry leaves causes brown spots and rot.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light for 12 hours a day keeps it flowering almost continuously. It does very well under a simple desk grow light.'
      },
      humidity: 'medium', minC: 16, idealC: [18, 24],
      fert: { everyDays: 14, strength: 'quarter', type: 'African violet feed, high in phosphorus' },
      soil: 'Light, airy African violet mix — peat-free compost with plenty of perlite and vermiculite.',
      repot: 'Annually into the same size pot with fresh mix. It flowers best slightly pot-bound.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and safe around pets — a lovely, genuinely safe flowering option.' },
      prop: [{
        m: 'Leaf cutting', diff: 'easy', season: 'Spring or summer', roots: '6–10 weeks',
        steps: [
          'Choose a healthy mid-sized leaf and cut the stalk to about 3cm, at a 45-degree angle.',
          'Push the stalk 1.5cm into damp African violet mix at a slight angle.',
          'Cover with a clear bag or box to hold humidity, and keep at 21°C.',
          'Tiny plantlets appear at the base of the stalk after two months or so.',
          'Separate them once each has three or four small leaves of its own.'
        ]
      }],
      likes: ['Bottom watering with tepid water', 'Consistent bright indirect light', 'Small pots', 'Deadheading spent blooms'],
      dislikes: ['Water on the leaves', 'Cold water', 'Direct sun', 'Draughts'],
      problems: ['no-flowers', 'brown-spots-leaves', 'crown-rot', 'leggy-stretching', 'powdery-mildew', 'mealybugs'],
      tags: ['flowering', 'pet-safe', 'compact', 'colourful', 'office']
    },

    {
      id: 'begonia-maculata',
      common: 'Polka Dot Begonia',
      aka: ['Spotted Begonia', 'Angel Wing Begonia'],
      botanical: 'Begonia maculata',
      family: 'Begoniaceae',
      origin: 'Brazilian Atlantic rainforest',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 120,
      water: {
        warm: 6, cool: 11, soakPct: 0.25, dryBetween: true,
        note: 'Let the top 2–3cm dry, then water at the base. Wet leaves in still air lead to powdery mildew, which begonias are prone to.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light keeps the silver spots crisp and the red undersides deep. Direct sun bleaches and burns.'
      },
      humidity: 'high', minC: 15, idealC: [18, 26],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced feed while in growth' },
      soil: 'Light and airy — peat-free compost with perlite for sharp drainage.',
      repot: 'Annually in spring; it grows quickly and gets top-heavy.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Soluble calcium oxalates. Causes drooling, vomiting and difficulty swallowing; the underground tubers are the most concentrated part.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '3–4 weeks',
        steps: [
          'Cut a stem below a node, keeping two leaves.',
          'Root in water — begonias root readily this way and you can watch progress.',
          'Change the water twice weekly to prevent the stem rotting.',
          'Pot into airy mix once roots reach 4cm, and pinch the tip to encourage branching.'
        ]
      }],
      likes: ['High humidity with good air movement', 'Bright indirect light', 'Regular pruning — it gets leggy fast'],
      dislikes: ['Wet leaves', 'Stagnant humid air', 'Direct sun', 'Waterlogging'],
      problems: ['powdery-mildew', 'leaves-falling-off', 'brown-crispy-edges', 'leggy-stretching', 'spider-mites'],
      tags: ['patterned', 'colourful', 'fast-growing', 'humidity-lover', 'dramatic']
    },

    {
      id: 'dendrobium-nobile',
      common: 'Dendrobium',
      aka: ['Noble Dendrobium', 'Cane Orchid'],
      botanical: 'Dendrobium nobile',
      family: 'Orchidaceae',
      origin: 'Monsoon forests from the Himalayan foothills to southern China and Indochina',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 60,
      water: {
        warm: 7, cool: 21, soakPct: 0.4, dryBetween: true,
        note: 'Water freely while new canes are growing in spring and summer, letting the bark dry a little between drinks. From mid-autumn water only enough to stop the canes shrivelling: that dry, cool rest is what sets the flower buds.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'More light than a Moth Orchid, including some morning sun. In medium light it grows leaves but rarely flowers.'
      },
      humidity: 'medium', minC: 10, idealC: [15, 27],
      fert: { everyDays: 14, strength: 'quarter', type: 'Orchid feed, stopped from mid-autumn until buds show' },
      soil: 'Medium-grade orchid bark, in a pot only just large enough for the roots.',
      repot: 'Every 2–3 years, after flowering, when new growth starts.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA; the related Dendrobium gracilicaule is listed as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Keikis (baby plants)', diff: 'easy', season: 'Spring or summer', roots: 'Already rooted',
        steps: [
          'Small plants called keikis sometimes grow from the nodes of old canes, often when the winter rest was too warm.',
          'Leave one on the cane until it has two or three roots 3–5cm long.',
          'Cut it away with a little of the cane and pot it in fine orchid bark.',
          'Care for it as the parent. It flowers in two to three years.'
        ]
      }],
      likes: ['A cool, dry autumn rest', 'Bright light with morning sun', 'Cool nights'],
      dislikes: ['A warm winter', 'Constant watering', 'Low light'],
      problems: ['needs-rest-period', 'no-flowers', 'root-rot', 'mealybugs', 'bud-drop', 'yellow-lower-leaves'],
      tags: ['pet-safe', 'flowering', 'epiphyte', 'cool-tolerant']
    },

    {
      id: 'streptocarpus-hybrids',
      common: 'Cape Primrose',
      aka: ['Streptocarpus', 'Strep'],
      botanical: 'Streptocarpus hybrids',
      family: 'Gesneriaceae',
      origin: 'Hybrids of species from the forests and shaded gorges of South Africa',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 30,
      water: {
        warm: 6, cool: 10, soakPct: 0.2, dryBetween: true,
        note: 'Let the top of the mix dry, then water at the soil, under the leaves. It has fine, shallow roots and takes a slightly dry pot far better than a wet one.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright light without sun, such as an east window, keeps it flowering from spring into autumn.'
      },
      humidity: 'medium', minC: 10, idealC: [16, 24],
      fert: { everyDays: 14, strength: 'quarter', type: 'High-potassium feed, such as tomato feed, while flowering' },
      soil: 'Light and open: peat-free compost with plenty of perlite. African violet mix suits it.',
      repot: 'Every spring into a wide, shallow pot only a little larger. It flowers best slightly cramped.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs (Streptocarpus species).' },
      prop: [
        { m: 'Leaf cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
          steps: [
            'Take a healthy leaf and cut out the midrib down its length, leaving two halves.',
            'Push each half, cut edge down, 1cm into damp seed compost.',
            'Cover the tray and keep it warm and bright, out of sun.',
            'Small plants appear along the cut veins in about two months.'
          ] },
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Already rooted',
          steps: [
            'An older plant grows into several crowns.',
            'Unpot it and gently pull the crowns apart, each with its own roots.',
            'Pot each into fresh mix and keep it out of sun for a week.'
          ] }
      ],
      likes: ['Bright light without sun', 'Drying a little between drinks', 'Spent flower stalks cut off'],
      dislikes: ['A wet pot', 'Direct sun', 'Water on the leaves'],
      problems: ['no-flowers', 'overwatering', 'root-rot', 'drooping', 'brown-tips-only', 'mealybugs', 'thrips'],
      tags: ['pet-safe', 'beginner', 'flowering', 'compact', 'colourful']
    },

    {
      id: 'episcia-reptans',
      common: 'Flame Violet',
      aka: ['Flame African Violet', 'Episcia', 'Carpet Plant'],
      botanical: 'Episcia reptans',
      family: 'Gesneriaceae',
      origin: 'Rainforest floor of northern South America',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 15,
      water: {
        warm: 5, cool: 9, soakPct: 0.2, dryBetween: false,
        note: 'Keep the mix lightly moist, watering at the soil with tepid water once the surface feels dry. Cold water on the leaves leaves pale marks.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light brings out the metallic sheen on the leaves and the red flowers. Direct sun scorches it.'
      },
      humidity: 'high', minC: 15, idealC: [20, 28],
      fert: { everyDays: 14, strength: 'quarter', type: 'African violet feed' },
      soil: 'Light, airy African violet mix.',
      repot: 'Every spring into a wide, shallow pot or a hanging basket.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs, as the Flame African Violet.' },
      prop: [{
        m: 'Runners', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
        steps: [
          'It sends out runners with a small plant at each tip, like a strawberry.',
          'Pin a plantlet onto a small pot of damp mix beside the parent, still attached.',
          'Cut the runner once the plantlet has rooted and is growing by itself.'
        ]
      }],
      likes: ['Humid air', 'Warmth', 'Tepid water'],
      dislikes: ['Cold water', 'Dry air', 'Direct sun'],
      problems: ['low-humidity', 'brown-crispy-edges', 'cold-damage', 'no-flowers', 'overwatering', 'mealybugs'],
      tags: ['pet-safe', 'flowering', 'humidity-lover', 'compact', 'trailing', 'colourful', 'terrarium']
    },

    {
      id: 'jasminum-polyanthum',
      common: 'Pink Jasmine',
      aka: ['Jasmine', 'Many-flowered Jasmine', 'Chinese Jasmine'],
      botanical: 'Jasminum polyanthum',
      family: 'Oleaceae',
      origin: 'Hillsides and forest edges of south-west China and Myanmar',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 200,
      water: {
        warm: 4, cool: 8, soakPct: 0.3, dryBetween: false,
        note: 'Keep the mix evenly moist while it grows and flowers, letting only the surface dry. It drinks hard in bud, and dry roots drop the buds before they open.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'As much bright light as you can give it, with some direct sun. In medium light it grows long bare stems and few flowers.'
      },
      humidity: 'medium', minC: 3, idealC: [10, 22],
      fert: { everyDays: 14, strength: 'half', type: 'High-potassium feed from spring until the buds form' },
      soil: 'Loam-based compost with a little grit.',
      repot: 'Every 1–2 years, straight after flowering. Prune it hard then too, or it becomes a tangle.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs (Jasminum species). Not to be confused with Star Jasmine, which is a different genus, or Carolina Jasmine, which is poisonous.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Summer', roots: '4–6 weeks',
        steps: [
          'Cut a 10cm length of this year\'s growth, just below a leaf joint.',
          'Strip the lower leaves and dip the cut end in rooting powder.',
          'Push it into damp gritty compost and cover it with a clear bag.',
          'Keep it bright, out of direct sun, until new leaves show.'
        ]
      }],
      likes: ['A cool autumn to set buds', 'Bright light', 'Something to climb'],
      dislikes: ['A warm room all year', 'Drying out in bud', 'Low light'],
      problems: ['needs-rest-period', 'no-flowers', 'bud-drop', 'underwatering', 'needs-pruning', 'needs-support', 'spider-mites', 'aphids'],
      tags: ['pet-safe', 'flowering', 'climbing', 'scented', 'fast-growing', 'cool-tolerant']
    },

    {
      id: 'cyclamen-persicum',
      common: 'Cyclamen',
      aka: ['Florist\'s Cyclamen', 'Sowbread'],
      botanical: 'Cyclamen persicum',
      family: 'Primulaceae',
      origin: 'Rocky woodland and scrub of the eastern Mediterranean, from Turkey to Israel',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 25,
      water: {
        warm: 7, cool: 5, dryBetween: true, method: 'bottom',
        seasons: { spring: 7, summer: 0, autumn: 5, winter: 5 },
        note: 'Water from below: stand the pot in water for 15–20 minutes, then let it drain. Water on the tuber at the centre rots it. It grows and flowers from autumn through winter. As the leaves yellow in spring, water less, and through summer give it none while it rests, the dry tuber kept somewhere cool and shaded.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright light and cool air. A warm living room ends the flowering in a few weeks; a cool, bright sill keeps it going for months.'
      },
      humidity: 'medium', minC: 5, idealC: [10, 18],
      fert: { everyDays: 14, strength: 'half', type: 'High-potassium feed while it is in leaf and flower', seasons: ['autumn', 'winter'] },
      soil: 'Loam-based compost with a little grit.',
      repot: 'In late summer, as it wakes, into fresh mix with the top half of the tuber above the surface.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'toxic',
        note: 'Listed by the ASPCA as toxic to cats and dogs (Cyclamen species). Terpenoid saponins cause drooling, vomiting and diarrhoea. The tuber is the most toxic part: eating a large amount of it can cause heart rhythm problems, seizures and death.' },
      prop: [{
        m: 'Seed', diff: 'hard', season: 'Late summer or autumn', roots: 'Germinates in 4–8 weeks',
        steps: [
          'A cyclamen tuber cannot be divided, so new plants come only from seed.',
          'Soak the seed overnight and sow it 5mm deep in damp seed compost.',
          'Keep it dark and cool, at 15–18°C, until the seedlings come up: light and warmth slow germination.',
          'Grow the seedlings on somewhere bright and cool. They flower in their second autumn.'
        ]
      }],
      likes: ['Cool, bright rooms', 'Water from below', 'A dry summer rest'],
      dislikes: ['Central heating', 'Water on the tuber', 'Water while it rests'],
      problems: ['dormancy', 'dormancy-dieback', 'yellow-lower-leaves', 'crown-rot', 'bud-drop', 'overwatering', 'spider-mites'],
      tags: ['flowering', 'colourful', 'compact', 'cool-tolerant']
    },

    /* ====================== EDIBLE & HERBS ====================== */
    {
      id: 'ocimum-basilicum',
      common: 'Basil',
      aka: ['Sweet Basil'],
      botanical: 'Ocimum basilicum',
      family: 'Lamiaceae',
      origin: 'Tropical Asia and Africa',
      difficulty: 'medium',
      growthRate: 'fast',
      matureCm: 45,
      water: {
        warm: 2, cool: 4, soakPct: 0.3, dryBetween: false,
        note: 'Thirsty and shallow-rooted. Water in the morning at the base as soon as the surface dries — wilting basil recovers, but its flavour suffers.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'Needs six hours or more of direct sun. A sunny kitchen sill is the classic spot; anything less and it grows pale and leggy.'
      },
      humidity: 'medium', minC: 12, idealC: [20, 28],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced feed — high nitrogen for leaf growth' },
      soil: 'Rich, moisture-retentive potting compost with a little perlite.',
      repot: 'Treat as an annual. Sow fresh seed each spring rather than trying to overwinter it.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and edible for people. Safe for cats and dogs, though large amounts may cause mild stomach upset.' },
      prop: [{
        m: 'Stem cutting', diff: 'easy', season: 'Spring or summer', roots: '1–2 weeks',
        steps: [
          'Cut a 10cm non-flowering stem just below a node.',
          'Strip the lower leaves and stand in a glass of water on a sunny sill.',
          'Roots appear within a week or so.',
          'Pot up once roots reach 3cm.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Early spring, indoors', germDays: '5–10 days', depthMm: 5,
        steps: [
          'Fill a shallow tray with damp seed compost and firm it gently.',
          'Scatter seed thinly and cover with 5mm of compost.',
          'Keep at 20–25°C — warmth is the key to germination. A windowsill above a radiator works well.',
          'Keep the surface damp with a mister rather than a watering can.',
          'Once seedlings have two true leaves, thin to the strongest and pot on into individual pots.',
          'Pinch out the growing tip at six leaves to force bushy growth rather than one tall stem.'
        ]
      },
      likes: ['Full sun', 'Regular harvesting from the top', 'Pinching out flower buds to keep leaves coming', 'Warm mornings'],
      dislikes: ['Cold below 12°C', 'Drying out', 'Wet leaves overnight', 'Being harvested leaf-by-leaf from the bottom'],
      problems: ['leggy-stretching', 'drooping', 'powdery-mildew', 'aphids', 'bolting', 'yellow-lower-leaves'],
      tags: ['edible', 'herb', 'sun-lover', 'pet-safe', 'fast-growing', 'kitchen']
    },

    {
      id: 'mentha-spicata',
      common: 'Mint',
      aka: ['Spearmint', 'Garden Mint'],
      botanical: 'Mentha spicata',
      family: 'Lamiaceae',
      origin: 'Europe and southern Asia',
      difficulty: 'easy',
      growthRate: 'fast',
      matureCm: 40,
      water: {
        warm: 3, cool: 6, soakPct: 0.3, dryBetween: false,
        note: 'Likes consistently damp soil — more so than most herbs. Water whenever the surface feels dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Happy in bright indirect light or gentle direct sun. More tolerant of shade than basil or rosemary.'
      },
      humidity: 'medium', minC: 0, idealC: [15, 24],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced feed' },
      soil: 'Moisture-retentive potting compost.',
      repot: 'Annually — it fills a pot with runners quickly and gets congested. Always grow it in its own pot; it will strangle anything it shares with.',
      tox: { cats: 'mild', dogs: 'mild', humans: 'safe',
        note: 'Edible and safe for people. Large quantities can cause vomiting and diarrhoea in cats and dogs, and the concentrated essential oil is genuinely toxic to them.' },
      prop: [{
        m: 'Stem cutting or runner division', diff: 'easy', season: 'Any time in the growing season', roots: '1–2 weeks',
        steps: [
          'Snip a 10cm stem below a node, or simply pull up a rooted runner from the edge of the pot.',
          'Stand cuttings in water — mint roots almost instantly.',
          'Pot up once roots appear.',
          'It is famously vigorous; one plant will supply a household.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Spring', germDays: '10–15 days', depthMm: 3,
        steps: [
          'Sow thinly on the surface of damp seed compost and barely cover.',
          'Keep at 18–21°C and evenly moist.',
          'Germination is uneven — do not be surprised if only half come up.',
          'Pot on when seedlings have four true leaves.',
          'Honestly, cuttings or division are quicker and give a truer plant — named varieties do not come true from seed.'
        ]
      },
      likes: ['Damp soil', 'Its own pot', 'Hard harvesting — it comes back stronger', 'Cool conditions'],
      dislikes: ['Drying out', 'Sharing a pot', 'Deep shade'],
      problems: ['powdery-mildew', 'aphids', 'leggy-stretching', 'rust', 'drooping'],
      tags: ['edible', 'herb', 'fast-growing', 'kitchen', 'cool-tolerant', 'beginner']
    },

    {
      id: 'rosmarinus-officinalis',
      common: 'Rosemary',
      aka: ['Salvia rosmarinus'],
      botanical: 'Salvia rosmarinus',
      family: 'Lamiaceae',
      origin: 'The Mediterranean',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 90,
      water: {
        warm: 8, cool: 16, soakPct: 0.2, dryBetween: true,
        note: 'A Mediterranean shrub — it wants far less water than people give it. Let the soil dry well down before watering, and never let it stand wet.'
      },
      light: {
        ideal: 'direct', tolerates: [], avoid: ['low', 'medium', 'bright-indirect'],
        note: 'Needs six to eight hours of direct sun. It genuinely struggles as an indoor plant unless you have a very sunny sill or a grow light.'
      },
      humidity: 'low', minC: -5, idealC: [15, 26],
      fert: { everyDays: 56, strength: 'quarter', type: 'Light balanced feed — rich soil reduces the aromatic oils' },
      soil: 'Gritty and free-draining, on the poor side — potting mix with plenty of coarse sand or perlite.',
      repot: 'Every 2 years into a terracotta pot, which suits its need for dry roots.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Non-toxic and culinary. Safe for cats and dogs in the quantities they would realistically nibble.' },
      prop: [{
        m: 'Semi-ripe stem cutting', diff: 'medium', season: 'Late summer', roots: '4–8 weeks',
        steps: [
          'Take 10cm cuttings from this year\'s growth, where the stem is firm but not yet woody.',
          'Strip the lower two-thirds of needles.',
          'Dip in rooting hormone and push into gritty, free-draining mix.',
          'Keep just barely damp in bright light — too much water rots rosemary cuttings.',
          'Seed is slow and unreliable; cuttings are much the better route.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Early spring, indoors', germDays: '14–28 days', depthMm: 3,
        steps: [
          'Germination is patchy, often under half, so sow three times as many seeds as you want plants.',
          'Scatter seed on damp seed compost and cover with a thin layer, no more than 3mm.',
          'Keep it at 18–25°C and only just damp. Wet compost rots the seedlings.',
          'Pot on into gritty mix once seedlings have four true leaves.',
          'Seedlings take a year to make a useful bush. Cuttings are quicker and stay true to the parent.'
        ]
      },
      likes: ['All the direct sun available', 'Dry roots and good airflow', 'Terracotta pots', 'Regular light pruning'],
      dislikes: ['Overwatering — the usual cause of death', 'Humid stagnant air', 'Rich soil', 'Low light'],
      problems: ['root-rot', 'powdery-mildew', 'brown-crispy-edges', 'leggy-stretching', 'spider-mites'],
      tags: ['edible', 'herb', 'sun-lover', 'pet-safe', 'drought-tolerant', 'kitchen']
    },

    {
      id: 'thymus-vulgaris',
      common: 'Thyme',
      aka: ['Common Thyme', 'Garden Thyme'],
      botanical: 'Thymus vulgaris',
      family: 'Lamiaceae',
      origin: 'Dry, rocky hillsides of the western Mediterranean',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 25,
      water: {
        warm: 7, cool: 14, soakPct: 0.2, dryBetween: true,
        note: 'Let the soil dry almost completely, then water thoroughly. It is a Mediterranean shrub: too much water kills it far more often than too little.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'The sunniest windowsill you have, six hours of sun or more. In weaker light it grows thin, pale and flavourless.'
      },
      humidity: 'low', minC: 0, idealC: [15, 25],
      fert: { everyDays: 42, strength: 'quarter', type: 'Balanced liquid feed; lean conditions give the strongest flavour' },
      soil: 'Gritty and poor: two parts potting mix to one part horticultural grit.',
      repot: 'Every 1–2 years in spring, or replace it with a young plant once it turns woody and sparse.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Edible. Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Softwood cutting', diff: 'easy', season: 'Late spring or summer', roots: '3–4 weeks',
        steps: [
          'Snip 5–8cm of soft, non-flowering shoot, just below a leaf joint.',
          'Strip the lower leaves and push the stems into gritty compost.',
          'Keep the compost just damp and the cuttings out of direct sun until they root.',
          'Pinch out the tips once they grow to make a bushy plant.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Spring, indoors', germDays: '14–28 days', depthMm: 1,
        steps: [
          'Sow thinly on the surface of damp seed compost and press in lightly; the seed is tiny.',
          'Keep it at 18–22°C and only just damp.',
          'Thin the seedlings and pot them on in small clumps once they have a few true leaves.',
          'Harvest lightly in the first year so the young plants bulk up.'
        ]
      },
      likes: ['Full sun', 'Gritty soil', 'Regular trimming'],
      dislikes: ['Wet soil', 'Shade', 'Rich compost'],
      problems: ['overwatering', 'root-rot', 'needs-pruning', 'leggy-stretching', 'powdery-mildew', 'yellow-lower-leaves'],
      tags: ['pet-safe', 'edible', 'herb', 'kitchen', 'sun-lover', 'compact', 'drought-tolerant', 'cool-tolerant']
    },

    {
      id: 'fragaria-vesca',
      common: 'Alpine Strawberry',
      aka: ['Woodland Strawberry', 'Wild Strawberry', 'Fraise des Bois'],
      botanical: 'Fragaria vesca',
      family: 'Rosaceae',
      origin: 'Woodland edges and clearings across Europe, northern Asia and North America',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 20,
      water: {
        warm: 3, cool: 7, soakPct: 0.3, dryBetween: false,
        note: 'Keep the compost evenly moist while it flowers and fruits, watering at the soil rather than over the leaves and fruit, which rot when kept wet. A small pot in sun dries out fast.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'A sunny sill, with four hours of sun or more, for fruit. In bright shade it stays leafy and fruits sparingly.'
      },
      humidity: 'medium', minC: 0, idealC: [12, 24],
      fert: { everyDays: 14, strength: 'half', type: 'High-potassium feed, such as tomato feed, once flowering starts' },
      soil: 'Loam-based compost with a little grit.',
      repot: 'Each spring into fresh compost. Replace plants every three years or so, as they crop less with age.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs (Fragaria species). The fruit is edible.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Early spring', roots: 'Already rooted',
        steps: [
          'Alpine strawberries make few runners or none, so they are divided instead.',
          'Lift the plant and pull the crowns apart, each with its own roots.',
          'Pot each with the top of the crown level with the surface; buried crowns rot.',
          'Water it in and keep it out of strong sun for a week.'
        ]
      }],
      seed: {
        viable: true, sowSeason: 'Late winter or early spring, indoors', germDays: '2–4 weeks', depthMm: 1,
        steps: [
          'Sow the tiny seed on the surface of damp seed compost and barely cover it.',
          'Cover the tray and keep it at 18–21°C in bright light, out of direct sun.',
          'Prick the seedlings out into their own pots once they have three leaves.',
          'They usually fruit in their first summer.'
        ]
      },
      likes: ['Sun', 'Even moisture', 'Feeding once it flowers'],
      dislikes: ['Drying out', 'Wet leaves and fruit', 'Buried crowns'],
      problems: ['no-flowers', 'underwatering', 'aphids', 'powdery-mildew', 'spider-mites', 'leaf-spot-fungal'],
      tags: ['pet-safe', 'beginner', 'edible', 'kitchen', 'sun-lover', 'compact', 'cool-tolerant']
    },

    {
      id: 'petroselinum-crispum',
      common: 'Parsley',
      aka: ['Curly Parsley', 'Flat-leaf Parsley'],
      botanical: 'Petroselinum crispum',
      family: 'Apiaceae',
      origin: 'The central and eastern Mediterranean',
      difficulty: 'easy',
      growthRate: 'moderate',
      matureCm: 30,
      water: {
        warm: 3, cool: 6, soakPct: 0.3, dryBetween: false,
        note: 'Keep the compost evenly moist. It grows a long taproot and sulks if it dries out, then runs to seed.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'A sunny sill, ideally with morning sun. It takes a little more shade than basil, but in medium light it grows thin and pale.'
      },
      humidity: 'medium', minC: 5, idealC: [12, 24],
      fert: { everyDays: 21, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'Rich, moisture-holding compost in a deep pot, for the taproot.',
      repot: 'A biennial that runs to seed in its second spring. Sow fresh each year rather than repotting.',
      tox: { cats: 'mild', dogs: 'mild', humans: 'safe',
        note: 'Listed by the ASPCA as toxic to cats and dogs. It contains furanocoumarins, which can make the skin sensitive to sunlight, but only after a large amount is eaten. Edible for people.' },
      prop: [{
        m: 'Seed', diff: 'medium', season: 'Spring to late summer', roots: 'Germinates in 3–4 weeks',
        steps: [
          'Parsley grows from a taproot and cannot be divided or grown from cuttings.',
          'Soak the seed overnight to speed up its slow germination.',
          'Sow it thinly, 5mm deep, straight into its final pot: the taproot resents being moved.',
          'Keep the surface damp, and thin the seedlings to three or four a pot.'
        ]
      }],
      likes: ['Even moisture', 'A deep pot', 'Harvesting from the outside'],
      dislikes: ['Drying out', 'Being transplanted', 'Hot, dry rooms'],
      problems: ['bolting', 'bolting-heat-stress', 'underwatering', 'yellow-lower-leaves', 'leggy-stretching', 'aphids'],
      tags: ['beginner', 'edible', 'herb', 'kitchen', 'sun-lover', 'compact', 'cool-tolerant']
    },

    /* ====================== AIR PLANTS & BROMELIADS ======================
       All but the last are watered by a method other than pouring, which
       is why `water.method` exists (LOOKUPS.WATER_METHODS). The Earth Star
       is a ground bromeliad with no cup, rooted in soil and poured on like
       any other. Every one flowers once per rosette and then hands over to
       its pups, which is why they list 'flowered-out'. The air plants list their own rot and
       thirst in place of the general causes, whose treatments are about
       soil; the bromeliads list cup rot in place of crown rot, whose
       treatment is never to water the crown. */
    {
      id: 'tillandsia-ionantha',
      common: 'Air Plant',
      aka: ['Tillandsia', 'Sky Plant'],
      botanical: 'Tillandsia ionantha',
      family: 'Bromeliaceae',
      origin: 'Central America',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 8,
      water: {
        warm: 7, cool: 12, soakPct: 1.0, dryBetween: true, method: 'soak',
        note: 'It has no functional roots and takes water through its leaves. Submerge the whole plant in tepid water for 20–30 minutes, then shake it out hard and leave it upside down somewhere airy to dry within 4 hours. Water left in the base rots the plant.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright filtered light. Direct sun dries it out faster than it can absorb water.'
      },
      humidity: 'medium', minC: 10, idealC: [16, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad or air plant feed added to the soaking water' },
      soil: 'None at all — it grows mounted on wood, in a shell, or simply sitting in a bowl.',
      repot: 'Never. If mounted, use wire or a neutral glue, never copper, which is toxic to bromeliads.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: 'No rooting needed',
        steps: [
          'Each plant flowers once, then produces pups from its base and slowly dies — this is its natural cycle.',
          'Let a pup grow to about a third of the parent\'s size.',
          'Twist and pull it gently away from the parent.',
          'Care for it exactly as the parent. A cluster left intact makes a handsome clump.'
        ]
      }],
      likes: ['A proper soak then fast, thorough drying', 'Good air circulation', 'Bright filtered light'],
      dislikes: ['Sitting in water', 'Being potted in soil', 'Stagnant air', 'Copper'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'flowered-out', 'brown-crispy-edges', 'shrivelled-segments', 'pale-washed-out'],
      tags: ['pet-safe', 'epiphyte', 'compact', 'no-soil', 'unusual']
    },
    {
      id: 'tillandsia-xerographica',
      common: 'Xerographica',
      aka: ['King of Air Plants', 'Xerographica Air Plant'],
      botanical: 'Tillandsia xerographica',
      family: 'Bromeliaceae',
      origin: 'Dry forests of southern Mexico, Guatemala and El Salvador',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 40,
      water: {
        warm: 7, cool: 14, dryBetween: true, method: 'dip',
        note: 'A silver air plant, covered in scales that hold water well. Dip it in tepid water for a minute or two, or hold it under a running tap, then hold it upside down and shake it out. The curled leaves trap water at the base, so dry it upside down for at least an hour before it goes back.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low', 'medium'],
        note: 'The brightest air plant to keep: it takes some direct sun, and a sunny window is safer than a dim shelf. In weak light the silver turns green and the rosette loosens.'
      },
      humidity: 'low', minC: 10, idealC: [18, 30],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad or air plant feed added to the dipping water' },
      soil: 'None — it sits on a dish, a stand or a piece of wood.',
      repot: 'Never. It needs no pot at all.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in any Tillandsia. Cats like chewing the leaves, which harms the plant rather than the cat.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: 'No rooting needed',
        steps: [
          'It flowers once after several years, on a long branched spike, and then produces pups at its base.',
          'Leave each pup until it is a third of the parent\'s size. They are slow, so this can take a year.',
          'Hold the pup at its base and twist it gently away from the parent.',
          'Care for it exactly as the parent. Pups left on make a large, handsome clump.'
        ]
      }],
      likes: ['A quick dip then a thorough upside-down dry', 'Bright light with some sun', 'Being left alone'],
      dislikes: ['Long soaks', 'Water left in its curls', 'Glass globes'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'flowered-out', 'leaves-curling', 'brown-tips-only', 'mushy-base'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'statement', 'drought-tolerant', 'beginner', 'unusual']
    },

    {
      id: 'tillandsia-caput-medusae',
      common: 'Medusa\'s Head',
      aka: ['Caput-medusae', 'Octopus Air Plant'],
      botanical: 'Tillandsia caput-medusae',
      family: 'Bromeliaceae',
      origin: 'Dry forests from Mexico to Costa Rica',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 25,
      water: {
        warm: 7, cool: 12, dryBetween: true, method: 'dip',
        note: 'Its swollen base is hollow, and in the wild ants live inside it. Water that gets in has no way out, so dip it for a minute rather than soaking it, then hold it upside down and shake it out hard. Dry it upside down until the base is completely dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light, with a little morning or evening sun if you have it. It copes with a few metres back from a window, but the leaves stop curling as tightly.'
      },
      humidity: 'low', minC: 10, idealC: [18, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad or air plant feed added to the dipping water' },
      soil: 'None — sit it on a dish or a stand, or mount it base upward on wood.',
      repot: 'Never. If mounted, use wire or a neutral glue, never copper, which is toxic to bromeliads.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in any Tillandsia.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: 'No rooting needed',
        steps: [
          'After a red flower spike with violet flowers, the parent produces pups around its base.',
          'Wait until a pup is a third of the parent\'s size.',
          'Twist it gently away at the base, or leave the clump to grow on together.',
          'Care for it as the parent, taking the same care to drain the base.'
        ]
      }],
      likes: ['A brief dip then a long dry', 'Bright light', 'Moving air'],
      dislikes: ['Long soaks', 'Water left in the bulb', 'Closed glass globes'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'flowered-out', 'mushy-base', 'leaves-curling'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'compact', 'unusual']
    },

    {
      id: 'tillandsia-bulbosa',
      common: 'Bulbosa',
      aka: ['Bulbous Air Plant', 'Tillandsia Bulbosa'],
      botanical: 'Tillandsia bulbosa',
      family: 'Bromeliaceae',
      origin: 'Humid lowland forests of Central America, the Caribbean and northern South America',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 20,
      water: {
        warm: 4, cool: 7, dryBetween: true, method: 'dip',
        note: 'A green, thirsty air plant from humid forests, with a hollow bulb at its base. Dip it often rather than soaking it for long: a minute in tepid water every few days, then upside down and shaken out, so no water stays in the bulb.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright filtered light. Being a green type it wants less light than the silver ones, and direct sun dries it out faster than it can drink.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad or air plant feed added to the dipping water' },
      soil: 'None — it sits on a dish, a stand or a branch.',
      repot: 'Never. It needs no pot at all.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in any Tillandsia.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: 'No rooting needed',
        steps: [
          'Its leaves blush red when it is about to flower, and pups follow from the base.',
          'Let a pup reach a third of the parent\'s size.',
          'Twist it gently away, or leave the clump intact.',
          'Care for it as the parent.'
        ]
      }],
      likes: ['Frequent quick dips', 'Bright filtered light', 'A bathroom with a window'],
      dislikes: ['Long soaks', 'Drying out for weeks', 'Hot sun on glass'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'flowered-out', 'mushy-base', 'brown-tips-only'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'compact', 'unusual']
    },

    {
      id: 'tillandsia-tectorum',
      common: 'Snowball Air Plant',
      aka: ['Tectorum', 'Snowball'],
      botanical: 'Tillandsia tectorum',
      family: 'Bromeliaceae',
      origin: 'Rocky cliffs high in the Andes of Ecuador and Peru',
      difficulty: 'hard',
      growthRate: 'slow',
      matureCm: 15,
      water: {
        warm: 4, cool: 7, dryBetween: true, method: 'mist',
        note: 'The white fuzz is a dense coat of scales that catches water from mist and cloud. Mist it until the whole plant is wet, two or three times a week, and never soak it: a soak saturates the fuzz and rots it from the centre. It should be dry again within a couple of hours.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'It grows in full mountain sun and needs the brightest spot you have. Short of that, the fuzz thins and the plant slowly fades.'
      },
      humidity: 'low', minC: 7, idealC: [12, 26],
      fert: { everyDays: 42, strength: 'quarter', type: 'Bromeliad or air plant feed added to the misting water' },
      soil: 'None — set it on a dish or stand where air moves freely around it.',
      repot: 'Never. It needs no pot at all.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in any Tillandsia.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'medium', season: 'After flowering', roots: 'No rooting needed',
        steps: [
          'It is slow to flower and slow to pup, so expect to wait years.',
          'Leave pups on until they are a third of the parent\'s size.',
          'Twist one away at the base, taking care not to rub off the fuzz.',
          'Mist it as the parent and keep it in the same bright spot.'
        ]
      }],
      likes: ['Full sun', 'Light misting and fast drying', 'Cool nights'],
      dislikes: ['Soaking', 'Dim rooms', 'Still, humid air'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'flowered-out', 'mushy-base', 'pale-washed-out'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'compact', 'sun-lover', 'unusual', 'tricky']
    },

    {
      id: 'tillandsia-usneoides',
      common: 'Spanish Moss',
      aka: ['Old Man\'s Beard', 'Usneoides'],
      botanical: 'Tillandsia usneoides',
      family: 'Bromeliaceae',
      origin: 'Humid forests from the south-eastern United States to Argentina',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 100,
      water: {
        warm: 3, cool: 5, dryBetween: true, method: 'mist',
        note: 'Not a moss but a bromeliad with no roots at all, hanging in long silver strands. Mist it until it darkens and turns slightly green, every two or three days in a heated room. It can also be dunked once a week instead, then hung up and shaken so the strands dry within a few hours.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'direct'], avoid: ['low'],
        note: 'Bright light, with some sun if the air is not too dry. In a dim room the strands thin out and stop growing.'
      },
      humidity: 'high', minC: 5, idealC: [15, 30],
      fert: { everyDays: 42, strength: 'quarter', type: 'Bromeliad or air plant feed added to the misting water' },
      soil: 'None — drape it over a hook, a branch or a frame where air reaches every strand.',
      repot: 'Never. It needs no pot at all.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in any Tillandsia. Hang it high anyway: cats pull the strands down.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring or summer', roots: 'No rooting needed',
        steps: [
          'Every strand is a chain of small plants, and any piece will keep growing.',
          'Pull a few strands gently away from the clump.',
          'Drape them over a hook or branch of their own.',
          'Mist them as the parent. A wisp grows into a full curtain in a year or two.'
        ]
      }],
      likes: ['Frequent misting', 'Humid, bright air', 'Hanging free'],
      dislikes: ['Drying out for long', 'Being packed into a dish', 'Dry, still rooms'],
      problems: ['air-plant-rot', 'air-plant-thirst', 'brown-crispy-edges', 'pale-washed-out'],
      tags: ['pet-safe', 'epiphyte', 'no-soil', 'trailing', 'humidity-lover', 'bathroom', 'unusual']
    },

    {
      id: 'guzmania-lingulata',
      common: 'Guzmania',
      aka: ['Scarlet Star', 'Orange Star', 'Tufted Airplant'],
      botanical: 'Guzmania lingulata',
      family: 'Bromeliaceae',
      origin: 'Rainforests of Central America, the Caribbean and northern South America',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 45,
      water: {
        warm: 7, cool: 14, dryBetween: false, method: 'cup',
        note: 'It drinks from the cup its leaves make at the centre. Keep that a quarter to a third full of rainwater or filtered water, and tip it out and refill it every two or three weeks so it never goes stale. Water the mix lightly only when its surface feels dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium', 'low'], avoid: ['direct'],
        note: 'One of the more shade-tolerant bromeliads. The coloured bracts last for months even a few metres from a window; direct sun bleaches and scorches the leaves.'
      },
      humidity: 'high', minC: 13, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad feed, or a balanced feed at quarter strength, on the mix and never left in the cup' },
      soil: 'A very open mix — orchid bark with a little coir and perlite. It needs anchoring more than feeding.',
      repot: 'Rarely. Its roots are small and it flowers once, so pot its pups on into small pots rather than moving the parent up.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats, dogs and horses.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: '4–8 weeks',
        steps: [
          'Once the bract fades, pups grow from the base while the parent slowly dies back.',
          'Leave each pup until it is a third to half of the parent\'s size and has a few roots of its own.',
          'Cut it away close to the parent with a clean knife, keeping whatever roots it has.',
          'Pot it in a small pot of bark mix, fill its own cup, and keep it warm and bright while it settles.'
        ]
      }],
      likes: ['A topped-up cup of fresh rainwater', 'Warmth and humidity', 'A small pot'],
      dislikes: ['Stale water in the cup', 'Soggy mix', 'Cold rooms'],
      problems: ['cup-rot', 'flowered-out', 'brown-tips-only', 'mushy-base', 'scale'],
      tags: ['pet-safe', 'flowering', 'colourful', 'humidity-lover', 'bathroom', 'low-light', 'beginner', 'epiphyte']
    },

    {
      id: 'vriesea-splendens',
      common: 'Flaming Sword',
      aka: ['Vriesea', 'Painted Feather', 'Vriesea splendens'],
      botanical: 'Lutheria splendens',
      family: 'Bromeliaceae',
      origin: 'Rainforests of Venezuela, Trinidad and the Guianas',
      difficulty: 'medium',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 7, cool: 14, dryBetween: false, method: 'cup',
        note: 'Keep the central cup a quarter to a third full of rainwater or filtered water, and empty and refill it every two or three weeks. Hard tap water leaves white marks on the banded leaves. Water the mix only lightly, when its surface is dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright filtered light keeps the dark bands strong. Direct sun scorches the leaves, and in low light it rarely flowers again from its pups.'
      },
      humidity: 'high', minC: 15, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad feed, or a balanced feed at quarter strength, on the mix and never left in the cup' },
      soil: 'A very open mix — orchid bark with a little coir and perlite.',
      repot: 'Rarely. It flowers once, so pot its pups on rather than moving the parent up.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA. No toxic compound is known in it, and the ASPCA lists the related Guzmania and Neoregelia as non-toxic.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'medium', season: 'After flowering', roots: '4–8 weeks',
        steps: [
          'After the red sword-shaped spike fades, pups form at the base.',
          'Leave each pup until it is a third to half of the parent\'s size.',
          'Cut it away with a clean knife, keeping any roots it has made.',
          'Pot it in bark mix, fill its own cup, and keep it warm and bright. It will flower in three to five years.'
        ]
      }],
      likes: ['Fresh water in its cup', 'Warm, humid air', 'Bright filtered light'],
      dislikes: ['Hard water', 'Cold below 15°C', 'Soggy mix'],
      problems: ['cup-rot', 'flowered-out', 'brown-tips-only', 'mushy-base', 'scale'],
      tags: ['pet-safe', 'flowering', 'colourful', 'patterned', 'humidity-lover', 'statement', 'epiphyte']
    },

    {
      id: 'neoregelia-carolinae',
      common: 'Blushing Bromeliad',
      aka: ['Neoregelia', 'Heart of Flame', 'Crimson Cup'],
      botanical: 'Neoregelia carolinae',
      family: 'Bromeliaceae',
      origin: 'Atlantic rainforest of south-eastern Brazil',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 30,
      water: {
        warm: 7, cool: 14, dryBetween: false, method: 'cup',
        note: 'Its flowers open inside the cup, so keep the cup a quarter to a third full of rainwater or filtered water and refresh it every two or three weeks. Water the mix lightly only when its surface is dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'The red blush at the centre needs bright light to colour well, and a little gentle sun helps. In a dim spot the centre stays green.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad feed, or a balanced feed at quarter strength, on the mix and never left in the cup' },
      soil: 'A very open mix — orchid bark with a little coir and perlite.',
      repot: 'Rarely. Pot its pups on into small pots rather than moving the parent up.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: '4–8 weeks',
        steps: [
          'The centre blushes red as it comes into flower, and pups appear at the base afterwards.',
          'Leave each pup until it is a third to half of the parent\'s size.',
          'Cut it away close to the parent with a clean knife.',
          'Pot it in bark mix and fill its cup. The parent can be cut away once it browns.'
        ]
      }],
      likes: ['Bright light for its colour', 'Fresh water in the cup', 'A small, snug pot'],
      dislikes: ['Low light', 'Stale cup water', 'Soggy mix'],
      problems: ['cup-rot', 'flowered-out', 'pale-washed-out', 'brown-tips-only', 'scale'],
      tags: ['pet-safe', 'colourful', 'compact', 'beginner', 'epiphyte']
    },

    {
      id: 'aechmea-fasciata',
      common: 'Urn Plant',
      aka: ['Silver Vase', 'Aechmea'],
      botanical: 'Aechmea fasciata',
      family: 'Bromeliaceae',
      origin: 'Atlantic rainforest of south-eastern Brazil',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 60,
      water: {
        warm: 7, cool: 14, dryBetween: false, method: 'cup',
        note: 'The silver-banded leaves form a deep urn. Keep it a quarter to a third full of rainwater or filtered water, and empty and refill it every two or three weeks. Water the mix lightly only when its surface is dry.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Tougher than most bromeliads, it takes some direct sun and copes with medium light. The pink flower head lasts around six months in good light.'
      },
      humidity: 'medium', minC: 12, idealC: [18, 27],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad feed, or a balanced feed at quarter strength, on the mix and never left in the cup' },
      soil: 'A very open mix — orchid bark with a little coir and perlite, in a heavy pot so the top-heavy urn stays upright.',
      repot: 'Rarely. Pot its pups on rather than moving the parent up.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'mild',
        note: 'Not listed by the ASPCA, and not known to poison pets. The leaf edges carry small spines and the sap can irritate skin, so wear gloves when cutting away pups.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: '4–8 weeks',
        steps: [
          'Once the pink flower head fades, pups grow from the base.',
          'Leave each pup until it is a third to half of the parent\'s size.',
          'Wearing gloves for the spines, cut it away close to the parent with a clean knife.',
          'Pot it in bark mix and fill its urn. It flowers in three to four years.'
        ]
      }],
      likes: ['Bright light with some sun', 'Fresh water in the urn', 'Being left alone'],
      dislikes: ['Stale urn water', 'Soggy mix', 'Cold draughts'],
      problems: ['cup-rot', 'flowered-out', 'brown-tips-only', 'sunburn', 'scale'],
      tags: ['pet-safe', 'flowering', 'colourful', 'statement', 'beginner', 'epiphyte']
    },

    {
      id: 'cryptanthus-bivittatus',
      common: 'Earth Star',
      aka: ['Starfish Plant', 'Cryptanthus'],
      botanical: 'Cryptanthus bivittatus',
      family: 'Bromeliaceae',
      origin: 'Forest floor of eastern Brazil',
      difficulty: 'easy',
      growthRate: 'slow',
      matureCm: 15,
      water: {
        warm: 7, cool: 12, soakPct: 0.2, dryBetween: true,
        note: 'Unlike the cup bromeliads it grows in soil and has no central cup to fill, so water the mix once the top 2cm are dry. Its roots are shallow and rot in a wet pot.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct', 'low'],
        note: 'Bright indirect light brings out the pink and cream stripes; in medium light they fade towards green.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 27],
      fert: { everyDays: 42, strength: 'quarter', type: 'Bromeliad feed, or a balanced feed' },
      soil: 'Light and free-draining: potting mix with orchid bark and perlite.',
      repot: 'Rarely. A small, shallow pot suits its tiny root system.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs, as Cryptanthus bivattus minor.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: '3–6 weeks',
        steps: [
          'Each rosette flowers once, with small white flowers hidden in the centre, then grows pups between its leaves and slowly fades.',
          'Pups often come away at a touch. Take them once they are about a third of the parent\'s size.',
          'Press the base of each into the surface of damp mix.',
          'Keep it warm and lightly moist until it roots.'
        ]
      }],
      likes: ['Bright indirect light', 'A small pot', 'Drying a little between drinks'],
      dislikes: ['A wet pot', 'Direct sun', 'Cold'],
      problems: ['flowered-out', 'overwatering', 'root-rot', 'crown-rot', 'variegation-loss', 'mealybugs'],
      tags: ['pet-safe', 'beginner', 'compact', 'colourful', 'patterned', 'terrarium']
    },

    /* ====================== CARNIVOROUS ======================
       Rainwater only, and never any fertiliser: both feed through what
       they catch, and the minerals in tap water and feed burn their roots.
       That is why fert.never exists. The flytrap is a bog plant and stands
       in its water (the tray method); the pitcher plant is a climber from
       humid forest and is poured on like any other. */
    {
      id: 'dionaea-muscipula',
      common: 'Venus Flytrap',
      aka: ['Flytrap', 'Dionaea'],
      botanical: 'Dionaea muscipula',
      family: 'Droseraceae',
      origin: 'Sunny, boggy pine savannah in the Carolinas, USA',
      difficulty: 'hard',
      growthRate: 'moderate',
      matureCm: 12,
      water: {
        warm: 3, cool: 7, dryBetween: false, method: 'tray',
        note: 'Stand the pot in 1–2cm of rainwater, distilled or reverse-osmosis water and top it up before the tray runs dry. Never use tap water or bottled mineral water: the dissolved minerals build up in the peat and kill it within months. In winter, keep the soil damp with only a few millimetres in the tray.'
      },
      light: {
        ideal: 'direct', tolerates: ['bright-indirect'], avoid: ['low', 'medium'],
        note: 'As much direct sun as you can give it, six hours or more. The traps colour red inside in full sun; in weaker light they stay green, small and floppy.'
      },
      humidity: 'medium', minC: 0, idealC: [18, 32],
      fert: { never: true, note: 'Never fertilise it, and never feed it meat. It catches its own insects; fertiliser burns its roots, and a trap given food it cannot digest turns black.' },
      soil: 'Unfertilised sphagnum peat or a peat-free carnivorous-plant mix, with an equal part of perlite or lime-free silica sand. Never ordinary compost.',
      repot: 'Every 1–2 years in late winter, before growth restarts, into fresh mix in a plastic pot. Terracotta leaches minerals into the soil.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Listed by the ASPCA as non-toxic to cats and dogs. The traps cannot harm a person or a pet.' },
      prop: [
        { m: 'Division', diff: 'medium', season: 'Late winter or early spring', roots: 'Already rooted',
          steps: [
            'A healthy plant grows into a clump of several rosettes over a few years.',
            'Unpot it while dormant and wash the peat from the white rhizomes.',
            'Gently pull apart rosettes that each have their own rhizome and roots.',
            'Pot each into fresh carnivorous mix and stand it in its tray of rainwater.'
          ] },
        { m: 'Leaf cutting', diff: 'medium', season: 'Late spring or summer', roots: '4–8 weeks',
          steps: [
            'Pull a healthy leaf down and away so it comes off with its white base attached.',
            'Lay it on damp sphagnum moss or carnivorous mix, base just pressed in.',
            'Cover with clear film and keep it bright and humid, out of direct sun.',
            'Tiny plantlets appear from the base. Grow them on for a year before separating them.'
          ] }
      ],
      likes: ['Full sun', 'Rainwater in its tray', 'A cold winter rest'],
      dislikes: ['Tap water', 'Fertiliser', 'Being set off for fun: each trap closes only a few times'],
      problems: ['carnivore-dormancy', 'tap-water-minerals', 'overfeeding', 'dormancy-dieback', 'pale-washed-out', 'leggy-stretching'],
      tags: ['pet-safe', 'carnivorous', 'sun-lover', 'compact', 'unusual', 'tricky', 'cool-tolerant']
    },

    {
      id: 'nepenthes-hybrids',
      common: 'Tropical Pitcher Plant',
      aka: ['Monkey Cup', 'Nepenthes'],
      botanical: 'Nepenthes hybrids',
      family: 'Nepenthaceae',
      origin: 'Humid forests of Southeast Asia, chiefly Borneo and Sumatra',
      difficulty: 'medium',
      growthRate: 'moderate',
      matureCm: 100,
      water: {
        warm: 4, cool: 7, soakPct: 0.25, dryBetween: false,
        note: 'Keep the mix lightly moist with rainwater, distilled or reverse-osmosis water, and let the pot drain: unlike a flytrap it should not stand in water. Tap water kills it slowly. Leave whatever fluid is in the pitchers; it is the plant\'s own.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['direct', 'medium'], avoid: ['low'],
        note: 'Bright light, with an hour or two of gentle sun if you can, brings red colour to the pitchers. In medium light it grows leaves but few pitchers.'
      },
      humidity: 'high', minC: 15, idealC: [20, 30],
      fert: { never: true, note: 'Never fertilise the mix. It feeds through its pitchers; an insect dropped into one pitcher a month is plenty, and indoors it rarely needs even that.' },
      soil: 'Open and airy: sphagnum moss, perlite and orchid bark in roughly equal parts, with no fertiliser. A hanging basket shows off the pitchers.',
      repot: 'Every 2 years in spring, into fresh mix.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Not listed by the ASPCA, and no toxic compound is known in it.' },
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Cut a section of vine with two or three leaves, just below a node.',
          'Trim each leaf by half to cut water loss, and remove any pitchers.',
          'Push the cut end into damp sphagnum moss and cover it with a clear bag.',
          'Keep it warm and bright, out of direct sun, until new growth shows.'
        ]
      }],
      likes: ['Humid air', 'Rainwater', 'Bright light'],
      dislikes: ['Tap water', 'Fertiliser', 'Dry air'],
      problems: ['low-humidity', 'tap-water-minerals', 'overfeeding', 'brown-crispy-edges', 'leaves-curling', 'root-rot'],
      tags: ['pet-safe', 'carnivorous', 'humidity-lover', 'trailing', 'unusual']
    }

  ];

  return PLANTS.map(normalise);
})();
