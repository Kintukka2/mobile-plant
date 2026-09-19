/* ==========================================================================
   Sprout — curated plant dataset
   --------------------------------------------------------------------------
   Care figures are species-specific and assume a ~15cm pot in plastic or
   glazed ceramic, in the light level listed as `ideal`. The scheduling engine
   adjusts these for pot size, pot material, drainage, room light and season.

   water.warm  = days between waterings during the growing season
   water.cool  = days between waterings during dormancy
   water.soakPct = fraction of pot volume to apply as water
   fert.everyDays = days between feeds, growing season only

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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      prop: [{
        m: 'Stem cutting in water', diff: 'easy', season: 'Any time of year', roots: '2–3 weeks',
        steps: [
          'Cut a length of vine with at least four leaves, snipping just below a node.',
          'Strip the lowest one or two leaves so their nodes sit bare.',
          'Stand the bare nodes in water — a glass on a windowsill is plenty.',
          'Roots appear within a fortnight. Pot several cuttings together for a full-looking plant.'
        ]
      }],
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
        { m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
      prop: [{
        m: 'Division of rhizomes', diff: 'easy', season: 'Spring', roots: 'Immediate',
        steps: [
          'Unpot and wash enough soil away to see the potato-like rhizomes clearly.',
          'Separate a clump that has both a rhizome and its own stems.',
          'Pot into dry, gritty mix and wait a week before watering.',
          'Leaf cuttings also work but can take the better part of a year to form a rhizome — division is far quicker.'
        ]
      }],
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
      prop: [{
        m: 'Plantlet (spiderette)', diff: 'easy', season: 'Any time of year', roots: '1–2 weeks',
        steps: [
          'Look for a baby plantlet on the end of a long arching stem, ideally one already showing stubby root nubs.',
          'You can either pot the plantlet while still attached to the parent, or snip it free.',
          'Press it into damp potting mix so the base sits just at soil level.',
          'Keep evenly moist for two weeks. If still attached, cut the runner once it has taken hold.'
        ]
      }],
      likes: ['Being pot-bound — it flowers and pups more freely', 'Hanging baskets', 'Cool rooms'],
      dislikes: ['Fluoridated tap water', 'Hot direct sun', 'Waterlogged roots'],
      problems: ['brown-tips-only', 'pale-washed-out', 'yellow-lower-leaves', 'root-rot'],
      tags: ['trailing', 'beginner', 'pet-safe', 'air-purifying', 'easy-propagation']
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
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
        note: 'Rotate the pot a quarter turn each week — it leans hard towards the light and will grow permanently lopsided otherwise.'
      },
      humidity: 'medium', minC: 13, idealC: [18, 25],
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Offset pups', diff: 'easy', season: 'Spring or summer', roots: '2–3 weeks',
        steps: [
          'Small pups appear in the soil beside the mother plant, or from the stem itself.',
          'Wait until a pup is 5–7cm tall, then cut it away below soil level with a little root attached.',
          'Pot into damp mix, or root it in water first if it has no roots yet.',
          'A generous mother plant produces pups for years — this is the classic plant to pass on to friends.'
        ]
      }],
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
      tags: ['beginner', 'pet-safe', 'compact', 'office']
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
      prop: [{
        m: 'Stem cutting', diff: 'medium', season: 'Spring or summer', roots: '4–8 weeks',
        steps: [
          'Cut a stem tip 15cm long with two or three leaves.',
          'Blot the sap with a damp cloth until it stops running.',
          'Remove the lowest leaf and pot into damp, gritty mix.',
          'Tent loosely with a clear bag to keep humidity up while it roots.'
        ]
      }],
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
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Immediate',
        steps: [
          'This is a physical job — a mature plant has a dense, woody rhizome.',
          'Unpot and identify a fan of leaves with its own roots at the base.',
          'Cut cleanly through the rhizome with a sharp, sterilised knife.',
          'Pot the division and keep it slightly dry for two weeks so the wound can seal rather than rot.',
          'Expect a full season of sulking before new growth appears.'
        ]
      }],
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      tags: ['trailing', 'climbing', 'fast-growing', 'beginner']
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      tags: ['tree', 'beginner', 'architectural', 'drought-tolerant', 'air-purifying']
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
      tags: ['colourful', 'tricky', 'sun-lover', 'dramatic']
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
        note: 'Dappled light, as it would get on a forest floor. Direct sun crisps the fronds within days.'
      },
      humidity: 'high', minC: 13, idealC: [16, 24],
      fert: { everyDays: 28, strength: 'quarter', type: 'Weak balanced feed — ferns burn easily' },
      soil: 'Moisture-retentive but airy — peat-free compost with coco coir and a little perlite.',
      repot: 'Annually in spring; it fills a pot quickly with dense roots.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',
        note: 'Completely non-toxic and one of the best choices for homes with cats and dogs.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
      tags: ['pet-safe', 'humidity-lover', 'bathroom', 'architectural']
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
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Immediate',
        steps: [
          'Unpot and cut the rhizome mass into sections, each with several fronds and good roots.',
          'Pot immediately into damp mix — do not let the roots dry out for even a moment.',
          'Cut the fronds back by half to reduce water loss while it re-establishes.',
          'Keep in a humid, shaded spot and expect a few weeks of sulking.'
        ]
      }],
      likes: ['Constant moisture', 'Steamy bathrooms', 'Being cut right back when it crisps — it regrows from the base'],
      dislikes: ['Drying out', 'Dry air', 'Direct sun', 'Draughts', 'Being fussed over'],
      problems: ['brown-crispy-edges', 'frond-dieback', 'drooping', 'pale-washed-out'],
      tags: ['pet-safe', 'humidity-lover', 'tricky', 'bathroom', 'delicate']
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
        m: 'Division', diff: 'medium', season: 'Spring', roots: 'Immediate',
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
      tags: ['pet-safe', 'humidity-lover', 'tricky', 'patterned', 'colourful']
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
      tags: ['pet-safe', 'humidity-lover', 'patterned', 'trailing', 'compact']
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
      problems: ['drooping', 'brown-crispy-edges', 'leggy-stretching', 'pale-washed-out'],
      tags: ['pet-safe', 'humidity-lover', 'compact', 'colourful', 'terrarium']
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
        m: 'Seed', diff: 'hard', season: 'Spring', roots: '2–4 months to germinate',
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
        m: 'Seed', diff: 'hard', season: 'Spring', roots: '3–12 months to germinate',
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
      tags: ['pet-safe', 'palm', 'large', 'beginner', 'architectural']
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
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
        note: 'Bright indirect light is what drives flowering. In medium light it stays healthy but stops producing those red spathes.'
      },
      humidity: 'high', minC: 16, idealC: [20, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'High-phosphorus feed to encourage flowering' },
      soil: 'Very chunky and airy — orchid bark with coco coir and perlite. Standard compost suffocates it.',
      tox: { cats: 'toxic', dogs: 'toxic', humans: 'mild',
        note: 'Calcium oxalate crystals throughout. Causes intense oral burning, swelling and drooling if chewed.' },
      prop: [{
        m: 'Division', diff: 'easy', season: 'Spring', roots: 'Immediate',
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
      tags: ['flowering', 'colourful', 'humidity-lover', 'compact']
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
        ideal: 'direct', tolerates: [], avoid: ['low', 'medium'],
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
      tags: ['succulent', 'trailing', 'tricky', 'sun-lover', 'drought-tolerant']
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      tags: ['succulent', 'flowering', 'colourful', 'sun-lover', 'compact']
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
        ideal: 'bright-indirect', tolerates: ['direct'], avoid: ['low'],
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
      tags: ['trailing', 'climbing', 'beginner', 'fast-growing', 'colourful']
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
      tags: ['trailing', 'climbing', 'fast-growing', 'cool-tolerant']
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      tags: ['flowering', 'pet-safe', 'epiphyte', 'compact', 'bathroom']
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
        warm: 6, cool: 10, soakPct: 0.25, dryBetween: true,
        note: 'Water from below — stand the pot in a saucer of tepid water for 20 minutes, then tip away what is left. Water on those furry leaves causes brown spots and rot.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
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
      tags: ['edible', 'herb', 'pet-safe', 'fast-growing', 'kitchen', 'cool-tolerant']
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
      likes: ['All the direct sun available', 'Dry roots and good airflow', 'Terracotta pots', 'Regular light pruning'],
      dislikes: ['Overwatering — the usual cause of death', 'Humid stagnant air', 'Rich soil', 'Low light'],
      problems: ['root-rot', 'powdery-mildew', 'brown-crispy-edges', 'leggy-stretching', 'spider-mites'],
      tags: ['edible', 'herb', 'sun-lover', 'pet-safe', 'drought-tolerant', 'kitchen']
    },

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
        warm: 7, cool: 12, soakPct: 1.0, dryBetween: true,
        note: 'It has no functional roots and takes water through its leaves. Submerge the whole plant in tepid water for 20–30 minutes, then shake it out hard and leave it upside down somewhere airy to dry within 4 hours. Water left in the base rots the plant.'
      },
      light: {
        ideal: 'bright-indirect', tolerates: ['medium'], avoid: ['direct'],
        note: 'Bright filtered light. Direct sun dries it out faster than it can absorb water.'
      },
      humidity: 'medium', minC: 10, idealC: [16, 28],
      fert: { everyDays: 28, strength: 'quarter', type: 'Bromeliad or air plant feed added to the soaking water' },
      soil: 'None at all — it grows mounted on wood, in a shell, or simply sitting in a bowl.',
      repot: 'Never. If mounted, use wire or a neutral glue, never copper, which is toxic to bromeliads.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe', note: 'Non-toxic and safe around pets.' },
      prop: [{
        m: 'Offsets (pups)', diff: 'easy', season: 'After flowering', roots: 'N/A',
        steps: [
          'Each plant flowers once, then produces pups from its base and slowly dies — this is its natural cycle.',
          'Let a pup grow to about a third of the parent\'s size.',
          'Twist and pull it gently away from the parent.',
          'Care for it exactly as the parent. A cluster left intact makes a handsome clump.'
        ]
      }],
      likes: ['A proper soak then fast, thorough drying', 'Good air circulation', 'Bright filtered light'],
      dislikes: ['Sitting in water', 'Being potted in soil', 'Stagnant air', 'Copper'],
      problems: ['crown-rot', 'brown-crispy-edges', 'shrivelled-segments', 'pale-washed-out'],
      tags: ['pet-safe', 'epiphyte', 'compact', 'no-soil', 'unusual']
    }

  ];

  return PLANTS.map(normalise);
})();
