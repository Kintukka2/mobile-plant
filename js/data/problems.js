/* ==========================================================================
   Sprout — diagnosis knowledge base
   --------------------------------------------------------------------------
   The flow is: which plant → what do you notice (SYMPTOM) → what else is
   true (CLUES) → ranked CAUSES with treatment steps.

   Scoring: each cause starts at its `base` weight for a given symptom, then
   gains points for every clue the user confirms and loses points for clues
   that argue against it. Causes the plant is specifically prone to get a
   bonus, because a Calathea with brown edges is a very different bet from a
   Snake Plant with brown edges.
   ========================================================================== */

window.PROBLEM_DATA = (function () {

  /* ======================================================================
     CLUES — the follow-up observations
     ====================================================================== */
  const CLUES = {
    'soil-wet':        { label: 'Soil is wet or damp', desc: 'Push a finger 4cm in — it feels moist or muddy.' },
    'soil-dry':        { label: 'Soil is bone dry', desc: 'Dry all the way through, possibly shrunk from the pot sides.' },
    'soil-smell':      { label: 'Soil smells sour or musty', desc: 'A swampy, rotten-egg or drain-like smell from the pot.' },
    'water-runs-through': { label: 'Water runs straight through', desc: 'You water and it pours out of the bottom seconds later.' },
    'no-drainage':     { label: 'The pot has no drainage holes', desc: 'Or it sits permanently in a full saucer or cachepot.' },

    'lower-leaves':    { label: 'Only the oldest, lowest leaves', desc: 'The bottom of the plant, while new growth looks fine.' },
    'new-growth':      { label: 'The newest leaves are affected', desc: 'Fresh growth is coming out damaged, small or discoloured.' },
    'all-over':        { label: 'It is happening all over', desc: 'Old and new growth alike.' },
    'sun-side':        { label: 'Worst on the side facing the window', desc: 'One side of the plant is noticeably more affected.' },

    'edges-first':     { label: 'Starting at the edges and tips', desc: 'Damage creeps inward from the leaf margin.' },
    'spots-defined':   { label: 'Distinct spots with a yellow halo', desc: 'Round or angular marks, often ringed in yellow.' },
    'spots-mushy':     { label: 'Marks are soft, dark and wet-looking', desc: 'Squashy black or dark brown patches rather than dry ones.' },
    'texture-dry':     { label: 'Damage is dry and papery', desc: 'It crackles between your fingers.' },

    'webbing':         { label: 'Fine webbing in the leaf joints', desc: 'Wispy strands where leaf meets stem, or under leaves.' },
    'tiny-dots':       { label: 'Tiny moving specks underneath', desc: 'Pinprick dots on the leaf underside. Hold paper beneath and tap.' },
    'stippling':       { label: 'Fine pale speckling on leaves', desc: 'A dusty, sand-blasted look when held to the light.' },
    'white-fluff':     { label: 'White cottony fluff', desc: 'Cotton-wool tufts in leaf joints or under leaves.' },
    'brown-bumps':     { label: 'Hard brown or tan bumps', desc: 'Limpet-like discs on stems and leaf veins that scrape off.' },
    'sticky':          { label: 'Sticky residue on leaves or floor', desc: 'A tacky film — honeydew, which insects excrete.' },
    'flying-gnats':    { label: 'Small flies around the pot', desc: 'Dark gnats that drift up when you water.' },
    'green-clusters':  { label: 'Clusters of green or black insects', desc: 'Massed on new growth, buds and stem tips.' },
    'white-powder':    { label: 'White powdery coating', desc: 'Looks dusted with flour, usually on the upper leaf surface.' },
    'orange-pustules': { label: 'Orange or rust-coloured pustules', desc: 'Raised specks on the leaf underside that smudge onto your finger.' },

    'stems-soft':      { label: 'Stems or base feel soft and squashy', desc: 'You can dent the base with a fingernail.' },
    'stems-long':      { label: 'Long bare gaps between leaves', desc: 'Stretched, spindly stems with widely spaced leaves.' },
    'leaning':         { label: 'Leaning hard in one direction', desc: 'Growing sideways towards the light source.' },
    'roots-brown':     { label: 'Roots are brown, black or mushy', desc: 'Slide it out — healthy roots are firm and pale, not slimy.' },
    'roots-circling':  { label: 'Roots circling or out of the holes', desc: 'A dense mat, or roots escaping the drainage holes.' },

    'recently-moved':  { label: 'I moved or repotted it recently', desc: 'Within the last month or so.' },
    'near-draught':    { label: 'It sits near a draught or vent', desc: 'A door, window, radiator or air conditioning unit.' },
    'cold-spot':       { label: 'The room gets cold at night', desc: 'Below about 12°C, or the leaves touch a cold windowpane.' },
    'dry-air':         { label: 'The air is dry', desc: 'Heating or air conditioning is running, or humidity is under 40%.' },
    'tap-water':       { label: 'I use tap water', desc: 'Straight from the tap, unfiltered and unrested.' },
    'white-crust':     { label: 'White crust on soil or pot rim', desc: 'Chalky deposits on the surface or around the drainage holes.' },
    'not-fed':         { label: 'Not fed in months', desc: 'No fertiliser this growing season, or in the same soil over a year.' },
    'fed-lots':        { label: 'I have been feeding it often', desc: 'More than monthly, or at full strength.' },
    'low-light-spot':  { label: 'It is more than 2m from a window', desc: 'Or in a room with no direct view of the sky.' },
    'direct-sun':      { label: 'Direct sun lands on the leaves', desc: 'Unfiltered sunlight hits it for an hour or more.' },
    'winter-now':      { label: 'It is autumn or winter', desc: 'The plant should be resting rather than growing.' },
    'never-repotted':  { label: 'Not repotted in over two years', desc: 'Same pot and same soil for a long stretch.' },
    'crown-wet':       { label: 'Water collects in the centre', desc: 'It pools where the leaves meet, in the rosette or crown.' },
    'flower-buds-fell':{ label: 'Buds formed then dropped', desc: 'They developed and then fell before opening.' }
  };

  /* ======================================================================
     SYMPTOMS — what the user notices first
     ====================================================================== */
  const SYMPTOMS = {
    'yellow-lower-leaves': {
      label: 'Leaves turning yellow',
      desc: 'Leaves losing their green, going pale yellow or buttery.',
      clues: ['soil-wet', 'soil-dry', 'lower-leaves', 'all-over', 'new-growth', 'soil-smell',
              'no-drainage', 'roots-brown', 'not-fed', 'never-repotted', 'winter-now',
              'low-light-spot', 'direct-sun', 'flying-gnats', 'cold-spot'],
      causes: { 'overwatering': 10, 'root-rot': 6, 'natural-ageing': 7, 'underwatering': 5,
                'nutrient-deficiency': 6, 'too-little-light': 4, 'pot-bound': 3,
                'too-much-light': 2, 'cold-damage': 2, 'fungus-gnats': 1 }
    },

    'brown-crispy-edges': {
      label: 'Brown, crispy edges',
      desc: 'Leaf margins going dry, brown and brittle, creeping inward.',
      clues: ['dry-air', 'soil-dry', 'tap-water', 'white-crust', 'edges-first', 'texture-dry',
              'direct-sun', 'near-draught', 'fed-lots', 'all-over', 'new-growth', 'soil-wet',
              'never-repotted', 'stippling'],
      causes: { 'low-humidity': 10, 'underwatering': 8, 'tap-water-minerals': 7,
                'salt-buildup': 5, 'too-much-light': 4, 'draughts': 4, 'overfeeding': 3,
                'root-rot': 2, 'spider-mites': 2 }
    },

    'brown-tips-only': {
      label: 'Just the very tips browning',
      desc: 'A few millimetres of brown right at the leaf tip, the rest healthy.',
      clues: ['tap-water', 'dry-air', 'white-crust', 'fed-lots', 'soil-dry', 'near-draught', 'all-over'],
      causes: { 'tap-water-minerals': 10, 'low-humidity': 7, 'salt-buildup': 6,
                'overfeeding': 4, 'underwatering': 3, 'draughts': 3 }
    },

    'brown-spots-leaves': {
      label: 'Brown or black spots',
      desc: 'Defined patches or blotches appearing on the leaf surface.',
      clues: ['spots-defined', 'spots-mushy', 'texture-dry', 'soil-wet', 'direct-sun',
              'dry-air', 'cold-spot', 'recently-moved', 'all-over', 'new-growth', 'crown-wet'],
      causes: { 'leaf-spot-fungal': 9, 'overwatering': 7, 'sunburn': 7, 'cold-damage': 5,
                'low-humidity': 4, 'root-rot': 4, 'crown-rot': 3 }
    },

    'drooping': {
      label: 'Drooping or wilting',
      desc: 'Leaves and stems gone limp, hanging down, lost their structure.',
      clues: ['soil-dry', 'soil-wet', 'soil-smell', 'roots-brown', 'no-drainage', 'stems-soft',
              'recently-moved', 'cold-spot', 'near-draught', 'water-runs-through', 'dry-air'],
      causes: { 'underwatering': 10, 'overwatering': 9, 'root-rot': 8, 'transplant-shock': 5,
                'cold-damage': 4, 'pot-bound': 3, 'low-humidity': 2 }
    },

    'leaves-curling': {
      label: 'Leaves curling or cupping',
      desc: 'Curling inward, cupping upward, or rolling at the edges.',
      clues: ['soil-dry', 'dry-air', 'direct-sun', 'stippling', 'tiny-dots', 'webbing',
              'cold-spot', 'soil-wet', 'green-clusters', 'new-growth'],
      causes: { 'underwatering': 9, 'low-humidity': 8, 'too-much-light': 7, 'spider-mites': 6,
                'aphids': 4, 'cold-damage': 3, 'overwatering': 3 }
    },

    'leaves-falling-off': {
      label: 'Dropping leaves',
      desc: 'Leaves coming away, whether yellowed first or still green.',
      clues: ['soil-wet', 'soil-dry', 'recently-moved', 'near-draught', 'cold-spot',
              'lower-leaves', 'all-over', 'low-light-spot', 'roots-brown', 'winter-now', 'dry-air'],
      causes: { 'overwatering': 8, 'transplant-shock': 8, 'draughts': 7, 'underwatering': 6,
                'cold-damage': 6, 'too-little-light': 5, 'root-rot': 5, 'natural-ageing': 4,
                'dormancy': 3 }
    },

    'leaf-drop-sudden': {
      label: 'Sudden dramatic leaf drop',
      desc: 'Lots of leaves lost in days, often still green when they fell.',
      clues: ['recently-moved', 'near-draught', 'cold-spot', 'soil-wet', 'soil-dry', 'dry-air'],
      causes: { 'transplant-shock': 10, 'draughts': 9, 'cold-damage': 8, 'overwatering': 5, 'underwatering': 4 }
    },

    'leggy-stretching': {
      label: 'Stretched and leggy',
      desc: 'Long bare stems, widely spaced leaves, a sparse and floppy shape.',
      clues: ['stems-long', 'low-light-spot', 'leaning', 'winter-now', 'not-fed', 'never-repotted'],
      causes: { 'too-little-light': 10, 'needs-pruning': 7, 'nutrient-deficiency': 3, 'pot-bound': 2 }
    },

    'pale-washed-out': {
      label: 'Pale, faded colour',
      desc: 'Washed-out, bleached or unusually light leaves.',
      clues: ['direct-sun', 'sun-side', 'low-light-spot', 'not-fed', 'never-repotted',
              'all-over', 'new-growth', 'stippling', 'white-crust'],
      causes: { 'too-much-light': 9, 'nutrient-deficiency': 8, 'too-little-light': 6,
                'pot-bound': 4, 'spider-mites': 3, 'overwatering': 3 }
    },

    'variegation-loss': {
      label: 'Losing its variegation',
      desc: 'The pattern, stripe or colour fading back to plain green.',
      clues: ['low-light-spot', 'new-growth', 'winter-now', 'not-fed'],
      causes: { 'too-little-light': 10, 'reversion': 6, 'nutrient-deficiency': 2 }
    },

    'no-flowers': {
      label: 'Refusing to flower',
      desc: 'Healthy enough in leaf, but never producing blooms.',
      clues: ['low-light-spot', 'not-fed', 'fed-lots', 'never-repotted', 'roots-circling', 'winter-now'],
      causes: { 'too-little-light': 10, 'wrong-feed': 7, 'needs-rest-period': 6,
                'too-young': 5, 'pot-too-big': 4, 'nutrient-deficiency': 3 }
    },

    'no-fenestration': {
      label: 'New leaves have no holes or splits',
      desc: 'On a Monstera or similar — new leaves coming out small and solid.',
      clues: ['low-light-spot', 'not-fed', 'never-repotted', 'winter-now'],
      causes: { 'too-little-light': 10, 'too-young': 7, 'nutrient-deficiency': 5,
                'needs-support': 5, 'pot-bound': 3 }
    },

    'mushy-base': {
      label: 'Soft, mushy base or stem',
      desc: 'The base has gone soft, dark or squashy, and may smell.',
      clues: ['stems-soft', 'soil-wet', 'soil-smell', 'roots-brown', 'no-drainage',
              'crown-wet', 'cold-spot', 'winter-now'],
      causes: { 'root-rot': 10, 'overwatering': 9, 'crown-rot': 7, 'cold-damage': 4 }
    },

    'leaves-falling-over': {
      label: 'Leaves flopping outward',
      desc: 'On upright plants — leaves splaying outward instead of standing up.',
      clues: ['soil-wet', 'roots-brown', 'low-light-spot', 'never-repotted', 'stems-soft', 'roots-circling'],
      causes: { 'overwatering': 9, 'too-little-light': 7, 'root-rot': 6, 'pot-bound': 5, 'pot-too-big': 3 }
    },

    'leaning': {
      label: 'Leaning to one side',
      desc: 'Growing sideways, or the whole plant tipping over.',
      clues: ['leaning', 'sun-side', 'low-light-spot', 'roots-circling', 'stems-long'],
      causes: { 'needs-rotation': 10, 'too-little-light': 7, 'needs-support': 5, 'pot-bound': 3 }
    },

    'frond-dieback': {
      label: 'Whole fronds dying off',
      desc: 'On a fern — entire fronds going brown and dying from the base.',
      clues: ['soil-dry', 'dry-air', 'soil-wet', 'direct-sun', 'fed-lots', 'near-draught', 'lower-leaves'],
      causes: { 'underwatering': 10, 'low-humidity': 9, 'overfeeding': 5, 'too-much-light': 5,
                'natural-ageing': 4, 'root-rot': 4 }
    },

    'shrivelled-pearls': {
      label: 'Beads shrivelling or flattening',
      desc: 'On a String of Pearls or Hearts — beads gone wrinkly or deflated.',
      clues: ['soil-dry', 'soil-wet', 'roots-brown', 'direct-sun', 'stems-long', 'white-fluff'],
      causes: { 'underwatering': 9, 'root-rot': 8, 'overwatering': 7, 'too-much-light': 4, 'mealybugs': 3 }
    },

    'shrivelled-segments': {
      label: 'Segments going limp or wrinkled',
      desc: 'On a cactus or air plant — puckered, soft or shrunken growth.',
      clues: ['soil-dry', 'soil-wet', 'roots-brown', 'crown-wet', 'direct-sun', 'dry-air'],
      causes: { 'underwatering': 9, 'root-rot': 8, 'overwatering': 6, 'crown-rot': 5, 'too-much-light': 3 }
    },

    'limp-leaves': {
      label: 'Leaves gone limp and leathery',
      desc: 'On an orchid — wrinkled, floppy leaves that have lost their firmness.',
      clues: ['soil-dry', 'soil-wet', 'roots-brown', 'water-runs-through', 'never-repotted', 'dry-air'],
      causes: { 'root-rot': 10, 'underwatering': 8, 'old-potting-media': 7, 'overwatering': 5 }
    },

    'green-flowers': {
      label: 'Flowers coming out green',
      desc: 'On a Peace Lily — the white spathes emerging green, or greening early.',
      clues: ['fed-lots', 'low-light-spot', 'direct-sun'],
      causes: { 'overfeeding': 10, 'natural-ageing': 7, 'too-little-light': 4, 'too-much-light': 3 }
    },

    'bud-drop': {
      label: 'Buds dropping before they open',
      desc: 'Buds form, then fall off without ever flowering.',
      clues: ['flower-buds-fell', 'recently-moved', 'soil-dry', 'soil-wet', 'near-draught', 'dry-air', 'cold-spot'],
      causes: { 'moved-while-budding': 10, 'inconsistent-watering': 8, 'draughts': 6,
                'low-humidity': 5, 'cold-damage': 4 }
    },

    'bolting': {
      label: 'Running to flower and going bitter',
      desc: 'On a herb — shooting up a flower stalk, leaves turning tough and bitter.',
      clues: ['direct-sun', 'soil-dry', 'never-repotted', 'not-fed'],
      causes: { 'bolting-heat-stress': 10, 'underwatering': 6, 'pot-bound': 5, 'natural-ageing': 4 }
    },

    'leaf-splitting': {
      label: 'Leaves tearing or splitting',
      desc: 'Splits along the leaf, or tears at the edges.',
      clues: ['dry-air', 'near-draught', 'soil-dry', 'direct-sun', 'all-over'],
      causes: { 'natural-wind-damage': 8, 'low-humidity': 7, 'inconsistent-watering': 6, 'underwatering': 4 }
    },

    'dormancy-dieback': {
      label: 'Dying back completely',
      desc: 'On an Alocasia or similar — losing every leaf, seemingly dead.',
      clues: ['winter-now', 'cold-spot', 'soil-wet', 'roots-brown', 'low-light-spot'],
      causes: { 'dormancy': 10, 'root-rot': 7, 'cold-damage': 6, 'overwatering': 5 }
    },

    'pests-general': {
      label: 'I can see insects or webbing',
      desc: 'Something is living on the plant.',
      clues: ['webbing', 'tiny-dots', 'stippling', 'white-fluff', 'brown-bumps', 'sticky',
              'flying-gnats', 'green-clusters', 'white-powder', 'orange-pustules', 'dry-air', 'soil-wet'],
      causes: { 'spider-mites': 6, 'mealybugs': 6, 'scale': 6, 'fungus-gnats': 6,
                'aphids': 6, 'thrips': 4, 'powdery-mildew': 4, 'rust': 3 }
    }
  };

  /* Which clues push back against which causes. */
  const CONTRA = {
    'overwatering':   ['soil-dry', 'water-runs-through'],
    'root-rot':       ['soil-dry'],
    'underwatering':  ['soil-wet', 'soil-smell', 'no-drainage', 'roots-brown'],
    'low-humidity':   ['soil-wet'],
    'too-much-light': ['low-light-spot'],
    'too-little-light': ['direct-sun', 'sun-side'],
    'nutrient-deficiency': ['fed-lots'],
    'overfeeding':    ['not-fed'],
    'natural-ageing': ['new-growth', 'all-over'],
    'transplant-shock': [],
    'spider-mites':   ['soil-wet'],
    'fungus-gnats':   ['soil-dry'],
    'dormancy':       ['new-growth'],
    'pot-bound':      ['recently-moved'],
    'crown-rot':      ['soil-dry']
  };

  /* ======================================================================
     CAUSES — the diagnosis, with treatment
     severity: 'low' | 'med' | 'high'
     ====================================================================== */
  const CAUSES = {

    /* ---------------- Water ---------------- */
    'overwatering': {
      name: 'Overwatering',
      ico: 'drop',
      severity: 'med',
      why: 'Waterlogged soil has no air in it. Roots need oxygen as much as water, and when the gaps between soil particles stay flooded the roots suffocate and begin to die. The plant then cannot draw water up, so — confusingly — it wilts and yellows exactly as if it were thirsty. This is the single most common way houseplants are killed, and almost always out of affection.',
      fix: [
        'Stop watering completely and let the soil dry until the top 5cm are properly dry to your finger.',
        'Empty the saucer or cachepot. A plant must never stand in collected water.',
        'Move it somewhere brighter and warmer if you can — that speeds up drying.',
        'Check the pot actually has drainage holes. If it does not, repot into one that does; this is not optional.',
        'Remove any leaves that have gone fully yellow or mushy. They will not recover and they invite fungus.',
        'Once recovered, water by weight and feel rather than by calendar — lift the pot, and learn what dry feels like.'
      ],
      prevent: 'Always check the soil before watering rather than watering on a fixed day. Sprout\'s schedule is a prompt to check, not an instruction to pour.'
    },

    'root-rot': {
      name: 'Root rot',
      ico: 'microbe',
      severity: 'high',
      why: 'Once roots have been suffocated by wet soil for long enough, opportunistic fungi and bacteria move in and the tissue starts to decay. Healthy roots are firm and pale — white, cream or tan. Rotten ones are brown or black, slimy, and pull apart between your fingers. This will not resolve on its own and it spreads, so it needs surgery.',
      fix: [
        'Slide the plant out of its pot and wash all the old soil off the roots under a gentle tap.',
        'Inspect carefully. Cut away every soft, brown, black or slimy root with sterilised scissors, back to firm healthy tissue.',
        'If you removed a lot of root, cut back a proportional amount of the top growth too — the remaining roots cannot support a full canopy.',
        'Optionally dust the cuts with cinnamon, which has genuine mild antifungal properties.',
        'Repot into fresh, dry, free-draining mix in a clean pot. Never reuse the old soil.',
        'Water very lightly, then keep it on the dry side and out of direct sun for a fortnight while it rebuilds roots.'
      ],
      prevent: 'Free-draining mix, a pot with holes, and letting the soil dry appropriately between waterings. Terracotta helps a great deal if you tend to be generous.'
    },

    'underwatering': {
      name: 'Underwatering',
      ico: 'dropOff',
      severity: 'low',
      why: 'The soil has dried out so far that the plant cannot maintain pressure in its cells, so leaves go limp, then crisp from the edges inward. Badly dried compost can also become hydrophobic — water then runs straight down the sides and out of the bottom without ever wetting the root ball, so you can water a bone-dry plant and achieve nothing at all.',
      fix: [
        'If water runs straight through, the soil has shrunk away from the roots. Bottom-water instead: stand the pot in a few centimetres of water for 20–30 minutes and let it drink upward.',
        'Otherwise water slowly and thoroughly until it runs from the drainage holes, then let it drain.',
        'Give it a few hours. Most plants perk back up remarkably fast.',
        'Trim off leaves that have gone fully crisp — they cannot green up again.',
        'If the compost has visibly shrunk from the pot sides, repot into fresh mix.',
        'Shorten the watering interval in Sprout so the reminder arrives sooner next time.'
      ],
      prevent: 'Check the soil before the reminder is due, especially in summer or after a run of hot days. Thirsty plants in small pots may need water twice as often in a heatwave.'
    },

    'inconsistent-watering': {
      name: 'Inconsistent watering',
      ico: 'wave',
      severity: 'low',
      why: 'Swinging between drought and flood is harder on a plant than either extreme alone. Root tips die back each time the soil dries out completely, then have to regrow when it is soaked. Growth ends up uneven, which is what causes splitting leaves, dropped buds and odd deformed new growth.',
      fix: [
        'Settle into a rhythm: water thoroughly, let it dry to the right point, water thoroughly again.',
        'Use the same method every time rather than a small splash some days and a soak on others.',
        'Check the soil with your finger before each watering so you learn the plant\'s actual pace.',
        'Log each watering in Sprout — the history quickly shows whether you are being erratic.'
      ],
      prevent: 'One thorough watering when the plant is ready beats frequent small top-ups, which only ever wet the surface.'
    },

    'tap-water-minerals': {
      name: 'Sensitivity to tap water',
      ico: 'tap',
      severity: 'low',
      why: 'Fluoride, chlorine and dissolved salts in treated tap water accumulate in leaf tips, where transpiration concentrates them. Some plants simply cannot tolerate it — spider plants, dracaenas, calatheas, marantas and palms are the classic sufferers. The giveaway is browning confined to the very tips while the rest of the leaf stays perfectly healthy.',
      fix: [
        'Switch to rainwater, filtered water or distilled water. Rainwater is free and by far the best.',
        'Failing that, leave tap water standing uncovered overnight — this lets chlorine off-gas, though it does nothing for fluoride.',
        'Flush the pot thoroughly: run water through it for a minute or two to wash accumulated salts out of the soil.',
        'Trim brown tips with clean scissors, following the leaf\'s natural shape so the cut is less obvious.',
        'Avoid softened water — ion-exchange softeners replace calcium with sodium, which is worse for plants than hard water.'
      ],
      prevent: 'Keep a watering can filled and standing, or collect rainwater in a bucket outside. Flush the soil every few months.'
    },

    'salt-buildup': {
      name: 'Fertiliser salt build-up',
      ico: 'crystal',
      severity: 'low',
      why: 'Fertiliser salts and minerals accumulate in the soil over time, especially if the pot is never flushed through. High salt concentration draws moisture out of roots by osmosis — chemically burning them — and shows up as brown edges plus a white crust on the soil surface or pot rim.',
      fix: [
        'Scrape off any visible white crust from the soil surface.',
        'Flush the pot heavily: run lukewarm water through it for two to three minutes, letting it drain freely. Do this in a sink, bath or outside.',
        'Repeat the flush two or three times over a fortnight.',
        'Hold off feeding for two months, then resume at half strength.',
        'If the crust is severe, repot into fresh soil instead — it is faster.'
      ],
      prevent: 'Flush the soil thoroughly every three or four months, and feed at half the strength on the bottle. Most houseplant feeds are dosed for greenhouse growers.'
    },

    /* ---------------- Light ---------------- */
    'too-little-light': {
      name: 'Not enough light',
      ico: 'sunOff',
      severity: 'low',
      why: 'Light is the plant\'s food source — no light means no photosynthesis, and everything else follows from that. It stretches towards whatever light there is, producing long bare stems and small pale leaves. Variegation fades because the plant sacrifices its decorative white and yellow areas, which cannot photosynthesise, in favour of green ones. Flowering stops entirely, since blooming is expensive.',
      fix: [
        'Move it closer to a window. As a rough rule, light intensity falls off with the square of the distance — a metre from the glass is dramatically dimmer than 30cm.',
        'An east or west-facing window is the safest upgrade for most houseplants.',
        'Clean the window and dust the leaves. Both cut light transmission more than people expect.',
        'Cut back the stretched, leggy growth. It will not shorten again, and pruning encourages compact new shoots.',
        'In a genuinely dark home, a simple LED grow light on a timer for 10–12 hours a day works well and is inexpensive.',
        'Introduce brighter light over a week or two rather than all at once, so it does not scorch.'
      ],
      prevent: 'Match the plant to the room rather than the room to the plant. Sprout\'s room light tags will flag a mismatch when you add a plant.'
    },

    'too-much-light': {
      name: 'Too much light',
      ico: 'sun',
      severity: 'low',
      why: 'Excess light destroys chlorophyll faster than the plant can replace it, bleaching leaves to a pale, washed-out yellow-green. Combined with heat, direct sun through glass also dries leaf tissue out faster than roots can resupply it, so you get scorched patches. Glass magnifies the effect considerably compared to the same sun outdoors.',
      fix: [
        'Move it back from the window, or across to one with a gentler aspect.',
        'A sheer curtain or a strip of frosted film diffuses harsh sun very effectively while keeping the room bright.',
        'Bleached leaves will not recover their colour, but they still photosynthesise — only remove them if they are badly scorched.',
        'Check watering. Plants in strong light dry out much faster, and sun damage is often really drought damage.',
        'Move it gradually if the new spot is much dimmer, to avoid shocking it a second time.'
      ],
      prevent: 'Remember the sun\'s path shifts through the year — a spot that was fine in winter can be brutal in midsummer.'
    },

    'sunburn': {
      name: 'Sunburn',
      ico: 'flame',
      severity: 'low',
      why: 'Direct sun on leaves that were not acclimatised to it kills the tissue outright, leaving dry bleached-white or tan patches with sharply defined edges. It is very common in the first fortnight after moving a plant from a shady shop or a dim corner into a sunny window — the leaves have no chance to adapt their pigments.',
      fix: [
        'Move it out of direct sun immediately.',
        'Damaged patches are dead and will not heal. Leave the leaf on unless most of it is gone — it still contributes.',
        'Water normally; do not overcompensate, as scorched plants are not necessarily thirsty.',
        'If you do want it in that bright spot, reintroduce it over two to three weeks, adding an hour of sun at a time.'
      ],
      prevent: 'Acclimatise gradually whenever you increase light. Plants build up protective pigments, but they need time to do it.'
    },

    'needs-rotation': {
      name: 'Growing towards the light',
      ico: 'rotate',
      severity: 'low',
      why: 'Phototropism — the plant redistributes growth hormone to the shaded side, which elongates and bends the stem towards the light. Entirely normal and healthy, but over months it produces a permanently lopsided plant.',
      fix: [
        'Give the pot a quarter turn every week or two. Watering day is an easy thing to attach the habit to.',
        'Stems already bent will not straighten, but new growth will come up evenly.',
        'A badly leaning plant can be pruned back and allowed to regrow with regular rotation.',
        'For tall or top-heavy plants, a stake or moss pole gives support while it rebalances.'
      ],
      prevent: 'Rotate a quarter turn each time you water. Sprout can log a rotate task alongside watering.'
    },

    /* ---------------- Feeding & roots ---------------- */
    'nutrient-deficiency': {
      name: 'Nutrient deficiency',
      ico: 'dial',
      severity: 'low',
      why: 'Potting compost carries only two or three months of nutrients from the nursery. After that, a plant in the same soil is living on nothing. Nitrogen shortage is the usual culprit — it is mobile within the plant, so old lower leaves are stripped to feed new growth, which is why yellowing starts at the bottom and works upward.',
      fix: [
        'Begin feeding with a balanced liquid houseplant fertiliser at half the strength stated on the bottle.',
        'Feed only during the growing season — roughly spring and summer. Feeding a dormant plant does harm, not good.',
        'Always water first, then feed, or feed into already-damp soil. Fertiliser on dry roots burns them.',
        'If it has been in the same soil for over two years, repot into fresh compost instead — that alone often fixes it.',
        'Expect two to four weeks before you see improvement in new growth. Existing yellow leaves will not green up.'
      ],
      prevent: 'Feed fortnightly to monthly through spring and summer at half strength, and repot every couple of years.'
    },

    'overfeeding': {
      name: 'Overfeeding',
      ico: 'flask',
      severity: 'med',
      why: 'Too much fertiliser raises the salt concentration in the soil above that inside the roots, so water is drawn out of the plant rather than into it. The roots are effectively chemically burned, and the symptoms look almost identical to drought: brown crispy edges, wilting, and a white crust on the soil.',
      fix: [
        'Stop feeding at once.',
        'Flush the pot thoroughly — run lukewarm water through it for two or three minutes and let it drain completely.',
        'Repeat the flush a couple of times over the following fortnight.',
        'In severe cases, repot into completely fresh soil, rinsing the roots gently as you go.',
        'Wait two months before feeding again, and then at a quarter to half strength.'
      ],
      prevent: 'Half the recommended dose is right for almost all houseplants. Under-feeding is easily corrected; over-feeding causes lasting root damage.'
    },

    'wrong-feed': {
      name: 'Wrong kind of feed',
      ico: 'wheat',
      severity: 'low',
      why: 'A high-nitrogen fertiliser drives lush leaf growth at the direct expense of flowers — the plant has no reason to reproduce when conditions look this good. Flowering needs phosphorus and potassium instead. This is why a well-fed peace lily or orchid can look magnificent and never bloom.',
      fix: [
        'Switch to a high-potassium or high-phosphorus feed — tomato feed works well and is cheap.',
        'For orchids specifically, use a proper orchid fertiliser weakly and weekly.',
        'Reduce nitrogen from late summer onwards so the plant shifts into flowering mode.',
        'Be patient: many plants set buds a full season before they open.'
      ],
      prevent: 'Balanced feed while growing leaves, high-potassium once you want flowers.'
    },

    'pot-bound': {
      name: 'Pot-bound',
      ico: 'spiral',
      severity: 'low',
      why: 'The roots have filled every available space and begun circling the pot. There is very little soil left to hold water or nutrients, so it dries out within a day or two of watering and starves however much you feed it. You will often see roots pushing out of the drainage holes or spiralling on the surface.',
      fix: [
        'Repot in spring into a pot 2–4cm wider in diameter. No larger — an oversized pot holds wet soil the roots cannot reach.',
        'Tease the outer roots loose and cut through any that circle the root ball tightly.',
        'If the root ball is a solid mat, slice 2cm off the sides and bottom with a clean knife to encourage fresh growth outward.',
        'Use fresh compost, and water thoroughly once potted.',
        'Keep it out of direct sun for a fortnight while it re-establishes.'
      ],
      prevent: 'Check the roots every spring. Some plants — hoyas, orchids, peace lilies — actually flower better slightly pot-bound, so do not repot on principle.'
    },

    'pot-too-big': {
      name: 'Pot is too large',
      ico: 'pot',
      severity: 'low',
      why: 'An oversized pot holds a large volume of soil that the small root system cannot drain by drinking. That soil stays wet for far too long, which leads to rot. It also encourages the plant to put its energy into filling the pot with roots rather than producing growth or flowers above.',
      fix: [
        'Repot down into something only 2–4cm wider than the root ball.',
        'Check the roots while you are there and remove any that have already rotted.',
        'Use free-draining mix and water more sparingly until the roots catch up.'
      ],
      prevent: 'Step up one pot size at a time. Resist the temptation to give a plant room to grow into.'
    },

    'old-potting-media': {
      name: 'Potting media has broken down',
      ico: 'layers',
      severity: 'med',
      why: 'Bark-based orchid mixes decompose over two or three years into a fine, water-retentive compost. That is exactly what an epiphyte\'s roots cannot cope with — they need air. The plant then rots even though you have changed nothing about your watering.',
      fix: [
        'Unpot and remove all the old broken-down bark from the roots.',
        'Trim away any dead, papery or mushy roots with sterilised scissors.',
        'Repot into fresh coarse orchid bark. Soak the new bark for an hour beforehand so it does not wick moisture away from the roots.',
        'Water sparingly for the first fortnight, misting the roots instead if you are unsure.'
      ],
      prevent: 'Repot orchids into fresh bark every two years, ideally just after flowering finishes.'
    },

    /* ---------------- Environment ---------------- */
    'low-humidity': {
      name: 'Air is too dry',
      ico: 'arid',
      severity: 'low',
      why: 'Tropical plants evolved in 70–90% humidity. Heated or air-conditioned indoor air sits nearer 20–30% — comparable to a desert. Leaves lose water through their pores faster than the roots can replace it, and the extremities go first, which is why damage starts at tips and edges.',
      fix: [
        'Group plants together. They transpire, and collectively they raise the humidity around themselves noticeably.',
        'Stand the pot on a tray of pebbles with water below the pot base — never letting the pot sit in the water itself.',
        'Move it to a bathroom or kitchen, where humidity is naturally far higher.',
        'For genuinely fussy plants — calatheas, ferns, alocasias — a small room humidifier is the only thing that reliably works.',
        'Move it away from radiators, heat pumps and air conditioning vents.',
        'Trim crispy edges with clean scissors, cutting along the leaf\'s natural line.'
      ],
      prevent: 'Misting is largely theatre — it raises humidity for a few minutes at most. Grouping, pebble trays and humidifiers actually work.'
    },

    'draughts': {
      name: 'Draughts',
      ico: 'wind',
      severity: 'low',
      why: 'A steady flow of moving air — hot or cold — strips moisture from leaves and causes rapid temperature swings at the leaf surface. Plants respond to that stress by shedding leaves, often abruptly and while the leaves are still green. Figs are notoriously sensitive to this.',
      fix: [
        'Identify the source: an entrance door, a draughty window frame, a radiator, or an air conditioning vent.',
        'Move the plant at least a metre away, or somewhere else entirely.',
        'Do not sit plants between a cold windowpane and a hot radiator — that is the worst spot in most homes.',
        'Once relocated, leave it alone. Recovery takes weeks and further moves only compound the stress.'
      ],
      prevent: 'When choosing a spot, stand there yourself for a minute and notice whether you feel moving air.'
    },

    'cold-damage': {
      name: 'Cold damage',
      ico: 'snow',
      severity: 'med',
      why: 'Below a species\' minimum temperature, cell membranes are damaged and water inside the cells can freeze or leak. The result is blackened, translucent or water-soaked patches, and the damage typically shows up a day or two after the cold event rather than immediately. Leaves touching a cold window overnight are a very common cause.',
      fix: [
        'Move it somewhere warmer immediately, away from the window glass.',
        'Do not prune damaged growth straight away — wait a fortnight to see the true extent of it.',
        'Cut watering back sharply. A cold-damaged plant cannot use much water and will rot readily.',
        'Do not feed until you see healthy new growth.',
        'Remove any blackened, mushy tissue once things have stabilised, as it invites fungal infection.'
      ],
      prevent: 'In winter, move plants back from windowsills at night and close curtains between plant and glass. Check the minimum temperature on the plant\'s profile.'
    },

    'transplant-shock': {
      name: 'Transplant or relocation shock',
      ico: 'archive',
      severity: 'low',
      why: 'Repotting inevitably tears fine root hairs, which are what actually absorb most water. Moving to a new spot changes light, temperature and humidity all at once. Either way the plant sheds leaves to reduce its water demand while it recalibrates. This is a normal adjustment, not a disease.',
      fix: [
        'Resist the urge to intervene. Do not fertilise, do not repot again, do not keep moving it.',
        'Keep the soil evenly and lightly moist — not wet — while new roots form.',
        'Keep it out of direct sun for two to three weeks.',
        'Maintain steady warmth and, if you can, a little extra humidity.',
        'Expect two to six weeks before you see new growth. Some leaf loss along the way is acceptable.'
      ],
      prevent: 'Repot in spring, when the plant has the energy to recover, and disturb the roots as little as you can. Pick a permanent spot and commit to it.'
    },

    'dormancy': {
      name: 'Natural dormancy',
      ico: 'moon',
      severity: 'low',
      why: 'Many plants — alocasias, caladiums, some begonias — die back deliberately when light and temperature drop, retreating into their tuber or rhizome to wait out the unfavourable season. It looks exactly like death. It is not. The underground parts are alive and will resprout.',
      fix: [
        'Cut watering right back to barely damp — perhaps once a month. Wet soil around a dormant tuber is what actually kills it.',
        'Stop feeding entirely until growth restarts.',
        'Keep it somewhere cool but frost-free and reasonably bright.',
        'Remove dead foliage once it has fully browned, so it does not rot.',
        'Wait. New shoots typically appear in spring as light levels climb.',
        'To confirm it is alive, feel gently in the soil for the tuber — it should still be firm.'
      ],
      prevent: 'Nothing to prevent — this is healthy behaviour. Better light and warmth through winter can reduce or avoid it if you would rather it kept growing.'
    },

    'needs-rest-period': {
      name: 'Needs a rest period to flower',
      ico: 'sleep',
      severity: 'low',
      why: 'Some plants will only set buds after a distinct environmental trigger — usually a stretch of cooler nights, shorter days, or drier soil. Kept in constant warm comfortable conditions all year, they have no signal to begin, so they simply keep making leaves.',
      fix: [
        'For Christmas cactus: give it 12–14 hours of complete darkness a night and cool 12–15°C temperatures for six weeks, keeping the soil fairly dry.',
        'For orchids: allow a night-time temperature drop of 5–10°C for a few weeks in autumn.',
        'For kalanchoe: 14 hours of darkness nightly for six weeks. A cupboard or a box over it works fine.',
        'Once buds appear, return it to normal conditions and do not move it again.',
        'Reduce nitrogen and switch to high-potassium feed during this period.'
      ],
      prevent: 'Build the rest period into your year. A cool spare room or a covered corner in autumn is usually all it takes.'
    },

    'moved-while-budding': {
      name: 'Moved or disturbed while budding',
      ico: 'move',
      severity: 'low',
      why: 'Developing buds are the first thing a stressed plant abandons, because they are metabolically expensive and not essential to survival. Any significant change while buds are forming — a new spot, a different light angle, a temperature swing, an erratic watering — can trigger the plant to drop the lot.',
      fix: [
        'Put it back where it was, if you can, and then leave it completely alone.',
        'Keep watering, light and temperature as steady as possible.',
        'Do not rotate the pot while buds are developing.',
        'The remaining buds may still open. Those already dropped will not return, but the plant is undamaged.'
      ],
      prevent: 'Choose the spot before buds form, then do not touch it. This is the single most common reason orchids and Christmas cacti drop their buds.'
    },

    'too-young': {
      name: 'Simply not mature yet',
      ico: 'sprout',
      severity: 'low',
      why: 'Plenty of plants must reach a certain size or age before they will flower or produce their adult leaf form. Monstera fenestration, hoya blooms and bird of paradise flowers all arrive only with maturity — sometimes after several years. Nothing is wrong; it is just early.',
      fix: [
        'Keep providing good light, appropriate feeding and steady care. There is no shortcut.',
        'For Monstera, give it something to climb — mature leaf form is triggered partly by climbing.',
        'For bird of paradise, expect four to six years from a young plant, and lots of sun.',
        'For hoya, two to three years, and do not cut off the old flower spurs — it reblooms from the same ones.'
      ],
      prevent: 'Patience, and buying a larger plant if you want flowers sooner.'
    },

    'natural-ageing': {
      name: 'Normal leaf ageing',
      ico: 'fall',
      severity: 'low',
      why: 'Leaves do not live forever. A plant continually retires its oldest, lowest, most shaded leaves and recycles the nutrients into new growth. One or two yellowing lower leaves while the rest of the plant looks healthy and is producing new growth is simply housekeeping.',
      fix: [
        'Check the rest of the plant. Firm stems, healthy colour and new growth mean there is nothing to fix.',
        'Remove the spent leaf once it has yellowed fully, so the plant stops spending energy on it.',
        'Pull gently or snip cleanly at the base rather than tearing.',
        'Keep an eye on the rate. One leaf a month is normal; several a week is a problem elsewhere.'
      ],
      prevent: 'Nothing to prevent. Good light and regular feeding keep the rate low.'
    },

    'needs-pruning': {
      name: 'Needs pruning',
      ico: 'scissors',
      severity: 'low',
      why: 'Many vines and shrubs put all their energy into their growing tips, producing ever-longer bare stems and abandoning the base. Cutting those tips removes the hormone that suppresses side shoots, so the plant branches instead and thickens up. Tradescantia, pothos and scheffleras all need this regularly.',
      fix: [
        'Cut each long stem back to just above a node, removing a third to a half of its length.',
        'Do not be timid — hard pruning gives much better results than a light trim.',
        'Prune in spring or summer so it regrows quickly.',
        'Root the cuttings you have just removed and plant them back into the same pot to fill it out.',
        'Feed after pruning to support the flush of new growth.'
      ],
      prevent: 'Pinch out growing tips regularly through the growing season rather than waiting until it is bare and leggy.'
    },

    'needs-support': {
      name: 'Needs something to climb',
      ico: 'trellis',
      severity: 'low',
      why: 'Climbing plants read contact with a vertical surface as a signal that they have found a tree and can safely invest in larger adult foliage. Left trailing, a Monstera or Philodendron stays in juvenile mode with small, unsplit leaves — it behaves as though still searching for a trunk.',
      fix: [
        'Add a moss pole, coir pole or plank of untreated timber to the pot.',
        'Tie the stems on loosely with soft plant ties, positioning the aerial roots against the pole.',
        'Keep a moss pole damp by misting it — the aerial roots will grip and grow into it.',
        'Expect each successive new leaf to come out larger and more deeply split.'
      ],
      prevent: 'Add support while the plant is young. Retrofitting a pole to a large sprawling plant is awkward.'
    },

    'reversion': {
      name: 'Genetic reversion',
      ico: 'dna',
      severity: 'low',
      why: 'Variegation is a mutation, and it is unstable. Plain green tissue photosynthesises better, so a reverted shoot grows more vigorously and will eventually dominate and take over the whole plant if allowed. Low light accelerates this considerably, because the plant is under pressure to maximise photosynthesis.',
      fix: [
        'Cut any fully green shoot right back to its origin as soon as you spot it.',
        'Move the plant to brighter indirect light, which favours variegated growth.',
        'Prune back to a point where the stem still shows good variegation, and let it regrow from there.',
        'Accept that some plants — particularly variegated Monstera — will always throw the occasional green leaf.'
      ],
      prevent: 'Bright indirect light and prompt removal of green reversions. Never propagate from an all-green shoot.'
    },

    'bolting-heat-stress': {
      name: 'Bolting from heat or stress',
      ico: 'thermo',
      severity: 'low',
      why: 'Herbs are annuals or biennials whose entire purpose is to set seed. Heat, drought, long days or root restriction all signal that time is short, so the plant abandons leaf production and rushes to flower. Once it does, the leaves turn bitter and tough as resources move into the seed head.',
      fix: [
        'Pinch out flower stalks the moment you see them forming — this buys you weeks of leaf harvest.',
        'Harvest more aggressively. Regular cutting delays flowering.',
        'Move it somewhere cooler, and keep the soil consistently moist.',
        'Once it has fully bolted, the flavour will not come back. Take cuttings from a side shoot, or sow fresh seed.',
        'Let one plant flower deliberately if you want seed, or for the pollinators.'
      ],
      prevent: 'Sow small batches every few weeks rather than one big sowing, keep herbs cool and well watered, and harvest often.'
    },

    'natural-wind-damage': {
      name: 'Physical or wind damage',
      ico: 'wind',
      severity: 'low',
      why: 'Large thin leaves tear easily against nearby objects, in a draught, or simply from being brushed past. On some plants — bird of paradise especially — splitting along the leaf is entirely natural with age, and in the wild helps the plant shed wind load without snapping.',
      fix: [
        'Move the plant out of a high-traffic route or away from a draught.',
        'Split leaves cannot heal. Leave them unless they look bad to you — they still photosynthesise perfectly well.',
        'Support tall leaves with a stake if they are catching on things.',
        'On a bird of paradise, accept it. Split leaves are a sign of a mature, healthy plant.'
      ],
      prevent: 'Give large-leaved plants clearance on all sides, and keep them off busy corridors.'
    },

    'crown-rot': {
      name: 'Crown rot',
      ico: 'droplets',
      severity: 'high',
      why: 'Water sitting in the centre of a rosette, or where leaves meet the stem, has nowhere to evaporate to. Bacteria and fungi flourish in that pocket and rot the growing point. Because that point is where all new growth comes from, losing it is often fatal — this is why rosette-forming plants must never be watered overhead.',
      fix: [
        'Tip the plant carefully to drain any standing water, and blot the crown dry with kitchen paper.',
        'Cut away all soft, brown or slimy tissue with sterilised scissors, back to firm clean growth.',
        'Dust the wound with cinnamon or a sulphur-based fungicide.',
        'Move it somewhere with good airflow so the crown dries fast.',
        'Water only at the soil, around the edge of the pot, from now on.',
        'If the growing point is entirely gone, look for offsets or pups at the base — they may be all you can save.'
      ],
      prevent: 'Water at the soil, never into the crown. Water in the morning so any splashes dry during the day.'
    },

    /* ---------------- Pests ---------------- */
    'spider-mites': {
      name: 'Spider mites',
      ico: 'web',
      severity: 'high',
      why: 'Barely visible arachnids, under half a millimetre across, that pierce leaf cells and drain them. The tell-tale signs are fine pale stippling — a sand-blasted look — and delicate webbing in the leaf joints. They thrive in hot dry air and reproduce in about a week, so an infestation escalates alarmingly fast. To confirm, hold a sheet of white paper under a leaf and tap: you will see moving specks.',
      fix: [
        'Isolate the plant immediately, well away from everything else. Mites travel.',
        'Take it to a shower or outside and blast every leaf surface with water, paying particular attention to the undersides.',
        'Spray thoroughly with insecticidal soap or a horticultural oil such as neem, wetting the undersides until they drip.',
        'Repeat every five to seven days for at least three cycles — sprays kill adults but not eggs, so you must break the hatching cycle.',
        'Wipe down the shelf, windowsill and pot exterior, where eggs also sit.',
        'Raise the humidity around the plant. Mites genuinely hate damp air, and this is your best long-term defence.',
        'Check every neighbouring plant carefully for a fortnight.'
      ],
      prevent: 'Keep humidity up and inspect leaf undersides monthly. Quarantine every new plant for two weeks before it joins the others.'
    },

    'mealybugs': {
      name: 'Mealybugs',
      ico: 'cloud',
      severity: 'med',
      why: 'Soft scale insects that coat themselves in a white waxy fluff resembling cotton wool. They cluster in leaf joints, along stems and under leaves, feeding on sap and excreting sticky honeydew. The waxy coating repels water and many sprays, which is exactly why they are stubborn — you generally have to touch each one.',
      fix: [
        'Isolate the plant from your others.',
        'Dab each visible insect with a cotton bud dipped in surgical spirit. This dissolves the wax and kills them on contact.',
        'Then spray the whole plant with insecticidal soap or neem oil, covering leaf undersides and joints.',
        'Check the soil surface and the top of the root ball — mealybugs also live on roots.',
        'Repeat weekly for at least four weeks. They hide in crevices and you will miss some every time.',
        'Wipe the pot, saucer and shelf, and inspect neighbouring plants.'
      ],
      prevent: 'Inspect leaf joints when you water. Quarantine new plants. Mealybugs almost always arrive on a new purchase.'
    },

    'scale': {
      name: 'Scale insects',
      ico: 'bumps',
      severity: 'med',
      why: 'Sap-suckers that, once settled, grow a hard protective shell and stop moving entirely — which is why people mistake them for a natural bump or a bit of dirt. They sit along stems and leaf veins, draining the plant and excreting honeydew that then grows black sooty mould. The shell makes them highly resistant to contact sprays.',
      fix: [
        'Isolate the plant.',
        'Scrape the scales off physically with a fingernail, an old toothbrush or a blunt knife. This is the most effective single step.',
        'Wipe every stem and leaf with a cloth dipped in soapy water or diluted surgical spirit.',
        'Follow up with horticultural oil, which smothers the young mobile crawlers you cannot see.',
        'Repeat every 10–14 days for two months. Their life cycle is slow, so treatment must be persistent.',
        'Prune out any badly encrusted stems entirely — it is quicker than treating them.',
        'Wash off sooty mould with soapy water once the insects are gone.'
      ],
      prevent: 'Inspect stems and the undersides of leaf veins monthly, especially on ficus, citrus and ferns. Quarantine new arrivals.'
    },

    'fungus-gnats': {
      name: 'Fungus gnats',
      ico: 'fly',
      severity: 'low',
      why: 'Small dark flies that breed in persistently damp compost, where their larvae feed on fungi and organic matter. The adults are a nuisance rather than a threat, though large larval populations will nibble fine roots on seedlings. Their real significance is diagnostic: they are proof the top of your soil is staying wet for too long.',
      fix: [
        'Let the top 3–5cm of soil dry out fully between waterings. This alone breaks the breeding cycle, as larvae cannot survive dry compost.',
        'Water from the bottom for a few weeks, so the surface stays dry.',
        'Cover the soil surface with a 1cm layer of horticultural grit, sand or decorative pebbles — the adults then cannot reach the compost to lay.',
        'Hang yellow sticky traps just above the soil to catch the flying adults and monitor progress.',
        'For a heavy infestation, water with a Bacillus thuringiensis israelensis drench, which targets the larvae specifically and is harmless to the plant.',
        'Expect two to three weeks to clear, as you are waiting out the existing generation.'
      ],
      prevent: 'Do not overwater, avoid saucers of standing water, and top-dress with grit on plants you tend to keep damp.'
    },

    'aphids': {
      name: 'Aphids',
      ico: 'bug',
      severity: 'low',
      why: 'Soft pear-shaped insects, green, black, pink or grey, that mass on the softest new growth and flower buds. They reproduce without mating and give birth to live young, so a colony explodes in days. Their honeydew makes leaves sticky and grows sooty mould, and they can transmit plant viruses.',
      fix: [
        'Knock them off with a firm jet of water — for a light infestation this may be all you need.',
        'Or squash them between finger and thumb, which is crude but immediate and effective.',
        'Spray with insecticidal soap, covering growing tips and bud clusters where they congregate.',
        'Repeat every four or five days until you see no new colonies.',
        'Pinch out badly infested growing tips altogether.',
        'Check for ants — they farm aphids for honeydew and will actively move them around and protect them.'
      ],
      prevent: 'Inspect new growth weekly in spring, when aphids appear. Avoid heavy nitrogen feeding, which produces the soft sappy growth they prefer.'
    },

    'thrips': {
      name: 'Thrips',
      ico: 'bug',
      severity: 'high',
      why: 'Slender insects a millimetre or two long that rasp the leaf surface and drink the contents of the cells, leaving silvery streaks, distorted new growth and tiny black specks of excrement. They are hard to see, they fly, and they pupate in the soil — which makes them among the most tenacious of houseplant pests.',
      fix: [
        'Isolate the plant straight away. Thrips spread readily and are difficult to eradicate.',
        'Cut off the worst-affected and distorted leaves and bin them, sealed, outside.',
        'Spray thoroughly with insecticidal soap or neem oil, covering both leaf surfaces.',
        'Also drench the soil, because the pupal stage lives there and untreated soil will simply reinfest the plant.',
        'Repeat every five days for at least four weeks — this is a long campaign.',
        'Use blue sticky traps, which attract thrips more effectively than yellow ones.',
        'For a severe case on a plant you are not attached to, disposal is the pragmatic option.'
      ],
      prevent: 'Quarantine new plants for a fortnight and inspect new growth for silvery streaking. Thrips almost always arrive on a new plant or fresh flowers.'
    },

    /* ---------------- Diseases ---------------- */
    'powdery-mildew': {
      name: 'Powdery mildew',
      ico: 'spore',
      severity: 'med',
      why: 'A fungal infection that appears as a white flour-like dusting on the upper leaf surface. Unusually among fungi it does not need standing water — it thrives in humid but still air with poor circulation, and in swings between warm days and cool nights. Left alone it blocks light from the leaf and growth stalls.',
      fix: [
        'Improve air circulation immediately — space the plants out, or run a small fan nearby for a few hours a day.',
        'Remove and bin the worst-affected leaves. Do not compost them.',
        'Spray with a solution of one teaspoon of bicarbonate of soda plus a few drops of washing-up liquid in a litre of water, which alters the leaf surface pH.',
        'Alternatively use a milk spray — one part milk to nine parts water — which is genuinely effective and well documented.',
        'Neem oil or a proprietary fungicide works for stubborn cases.',
        'Water at the soil and avoid wetting the foliage from now on.',
        'Repeat weekly until no new patches appear.'
      ],
      prevent: 'Space plants for airflow, avoid overhead watering, and water in the morning so any splashes dry quickly.'
    },

    'rust': {
      name: 'Rust',
      ico: 'spore',
      severity: 'med',
      why: 'A fungal disease producing raised orange, brown or rust-coloured pustules on the underside of leaves, with corresponding pale spots on top. The pustules release spores that smudge onto your fingers and spread on air currents and water splash. It needs prolonged leaf wetness to establish, so it is common on mint and other damp-loving herbs.',
      fix: [
        'Remove and bin every affected leaf immediately — sealed, and not into the compost.',
        'Wash your hands and sterilise your scissors afterwards; the spores travel very easily.',
        'Improve airflow and stop misting or overhead watering entirely.',
        'Spray remaining foliage with a sulphur-based or copper fungicide.',
        'For mint, the standard approach is to cut the whole plant back to soil level and let it regrow clean.',
        'Keep it isolated for a month and watch for recurrence.'
      ],
      prevent: 'Water at the base only, allow good air circulation, and avoid crowding damp-loving herbs together.'
    },

    'leaf-spot-fungal': {
      name: 'Fungal or bacterial leaf spot',
      ico: 'target',
      severity: 'med',
      why: 'Pathogens entering through the leaf surface, producing defined round or angular spots that are often ringed with a yellow halo. Fungal spots tend to be dry and brown with a distinct edge; bacterial ones are darker, wetter and may look water-soaked. Both need moisture on the leaf to establish, so splashing water and still humid air are what let them in.',
      fix: [
        'Remove all spotted leaves with sterilised scissors and bin them, sealed.',
        'Isolate the plant from your others until it stops producing new spots.',
        'Stop all overhead watering and misting. Water at the soil only.',
        'Improve airflow around the plant.',
        'Treat remaining foliage with a copper-based fungicide if spots keep appearing.',
        'Reduce watering frequency generally, since consistently wet conditions are what favour the pathogen.',
        'If spots keep spreading despite all this, it is likely bacterial — much harder to treat, and disposal may be the sensible call.'
      ],
      prevent: 'Water the soil rather than the plant, keep leaves dry, allow air movement, and quarantine new arrivals.'
    }
  };

  /* ======================================================================
     Diagnostic engine
     ====================================================================== */

  /* Rank causes for a symptom given the user's confirmed clues.
     `proneTo` is the plant's own list of known weaknesses. */
  function diagnose(symptomId, selectedClues, proneTo) {
    const symptom = SYMPTOMS[symptomId];
    if (!symptom) return [];

    const clues = selectedClues || [];
    const prone = proneTo || [];

    const scored = Object.keys(symptom.causes).map(function (causeId) {
      let score = symptom.causes[causeId];

      // Clues that support this cause.
      clues.forEach(function (clueId) {
        if (SUPPORTS[causeId] && SUPPORTS[causeId].indexOf(clueId) !== -1) score += 6;
      });

      // Clues that argue against it.
      clues.forEach(function (clueId) {
        if (CONTRA[causeId] && CONTRA[causeId].indexOf(clueId) !== -1) score -= 7;
      });

      // This species is known for this problem.
      if (prone.indexOf(causeId) !== -1) score += 4;

      return { id: causeId, cause: CAUSES[causeId], score: score };
    })
    .filter(function (r) { return r.cause && r.score > 0; })
    .sort(function (a, b) { return b.score - a.score; });

    /* Express scores as a share of the top result, for a confidence readout.
       Both forms are returned: `confidence` is the word a person reads, and
       `share` the number the view draws the meter from. The percentage used
       to be computed here and then thrown away, which is why the meter in
       the stylesheet had nothing to fill it and rendered as a bare 2px line.
       The word alone is also lossy in the direction that matters — three
       causes can all be "Possible" at 84, 60 and 56, and the ranking is the
       whole output of this function. */
    const top = scored.length ? scored[0].score : 1;
    return scored.map(function (r) {
      const pct = Math.max(6, Math.min(100, Math.round((r.score / top) * 100)));
      return Object.assign({}, r, {
        share: pct,
        confidence: pct >= 85 ? 'Most likely' : pct >= 55 ? 'Possible' : 'Less likely'
      });
    });
  }

  /* Which clues support which causes. Derived from the clue lists above but
     stated explicitly, because the mapping is the actual diagnostic logic. */
  const SUPPORTS = {
    /* `roots-brown` deliberately supports root-rot only. Brown, mushy roots
       are not a symptom of overwatering — they are the point at which it has
       already become rot, and the treatment changes completely. Leaving it on
       both left the two causes tied at every score, so the single most
       decisive thing a user can check made no difference to the ranking. */
    'overwatering':        ['soil-wet', 'soil-smell', 'no-drainage', 'stems-soft', 'lower-leaves', 'flying-gnats'],
    'root-rot':            ['roots-brown', 'soil-smell', 'stems-soft', 'soil-wet', 'no-drainage'],
    'underwatering':       ['soil-dry', 'water-runs-through', 'texture-dry', 'edges-first'],
    'inconsistent-watering': ['soil-dry', 'soil-wet'],
    'tap-water-minerals':  ['tap-water', 'white-crust', 'all-over'],
    'salt-buildup':        ['white-crust', 'fed-lots', 'never-repotted'],
    'too-little-light':    ['low-light-spot', 'stems-long', 'leaning', 'new-growth'],
    'too-much-light':      ['direct-sun', 'sun-side', 'texture-dry'],
    'sunburn':             ['direct-sun', 'sun-side', 'recently-moved', 'texture-dry'],
    'needs-rotation':      ['leaning', 'sun-side'],
    'nutrient-deficiency': ['not-fed', 'never-repotted', 'lower-leaves', 'all-over'],
    'overfeeding':         ['fed-lots', 'white-crust', 'edges-first'],
    'wrong-feed':          ['fed-lots'],
    'pot-bound':           ['roots-circling', 'never-repotted', 'soil-dry'],
    'pot-too-big':         ['soil-wet', 'recently-moved'],
    'old-potting-media':   ['never-repotted', 'roots-brown'],
    'low-humidity':        ['dry-air', 'edges-first', 'texture-dry', 'near-draught'],
    'draughts':            ['near-draught', 'cold-spot', 'all-over'],
    'cold-damage':         ['cold-spot', 'spots-mushy', 'near-draught', 'winter-now'],
    'transplant-shock':    ['recently-moved'],
    'dormancy':            ['winter-now', 'lower-leaves'],
    'needs-rest-period':   ['winter-now'],
    'moved-while-budding': ['recently-moved', 'flower-buds-fell'],
    'too-young':           ['new-growth'],
    'natural-ageing':      ['lower-leaves'],
    'needs-pruning':       ['stems-long', 'low-light-spot'],
    'needs-support':       ['new-growth'],
    'reversion':           ['new-growth', 'low-light-spot'],
    'bolting-heat-stress': ['direct-sun', 'soil-dry'],
    'natural-wind-damage': ['near-draught', 'all-over'],
    'crown-rot':           ['crown-wet', 'stems-soft', 'spots-mushy', 'soil-wet'],
    'spider-mites':        ['webbing', 'tiny-dots', 'stippling', 'dry-air'],
    'mealybugs':           ['white-fluff', 'sticky'],
    'scale':               ['brown-bumps', 'sticky'],
    'fungus-gnats':        ['flying-gnats', 'soil-wet'],
    'aphids':              ['green-clusters', 'sticky', 'new-growth'],
    'thrips':              ['stippling', 'new-growth'],
    'powdery-mildew':      ['white-powder'],
    'rust':                ['orange-pustules'],
    'leaf-spot-fungal':    ['spots-defined', 'spots-mushy', 'soil-wet']
  };

  /* Look an id up whether it is a symptom or a cause — plant `problems`
     lists mix the two. */
  function describe(id) {
    /* `ico` is an icon name for UI.icon(), not a glyph. Symptoms have none of
       their own by design — no 18px monoline mark can tell "brown spots" from
       "brown tips only", so the symptom list is set in type alone and reads
       the better for it. Where a symptom must carry a mark anyway (the chips
       on a plant page mix symptoms and causes) it borrows the clinic glyph. */
    if (CAUSES[id])   return { kind: 'cause',   id: id, label: CAUSES[id].name,   ico: CAUSES[id].ico, data: CAUSES[id] };
    if (SYMPTOMS[id]) return { kind: 'symptom', id: id, label: SYMPTOMS[id].label, ico: 'stethoscope',  data: SYMPTOMS[id] };
    return null;
  }

  /* Symptoms worth showing first for a given plant. */
  function symptomsForPlant(plant) {
    const prone = (plant && plant.problems) || [];
    const ids = Object.keys(SYMPTOMS);
    return ids.sort(function (a, b) {
      const aP = prone.indexOf(a) !== -1 ? 1 : 0;
      const bP = prone.indexOf(b) !== -1 ? 1 : 0;
      return bP - aP;
    }).map(function (id) {
      return Object.assign({ id: id, prone: prone.indexOf(id) !== -1 }, SYMPTOMS[id]);
    });
  }

  return { CLUES, SYMPTOMS, CAUSES, CONTRA, SUPPORTS, diagnose, describe, symptomsForPlant };
})();
