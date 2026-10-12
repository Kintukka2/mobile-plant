# Adding a species

Everything a new entry in `js/data/plants.js` needs, in the order you need it.
Copy the skeleton in section 2 into the right section of `PLANT_DATA`, fill
it in using the field guide in section 3, then work through the checklist at
the end. A species is not done when its record is: it also has a photograph, a
row on the marketing site, and a cache bump.

```bash
node .claude/check-species.js     # run after every change to plants.js
```

---

## 1. Before you write anything

**Pick the id, once.** The id is the botanical name as a lowercase slug
(`monstera-deliciosa`, `tillandsia-xerographica`). It is stored on every plant
a reader adds (`plant.speciesId`), so it can never change after release.
When a botanical name is revised later, `botanical` moves and the id stays.
That is why `calathea-orbifolia` reads *Goeppertia orbifolia* and
`vriesea-splendens` reads *Lutheria splendens*. For a new species, use the
name people search for and buy under. If that is an old name, put the current
one in `botanical` and the old one in `aka`.

**Check the names are free.** `common` and every `aka` are searched together
across all species. Calathea and Maranta already share "Prayer Plant"; avoid
adding another collision.

**Find the toxicity rating first.** It decides the pet-safe filter, the
warning on the add form, the site's "N safe for cats and dogs" figure, and
whether the record gets a `pet-safe` tag. The source is the ASPCA list
(`aspca.org/pet-care/animal-poison-control/cats-plant-list`, and the dogs
list). When the ASPCA does not list a plant, say so in `tox.note`; never
write "the ASPCA rates it" for a plant it does not list.

**Know how it is watered.** If it is not poured onto soil, it needs a
`water.method` (section 3), and that changes what Today, the watering card and
the plant form show.

---

## 2. The skeleton

Only the fields marked *required* have no default. Leave out any other field
and `normalise()` fills it in (the defaults are listed in section 3). A
record that relies on a default is saying it is typical, so only leave out
what genuinely is.

```js
    {
      id: 'genus-species',                       // required, permanent
      common: 'Common Name',                     // required
      aka: ['Other Name', 'Trade Name'],
      botanical: 'Genus species',                // required, current accepted name
      family: 'Familyaceae',
      origin: 'Where it grows wild, as a place rather than a country list',
      difficulty: 'easy',                        // easy | medium | hard
      growthRate: 'moderate',                    // slow | moderate | fast
      matureCm: 60,                              // height indoors, or strand length for a trailer
      water: {
        warm: 7, cool: 14,                       // required: days between waterings
        soakPct: 0.25, dryBetween: true,         // soakPct for poured plants only
        // method: 'dip',                        // leave out for an ordinary pour
        note: 'How to tell it is ready for water, and how to give it.'   // required
      },
      light: {
        ideal: 'bright-indirect',                // required
        tolerates: ['medium'],                   // with avoid, covers every other rung exactly once
        avoid: ['direct', 'low'],
        note: 'What it does in too little and too much light.'           // required
      },
      humidity: 'medium', minC: 12, idealC: [18, 26],
      fert: { everyDays: 28, strength: 'half', type: 'Balanced liquid feed' },
      soil: 'What to pot it in, and why.',
      repot: 'How often, and anything particular about it.',
      tox: { cats: 'safe', dogs: 'safe', humans: 'safe',               // required
        note: 'What it contains and what happens, or the source of the safe rating.' },
      prop: [{
        m: 'Stem cutting in water', diff: 'easy', season: 'Spring or summer', roots: '3–5 weeks',
        steps: [
          'One action per step, in order.',
          'Say what to look for, not just what to do.'
        ]
      }],
      seed: null,                                // or a seed block, section 3
      likes: ['Two to four short phrases'],
      dislikes: ['Two to four short phrases'],
      problems: ['a-cause-id', 'a-symptom-id'],
      tags: ['beginner']
    },
```

Put it in the section it belongs to (`EASY FOLIAGE`, `STATEMENT FOLIAGE`,
`FERNS & HUMIDITY LOVERS`, `SUCCULENTS & CACTI`, `VINES & TRAILERS`,
`FLOWERING`, `EDIBLE & HERBS`, `AIR PLANTS & BROMELIADS`). The order of
`PLANT_DATA` is the order of the site's species list, so the site row goes in
the same position.

---

## 3. Field guide

The ranges quoted are what the current catalogue spans. A figure outside them
is allowed, but check it twice.

### Identity

| Field | Required | Default | Notes |
|---|---|---|---|
| `id` | yes | — | Lowercase slug. Permanent: see section 1. Also names the photograph, `img/species/<id>.webp`. |
| `common` | yes | — | The name shown everywhere. Title Case. The site list quotes it verbatim, and the species check compares the two. |
| `aka` | | `[]` | Other names people search by. Searched with `common`, `botanical` and `tags`. |
| `botanical` | yes | — | Current accepted name, in italics on screen. Use `Genus hybrids` for a hybrid group (*Phalaenopsis hybrids*). |
| `family` | | `''` | Shown on the species page. |
| `origin` | | `''` | Shown on the species page. A habitat reads better than a list of countries: "Dry forests of southern Mexico". |

### How it grows

| Field | Required | Default | Values |
|---|---|---|---|
| `difficulty` | | `'medium'` | `easy` (shown as Forgiving), `medium` (Steady hand), `hard` (Fussy). Drives the Beginner and A challenge filters. |
| `growthRate` | | `'moderate'` | `slow`, `moderate`, `fast`. |
| `matureCm` | | `100` | Indoors, not in the wild. Catalogue spans 8–300. A trailer's figure is its length. |
| `humidity` | | `'medium'` | `low` (dry air is fine), `medium` (around 40–50%), `high` (60% or more). `high` scores a humid room higher when ranking rooms. |
| `minC` | | `12` | The lowest temperature it tolerates. Must be below `idealC[0]`. At 12 or above, the plant is named in the cold-night warning when the forecast drops to 5°C. Catalogue spans −5 to 16. |
| `idealC` | | `[18, 26]` | Comfortable range, low then high. |

### Water

| Field | Required | Notes |
|---|---|---|
| `water.warm` | yes | Days between waterings in the growing season, for a 15cm plastic pot in the ideal light. Catalogue spans 2–21. |
| `water.cool` | yes | Days in dormancy (autumn and winter in the reader's hemisphere). Must be at least `warm`. Catalogue spans 4–45. |
| `water.soakPct` | poured plants | Fraction of the pot's volume to give, which becomes the millilitre figure. 0.2 for succulents and dry-lovers, 0.25 for most, 0.3–0.4 for thirsty plants and orchids in bark. Leave it out for any other method. |
| `water.dryBetween` | | `true` if it should dry out between waterings, `false` if it wants to stay damp. Not read by the app yet, but keep it accurate. |
| `water.method` | | Leave it out for an ordinary pour. Otherwise one key from `LOOKUPS.WATER_METHODS`, below. |
| `water.seasons` | | Only for a plant that keeps its own calendar: days per season, `{ spring, summer, autumn, winter }`, where `0` means it rests and gets no water at all. A season left out falls back to `warm` or `cool`. Living Stones are the worked example: `{ spring: 21, summer: 0, autumn: 14, winter: 0 }`. A resting plant gets no task or reminder, and its page says when watering starts again. The species check fails on any other key, on a negative number, and on a plant that would never be watered. |
| `water.note` | yes | Reference voice (section 4). How to tell it needs water and how to give it. For any method but `pour`, this is where the specifics go (how long to soak, how full to keep the cup). |

The schedule adjusts the two day counts for room light, season and weather.
For potted plants it also adjusts for pot size, pot material and drainage. So
state the figures for the reference case and let it do the rest.

**Methods** (`LOOKUPS.WATER_METHODS`):

| Method | For | Has a pot | Pot moves the interval | Today says |
|---|---|---|---|---|
| `pour` (default) | Almost everything | yes | yes | the millilitre figure |
| `soak` | Green air plants, a long soak | no | no | Soak the whole plant |
| `dip` | Silver or bulb-based air plants, rot if soaked | no | no | Dip it, then shake it dry |
| `mist` | Plants kept damp from the air (*T. tectorum*, Spanish moss) | no | no | Mist it until the leaves are wet |
| `bottom` | Plants that must not get wet leaves (African Violet) | yes | yes | Water from the saucer |
| `cup` | Bromeliads that drink from a central cup | yes | no | Top up the central cup |
| `tray` | Bog plants that stand in rainwater (Venus Flytrap) | yes | no | Top up the tray with rainwater |

A plant without a pot gets no pot questions on the add form. A new method
needs an entry in `LOOKUPS.WATER_METHODS` (`js/data/lookups.js`) with
`measured`, `potted`, `potDrying`, `task` and `card`. The species check fails
on a method that is not in the table.

### Light

`LOOKUPS.LIGHT` rungs, dimmest first: `none`, `low`, `medium`,
`bright-indirect`, `direct`.

| Field | Required | Notes |
|---|---|---|
| `light.ideal` | yes | One rung. Never `none`, which means no window at all. |
| `light.tolerates` | | Rungs where it will cope. A room here gets "It will cope with…". |
| `light.avoid` | | Rungs that harm it. A room here gets "…is specifically bad for this plant". |
| `light.note` | yes | What it does when the light is wrong in each direction. |

**Rate every rung exactly once.** Between `ideal`, `tolerates` and `avoid`,
each of `low`, `medium`, `bright-indirect` and `direct` appears once and only
once. A rung left out gets a vaguer verdict, "Expect slow, stretched growth
here", which is wrong for a plant that would really be scorched. The species
check fails on a record that leaves one out or names one twice. `tolerates`
can be empty: Echeveria wants direct sun and avoids everything else.

### Feeding, soil, repotting

| Field | Default | Notes |
|---|---|---|
| `fert.everyDays` | `28` | Days between feeds in the growing season only; nothing is due in dormancy. Catalogue spans 14–84. |
| `fert.never` | | `true` for a plant that must never be fed (carnivorous plants, Living Stones), with `fert.note` saying why: the feeding card shows that note and no feed is ever due. Give it as the whole `fert`: `{ never: true, note: '…' }`. The species check fails on `never` without a note. |
| `fert.strength` | `'half'` | `full`, `half` or `quarter`. Shown as Full, ½ or ¼ strength. |
| `fert.type` | `'Balanced liquid houseplant feed'` | Say how to give it if it is unusual ("added to the soaking water", "never left in the cup"). |
| `soil` | a standard mix with perlite | State it unless the standard mix really is right. "None" for a plant with no pot. |
| `repot` | every 2 years in spring | State it unless that really is right. "Never" for a plant with no pot. |

### Toxicity

| Field | Required | Values |
|---|---|---|
| `tox.cats`, `tox.dogs` | yes | `safe`, `mild`, `toxic`, `very-toxic`, from the ASPCA where it lists the plant. |
| `tox.humans` | yes | Same ladder. `mild` covers skin-irritant sap and spines. |
| `tox.note` | yes | The compound and the effect, plainly, or the source of a safe rating. Reference voice: no reassurance and no jokes. |

Keep `very-toxic` for genuinely dangerous plants: it is the oxblood chip and
exactly one species carries it (Kalanchoe, for cardiac glycosides). A plant is
pet safe only when `cats` and `dogs` are both `safe`; `mild` is not pet safe.

### Propagation

`prop` is a list of methods. Each method:

| Key | Notes |
|---|---|
| `m` | Method name, e.g. "Stem cutting in water", "Division", "Offsets (pups)". |
| `diff` | `easy`, `medium` or `hard`. |
| `season` | When to do it, e.g. "Spring", "Any time of year", "After flowering". |
| `roots` | A bare duration, "3–5 weeks", which the plant page shows as "Roots in 3–5 weeks"; or a phrase that reads on its own: "Already rooted", "No rooting needed", "Germinates in 2–4 months". Never "Immediate" or "N/A". |
| `steps` | Three to six steps, one action each. |

Most species list one method. A second one (division as well as cuttings,
say) is worth adding wherever it is real, as Pothos, Spider Plant, Rubber
Plant, Chinese Money Plant, ZZ Plant and Snake Plant have.

`seed` is `null`, or for species really grown from seed at home:

```js
      seed: {
        viable: true,                       // false shows "rarely works"
        sowSeason: 'Early spring, indoors', // shown as "Sow in …"
        germDays: '5–10 days',              // shown as "Germinates in …"
        depthMm: 5,
        steps: ['…']
      },
```

### Likes, dislikes, problems

`likes` and `dislikes` are two to four short phrases each, no full stops.

`problems` mixes two kinds of id from `js/data/problems.js`, and each does a
different job:

- **Symptom ids** move those symptoms to the top of the list when the reader
  diagnoses this plant.
- **Cause ids** add +4 to that cause's score in this plant's diagnosis.

Both kinds are shown under "What tends to go wrong", on the species page and
the plant page.

List at least one cause, or the plant gets no species-specific weighting at
all. The species check fails on a list with no cause, and on an id that is
neither a symptom nor a cause.

**Symptoms:** `yellow-lower-leaves`, `brown-crispy-edges`, `brown-tips-only`,
`brown-spots-leaves`, `drooping`, `leaves-curling`, `leaves-falling-off`,
`leaf-drop-sudden`, `leggy-stretching`, `pale-washed-out`, `variegation-loss`,
`no-flowers`, `no-fenestration`, `mushy-base`, `leaves-falling-over`,
`leaning`, `frond-dieback`, `shrivelled-pearls`, `shrivelled-segments`,
`limp-leaves`, `green-flowers`, `bud-drop`, `bolting`, `leaf-splitting`,
`dormancy-dieback`, `pests-general`.

**Causes:** `overwatering`, `root-rot`, `underwatering`,
`inconsistent-watering`, `tap-water-minerals`, `salt-buildup`,
`too-little-light`, `too-much-light`, `sunburn`, `needs-rotation`,
`nutrient-deficiency`, `overfeeding`, `wrong-feed`, `pot-bound`,
`pot-too-big`, `old-potting-media`, `low-humidity`, `draughts`,
`cold-damage`, `transplant-shock`, `dormancy`, `needs-rest-period`,
`moved-while-budding`, `too-young`, `natural-ageing`, `needs-pruning`,
`needs-support`, `reversion`, `bolting-heat-stress`, `natural-wind-damage`,
`crown-rot`, `spider-mites`, `mealybugs`, `scale`, `fungus-gnats`, `aphids`,
`thrips`, `powdery-mildew`, `rust`, `leaf-spot-fungal`.

**Causes for particular plants**, which change what the reader is told:

| Cause | Use for | Effect |
|---|---|---|
| `cup-rot` | Cup-watered bromeliads | Replaces `crown-rot`, whose treatment is never to water the crown. |
| `air-plant-rot` | Every Tillandsia | Replaces `crown-rot`, `root-rot` and `overwatering`, whose treatments are about soil. |
| `air-plant-thirst` | Every Tillandsia | Replaces `underwatering`. |
| `flowered-out` | Plants whose rosette dies after its one flowering | Only reaches a species that lists it. |
| `leaf-pair-change` | Living Stones | Only reaches a species that lists it. Shrivelling in winter and spring is the new leaf pair growing, not thirst. |
| `carnivore-dormancy` | Venus Flytrap | Replaces `dormancy`, whose advice to keep the soil barely damp is wrong for a bog plant. |

Before writing a generic cause for a plant, read its treatment steps and ask
whether they are true for this plant. If they are not, the plant needs its own
cause with `replaces`: see "When adding a cause" in `CLAUDE.md`.

### Tags

Tags feed search and most of Discover's filter chips. Discover's filters
are `beginner`, `pet-safe`, `low-light`, `sun-lover`, `trailing`,
`succulent`, `drought-tolerant` (shown as Forgiving), `humidity-lover`,
`flowering`, `statement`, `compact`, `herb`, `air-purifying` and `tricky`
(shown as A challenge). Other tags in use, for search only: `colourful`,
`fast-growing`, `epiphyte`, `architectural`, `bathroom`, `no-soil`,
`unusual`, `climbing`, `office`, `tree`, `patterned`, `easy-propagation`,
`large`, `dramatic`, `edible`, `kitchen`, `palm`, `cool-tolerant`,
`delicate`, `terrarium`, `edible-use`, `bonsai`.

Four filters (Pet safe, Beginner, A challenge, Low light) read the care data
rather than the tag, but search reads the tag. So a tag that disagrees with
the data puts the plant in front of the wrong reader. Keep these in step:

| Tag | Exactly when |
|---|---|
| `pet-safe` | `tox.cats` and `tox.dogs` are both `safe`. The species check fails otherwise. |
| `beginner` | `difficulty` is `easy`. |
| `tricky` | `difficulty` is `hard`. |
| `low-light` | `light.ideal` is `low`, or `tolerates` includes `low`. |
| `sun-lover` | `light.ideal` is `direct`. |
| `humidity-lover` | `humidity` is `high`. |
| `compact` | `matureCm` is 30 or less. |

---

## 4. How the text reads

Everything in a species record is **reference voice**: plain and
authoritative, with no persona. Sprout's first person ("I'll…") belongs on
conversational surfaces, never in care data, treatments or toxicity notes.

- British English: colour, fertilise, mould, centre, metres.
- No exclamation marks.
- Explain why when it changes what the reader does: "Those famous holes only
  develop in good light."
- Give a sign to look for over a fixed rule: "Water when the top 3–5cm is
  dry to your finger", not "Water every Tuesday".
- Never blame the reader. "Far more snake plants die of kindness than of
  thirst" is the register; "you are overwatering it" is not.
- Apostrophes in single-quoted strings are escaped (`'the parent\'s size'`).
  Escaping is never a reason to avoid one.
- The en dash for ranges (`3–5 weeks`, `18–26°C`), and the em dash with spaces
  ( — ) as the existing records use it.

---

## 5. Outside the record

| Where | What | Checked by |
|---|---|---|
| `img/species/<id>.webp` | The photograph: a cut-out with a transparent background, 720×900, cut from a Pexels photo. It sits on the plant's tinted plate, so a photo with its own backdrop breaks the set. | species check |
| `docs/species-photo-sources.csv` | One row: `species_id,common_name,file,source,licence`. | by eye |
| `site/index.html` | One `<li class="sp-row">` in `PLANT_DATA` order: `data-find` (common, botanical and every aka, lowercase), `sp-name`, `sp-bot`, and `<span class="sp-tag">Pet safe</span>` if pet safe. If pet safe, also update the "N safe for cats and dogs" line. | species check |
| `sw.js` | Bump `CACHE` and add a line to the version note above it. `plants.js` is a cached file, so returning readers keep the old list until the name changes. The photograph is not added to `ASSETS`. | by eye |
| `js/data/problems.js` | Only if the plant needs a cause or symptom that does not exist: a `CAUSES` entry, a symptom that lists it (or `replaces`), and a `SUPPORTS` row. | by eye |
| Counts | The species count in `CLAUDE.md` (Data model) and `README.md`, and the toxic count in `brand.html`. The site deliberately states no species count, and the check fails if one appears. | by eye |

---

## 6. Checklist

- [ ] Id chosen once, as the slug of the name people buy it under
- [ ] `common` and every `aka` searched against the existing records
- [ ] Toxicity taken from the ASPCA list, or the note says it is not listed
- [ ] Watering method decided; `soakPct` given only if poured
- [ ] Every light rung rated exactly once (the species check enforces it)
- [ ] `cool` at least `warm`; `minC` below `idealC[0]`
- [ ] Every propagation `roots` reads after "Roots in", or on its own
- [ ] At least one cause id in `problems`, and the treatments checked against this plant
- [ ] Tags agree with the data (section 3, Tags)
- [ ] Reference voice, British English, no exclamation marks
- [ ] Photograph in `img/species/` and a row in `docs/species-photo-sources.csv`
- [ ] Site row in the same position, and the pet-safe figure updated if needed
- [ ] Counts in `CLAUDE.md`, `README.md` and `brand.html`
- [ ] `CACHE` bumped in `sw.js`
- [ ] `node .claude/check-species.js` passes
- [ ] Served and looked at: the species page in Discover, the plant added to a
      room, its line on Today, and a diagnosis from its own page
