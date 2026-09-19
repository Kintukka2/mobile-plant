# Sprout — working notes for Claude

A houseplant care tracker. Care schedules are computed from species data and
the plant's actual situation (pot, room light, season), not from a fixed
reminder interval. Read `README.md` first for the product; this file is about
how to work in the codebase without breaking it.

## The one constraint everything follows from

**No build step, no dependencies, no bundler.** There is no `package.json`,
nothing to install, and nothing to compile. The source that ships is the
source you read.

This is deliberate. Do not introduce npm packages, ES modules, JSX,
TypeScript, or a framework without asking first — every one of them breaks the
property that makes this project what it is.

- **Classic `<script>` tags.** Not `type="module"`.
- **Globals are the module system.** Each file assigns exactly one namespace:
  `UI`, `Store`, `Schedule`, `Weather`, `Photos`, `PLANT_DATA`, `PROBLEM_DATA`,
  `LOOKUPS`, `App`, and one `View*` per screen.
- **Load order in `index.html` is the dependency graph.** Data and utilities
  first, views next, router last.

## Running it

The app must be served over `http://` — service workers, the manifest and the
weather fetch are all blocked on `file://`.

```bash
node .claude/serve.js          # → http://localhost:8787/
```

Zero dependencies, Node built-ins only. `PORT` and `HOST` override the
defaults. `.claude/serve.ps1` is the same server in PowerShell, for a Windows
machine with no Node installed.

### Verifying a change actually works

There is no test suite. Verification is: serve it, load it, look at it.

```bash
node .claude/serve.js &
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --no-sandbox \
  --disable-gpu --window-size=430,932 --virtual-time-budget=6000 \
  --screenshot=/tmp/shot.png http://127.0.0.1:8787/
```

`--dump-dom` instead of `--screenshot` when you need to assert on structure.
The app is mobile-first; 430x932 is a sensible phone viewport. Google Fonts
may not be reachable from a container, in which case type falls back — that is
the network, not a regression.

The data files are plain enough to load and check directly in Node:

```bash
node -e "const vm=require('vm'),fs=require('fs');const c={console,window:{}};
vm.createContext(c);['js/data/lookups.js','js/data/plants.js','js/data/problems.js']
.forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),c));
console.log(c.window.PLANT_DATA.length)"
```

## Two invariants that are easy to break

**1. Adding a JS file means editing three places.** A new `js/**.js` needs a
`<script>` tag in `index.html` *in the right dependency position*, and an
entry in the `ASSETS` array in `sw.js`. Miss the second and the app works
online and breaks offline — which no amount of local testing will show you.

**2. Changing any cached asset means bumping the cache name.** `sw.js` opens
`CACHE = 'sprout-vN-viridium'`. Returning visitors keep the old cached copy
until that string changes. If a change does not appear after a hard refresh,
this is why.

## Data model

`js/data/plants.js` — 48 species. Each carries `water.warm` / `water.cool`
(days), `fert.everyDays`, a `light.ideal` from `LOOKUPS.LIGHT`, and `tox`
rated separately for `cats`, `dogs` and `humans`. `normalise()` fills
defaults, so a record only states what is distinctive about it.

`js/data/problems.js` — the diagnosis knowledge base: 26 symptoms, 42 clues,
40 causes. Scoring is `symptom.causes[id]` as a base, `+6` per supporting clue
(`SUPPORTS`), `-7` per contradicting one (`CONTRA`), `+4` if the species is
prone to it.

A plant's `problems` array deliberately **mixes symptom ids and cause ids** —
`describe()` resolves either. Only the cause ids earn the prone bonus in
`diagnose()`; the symptom ids drive ordering in `symptomsForPlant()`.

When adding a cause, give it an entry in `CAUSES`, list it under at least one
symptom's `causes`, and add a `SUPPORTS` row — an unreferenced cause is
unreachable, and one with no supporting clues can never outrank its peers.

## Conventions

- **Comments explain *why*, not *what*.** The existing comments record the
  reasoning behind a decision, and often the bug that motivated it. Match that
  register — do not strip them, and do not replace them with restatements of
  the code.
- **Escape everything interpolated into HTML.** `UI.esc()` for text nodes,
  `UI.attr()` for attribute values. Views build HTML strings, so this is the
  only thing standing between a plant's name and an injection.
- **`App.refresh()` after a data change, `App.render()` only for navigation.**
  `refresh()` preserves scroll position; `render()` resets it to the top.
  Using `render()` where `refresh()` belongs throws the reader back to the top
  of the page on every checkbox tick.
- **British English** in user-facing copy, matching the existing text.

## Storage

All local; no account, no server, no telemetry.

| Key | Contents |
| --- | --- |
| `sprout.state.v1` | Plants, rooms, diary entries, preferences |
| `sprout.theme` | Selected theme |
| `sprout.photo.*` | One resized JPEG data URL per photo |

localStorage is ~5MB, which is the entire budget. Photos are downscaled to a
1000px long edge at 72% quality (`js/photos.js`) to fit inside it. Every
`localStorage` access is wrapped in `try/catch` because private-mode Safari
throws on access rather than returning null.

The only outbound requests are the Open-Meteo forecast (no API key) and the
initial Google Fonts load.
