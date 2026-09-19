# Sprout

A houseplant care tracker that schedules watering and feeding from real,
species-specific data instead of a one-size-fits-all reminder.

Your collection is **My Greenhouse**, organised into **Rooms** tagged by light
level and window aspect — the mental model is Google Home, but you add plants
instead of devices. Because Sprout knows a Calathea is in a low-light
south-facing room in a plastic pot, it can water it on a different cycle than
the Snake Plant on the windowsill.

It is a progressive web app with **no build step and no dependencies**. Clone
it, open it, and it runs.

---

## Quick start

There is no install step, but the app does need to be served over `http://`
rather than opened as a `file://` path — service workers, the manifest and the
weather fetch are all blocked on `file://`.

**Anywhere with Node:**

```bash
node .claude/serve.js
```

Then open <http://localhost:8787/>. `PORT` and `HOST` override the defaults;
the listener is loopback-only unless you set `HOST` yourself.

**Windows, no runtime installed:**

```powershell
powershell -ExecutionPolicy Bypass -File .claude\serve.ps1
```

The two are the same server on the same port. The PowerShell one came first,
because the machine this was written on had no Node and no Python and needed
something that required no elevation or install; the Node one exists because
that assumption does not survive the trip to another machine — a cloud
container has Node and no PowerShell. Neither has any dependencies.

Anything else that serves static files works just as well:

```bash
python3 -m http.server 8787
npx serve .
```

First load pulls four fonts from Google Fonts; after that the service worker
serves everything, including the fonts, from cache and the app works fully
offline.

---

## Why there is no build step

This is a deliberate constraint, not an unfinished setup. There is no
`package.json` to find and no `npm install` to run.

- **Classic `<script>` tags, not ES modules.** Modules are CORS-blocked on
  `file://`, and avoiding them keeps the app openable in the widest range of
  situations.
- **Globals as the module system.** Each file assigns one namespace:
  `window.UI`, `Store`, `Schedule`, `Weather`, `Photos`, `PLANT_DATA`,
  `PROBLEM_DATA`, `LOOKUPS`, `App`, and one `View*` per screen. Load order in
  `index.html` is the dependency graph — data and utilities first, views next,
  router last.
- **No transpilation, no JSX, no TypeScript.** The source that ships is the
  source you read.
- **No framework.** Views are functions that return DOM; the router re-renders
  the current one after any data change.

The practical payoff: nothing to audit, nothing to update, no toolchain that
can rot, and the whole app is legible top to bottom.

---

## The four feature areas

### Plants, rooms and scheduling

48 curated species. Care figures assume a ~15cm pot in the species' ideal
light, and the scheduling engine adjusts from there for **pot size, pot
material, drainage, room light and season** — separate warm-season and
dormancy watering intervals, plus feeding cycles that pause in winter.

Every species also carries ASPCA-based toxicity ratings
(`safe` / `mild` / `toxic` / `very-toxic`), scored separately for **cats,
dogs and humans** — the three often differ, and a plant that is merely an
irritant to you can be a genuine problem for the cat. A household can see the
risk before buying rather than after.

### The diary

Per-plant growth logs, notes and photos. Phone cameras produce 3–8MB JPEGs and
localStorage offers roughly 5MB total, so every photo is downscaled to a
1000px long edge and re-encoded at 72% quality — about 90–150KB each, which
keeps a diary of a few dozen photos inside budget.

### Guided diagnosis

A weighted symptom checker rather than a static troubleshooting list:

> pick the plant → **what do you notice** (26 symptoms) → **what else is true**
> (42 clues) → ranked **causes** (40) with treatment steps

Each cause starts at a base weight for the chosen symptom, gains points for
confirmed clues, and loses points for clues that argue against it. Causes the
species is specifically prone to get a bonus — brown leaf edges on a Calathea
and on a Snake Plant are genuinely different bets, and the ranking reflects
that.

### Weather-synced care

Uses [Open-Meteo](https://open-meteo.com/) (geocoding + forecast, **no API
key**) to fetch a local forecast, then surfaces nudges from it — a dry spell
in the heat, or a cool wet run where you should ease off watering.

---

## Screens

Five tabs, eight routes. Navigation is hash-based, so there is no server
routing to configure.

| Route | Screen |
| --- | --- |
| `#/today` | Today — what needs you, what's coming up, local weather |
| `#/greenhouse` | My Greenhouse — rooms and the plants in them |
| `#/room/:id` | A single room and its light/aspect profile |
| `#/plant/:id` | Plant profile — care, diary, photos, history |
| `#/discover` | Browse and search the species library |
| `#/species/:id` | Full care sheet for a species |
| `#/diagnose` | Diagnose a sick plant |
| `#/profile` | You — location, preferences, pets, themes |

An unrecognised route reports "nothing here" rather than silently redirecting
to Today, so a stale or mistyped link explains itself instead of looking like
the app lost your plant.

---

## Design

Two themes, toggled from the top bar and remembered across sessions:

- **Viridium** — the default. Near-black green (`#0A1410`), nightfall.
- **Conservatory** — warm ivory (`#F7F3EC`), daylight.

The type system is four faces, each with a role and a size range it actually
works in:

| Variable | Face | Used for |
| --- | --- | --- |
| `--display` | Italiana | Headings, **20px and up only** |
| `--serif` | Cormorant Garamond | Body copy, care sheets |
| `--sans` | Jost | UI, buttons, all small tracked caps |
| `--script` | Sacramento | The "evergreen" tagline |

The 20px floor on the display face is a measured limit, not a preference.
Italiana's thin strokes are about a ninth of its cap height, so below 20px
they ask for roughly one pixel of ink; antialiasing then spreads that across
two rows at partial coverage and leaves a pale grey line beside a near-black
stem. Raising the device pixel ratio does not help, because it scales the
stroke and the pixel grid together. Small tracked caps are therefore the
sans's job throughout.

---

## Storage

Everything is local. There is no account, no server and no telemetry.

| Key | Contents |
| --- | --- |
| `sprout.state.v1` | Plants, rooms, diary entries, preferences |
| `sprout.theme` | Selected theme |
| `sprout.photo.*` | One resized JPEG data URL per photo |

The only outbound requests the app ever makes are the Open-Meteo forecast and
the initial Google Fonts load.

---

## Project layout

```
index.html               load order = dependency graph
manifest.webmanifest     PWA manifest; icons are inline SVG data URIs
sw.js                    service worker; app shell + separate font cache
css/styles.css           the whole design system, one file
js/
  data/lookups.js        light levels, pot materials, enumerations
  data/plants.js         48 curated species
  data/problems.js       symptoms, clues, causes, scoring weights
  ui.js                  DOM helpers, icons, toasts, sheets
  store.js               localStorage persistence
  photos.js              capture, downscale, re-encode
  schedule.js            watering/feeding engine
  weather.js             Open-Meteo client and forecast-derived nudges
  views/*.js             one per screen; species shares discover.js
  app.js                 router, theme, nav, init
.claude/serve.js         dependency-free static server (Node, any OS)
.claude/serve.ps1        the same server for Windows without a runtime
CLAUDE.md                architecture notes and invariants for contributors
.gitignore               local-only Claude settings, OS cruft
.gitattributes           normalises line endings to LF in commits
```

---

## Requirements

A current version of Chrome, Edge, Firefox or Safari. The app is built
mobile-first and is most at home on a phone-width viewport, but it is
responsive.

Diagnosis, the species library and scheduling all work offline. Weather needs
a connection and location permission; without either, the app simply omits the
weather-dependent parts rather than failing.

---

## Roadmap

Propagation tracking and seed-starting are the natural next features. The
groundwork is already unevenly laid: every one of the 48 species carries a
populated `prop` field describing how it is propagated, so propagation is
mostly a matter of surfacing data that exists. `seed` is set on only two
species and would need filling in first.

---

## License

No license has been chosen yet, so default copyright applies: the source is
public to read, but not yet licensed for reuse.
