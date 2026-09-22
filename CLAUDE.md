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
  `UI`, `Store`, `Schedule`, `Plan`, `Weather`, `Photos`, `Onboard`, `Tour`,
  `Notify`,
  `PLANT_DATA`, `PROBLEM_DATA`, `LOOKUPS`, `App`, and one `View*` per screen.
- **Load order in `index.html` is the dependency graph.** Data and utilities
  first, views next, router last.

`native/` is the one exception, and it is not an exception to the rule
above. It is the store wrapper: a separate Capacitor project that copies the
shipped files into its own `www` and bundles them. It has a `package.json`
of its own and the app has none. Nothing in the app reads from it, no file
above it imports anything, and deleting the directory would leave the web
app exactly as it is. It exists so reminders can be scheduled by the
operating system instead of by a server. See `native/README.md`.

## The two things in here that are not the app

`native/` is the store wrapper, described above. `site/` is the other one:
the marketing site at **sproutevergreen.com**, deployed as its own Cloudflare
Pages project with `site` as the root directory, while the app deploys from
the repository root to **sproutevergreen.app**. Both have no build command.

Two consequences worth knowing before editing anything in there:

- **`site/` cannot reach `../`.** A Pages project publishes only what is
  inside its root, which is why `site/fonts/` is a byte copy of `css/fonts/`
  and `site/site.css` is a second stylesheet rather than a link to the apps.
  Replace a typeface in one and replace it in the other in the same commit;
  `diff -r css/fonts site/fonts` is the check.
- **The privacy policy lives at `site/privacy.html`**, not at the root any
  more, and Play has been given `sproutevergreen.com/privacy`. It, this
  file, `README.md` and `native/store-privacy.md` all state the same facts
  about what leaves the device. Change one and change all four.

`_headers` and `_redirects` at the root belong to the app deploy. The one
that matters is the no-cache rule on `sw.js`: bumping `CACHE` does nothing
if the CDN is still handing out the old `sw.js` that names the old cache.

## Running it

The app must be served over `http://` — service workers, the manifest and the
weather fetch are all blocked on `file://`.

```bash
node .claude/serve.js          # → http://localhost:8787/
```

Zero dependencies, Node built-ins only. `PORT` and `HOST` override the
defaults.

### Verifying a change actually works

There is no test suite. Verification is: serve it, load it, look at it.

```bash
node .claude/serve.js &
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --no-sandbox \
  --disable-gpu --window-size=430,932 --virtual-time-budget=6000 \
  --screenshot=/tmp/shot.png http://127.0.0.1:8787/
```

`--dump-dom` instead of `--screenshot` when you need to assert on structure.
The app is mobile-first; 430x932 is a sensible phone viewport. Type no longer
depends on the network at all — every face is served from `css/fonts/` — so a
screenshot in a fallback face is now a real regression rather than the
container.

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

`js/plan.js` — the floor plan's geometry and light, no DOM. A room drawn on
the plan carries `room.shape = { pts, win, outdoor }` in grid cells, where
`win[i]` is the state of edge `i`: `0` wall, `1` window, `2` opening to the
next room. A plant placed on the plan carries `plant.pos = { x, y }`.
`state.plan` holds north (degrees clockwise from the top of the plan, and
only trusted once `northConfirmed`), the metres-per-cell scale, and the
tracing backdrop while it is needed.

**A drawn room's `light` and `aspect` are derived, never typed.**
`Plan.sync()` writes them back onto the room before every render, so
`Schedule`, the greenhouse and the room page read them like any other
room's and never need to know the plan exists. The room form hides those
two fields for a drawn room and points at the plan instead. Rooms without
a shape are never touched: their light is whatever the reader said.

The plan obeys the same go-quiet rule as the room form: while north is
unconfirmed or the hemisphere is a guess, every light function returns
null and the plan renders unshaded. Openings borrow light from the room
across them, one step dimmer, from that room's own windows only — light
crosses one doorway, never a chain of them.

`js/data/lookups.js` — the label tables. `LOOKUPS.TOX` carries the pill
`variant` as well as the label, because two views render the toxicity ladder
and the same rating has to wear the same chip on both. Read it; do not write
the ladder out again at a call site.

`LOOKUPS.LIGHT` is a five-rung ladder keyed by rank: `none` (0) through
`direct` (4). `none` means no window at all, not "a bit dark" — no species
lists it as an ideal or a tolerance, so anything ranking or matching rooms
has to handle it explicitly rather than letting it fall through.

**Hemisphere decides which way is bright, and which season it is.**
`Store.hemisphere()` resolves in three steps: a latitude from a saved
location, then an answer the reader gave in Profile, then
`LOOKUPS.hemisphereFromTimeZone()` reading the device's IANA zone. Only a
device reporting no zone at all falls back to `'north'`. Getting this wrong
inverts every aspect label and every season without ever looking broken, so
`Store.hemisphereIsGuess()` exists — and where a surface would otherwise
*assert* something hemisphere-dependent, it must go quiet rather than caveat.
The room form is the worked example: while the hemisphere is only a guess,
the window aspects render as bare compass points with no light reading, and
selecting one fills in nothing. Hiding the label while still auto-filling the
level from the same untrusted table would be the worse of the two, because
the claim would still be made, just somewhere the reader cannot check it.

Time-zone names canonicalise differently across engines —
`America/Argentina/Cordoba` and `America/Cordoba` are the same place — which
is why the southern list carries both spellings.

## The brand guide

`brand.html` is the design system written down: the mark and its stroke rule,
the wordmark, both palettes with every token and what each hue is allowed to
mean, the type scale, photo ratios, the voice, and a record of the twelve
decisions that produced them with the reasoning for each.

It is **not part of the app**. It is deliberately absent from `sw.js`
`ASSETS` and from `manifest.webmanifest` — it is a document for whoever is
working on Sprout, served alongside the app rather than shipped in it, so it
never needs a `CACHE` bump of its own.

It links `css/styles.css` rather than transcribing it, and reads every swatch
value out of the live cascade with `getComputedStyle`. That is the point: a
guide that restates the tokens starts lying the first time the app moves. If a
swatch on that page looks wrong, the token is wrong.

```bash
node .claude/serve.js     # → http://localhost:8787/brand.html
```

The two sections below are the same rules in prose, kept here because this is
the file an agent reads first.

## Voice

Sprout speaks **as itself, in the first person**, as a knowledgeable friend
rather than a system. It uses the reader's name where it has one.

It did not always. The app previously used three grammatical persons at once
— "Shall I shorten…" in the nudges, "What should we call you?" in the welcome
sheet, "What should Sprout call you?" in the profile — the last two being the
same question on two screens. Committing to "I" is what resolved that.

**The persona is zoned.** It speaks on conversational surfaces and goes quiet
on reference ones:

| Zone | Voice | Where |
| --- | --- | --- |
| Conversation | First person, warm | Greetings, nudges, empty states, form hints, confirmations, toasts |
| Reference | Plain, authoritative, no persona | Species care data, diagnosis explanations and treatment steps, toxicity notes |

A knowledgeable friend reads you the label straight when it matters. A
cheerful voice explaining which crystals burn a cat's mouth is worse than no
persona at all. When in doubt about a string, ask whether it is *talking to*
the reader or *telling them a fact* — the second one takes no personality.

**Rules that keep it from grating.** A greeting is read every morning, and
warmth that lands in week one can wear out by week three:

- No exclamation marks in anything that repeats
- One contraction per line, not none and not three
- Never open two consecutive strings the same way
- Never tell the reader off. The app is accountable, not them — "I'll only
  ever be as right as what you tell me", not "guessing will give you a
  confident wrong answer"
- Say "Sprout" only when introducing itself. Everywhere else it is "I"

Apostrophes inside single-quoted JS strings need escaping (\'). That is a
syntax constraint, never a reason to write "I will" where "I'll" belongs —
the stiffness is visible to the reader and the escape is not.

## Type

Four faces. `--display` is **PP Hatton, self-hosted in two weights**, and the
size picks the weight: **200 at 28px and above, 500 below**. The face spans
14px to 86px, so the pair stands in for an optical size axis it does not
have. Any rule naming `--display` must also name a weight — with only two
installed, anything else is resolved by guesswork.

`--serif` is Cormorant Garamond (body, care sheets, figures), `--sans` is
Jost (UI, labels), `--script` is Sacramento and appears on the splash only.

The font files live in `css/fonts/` and are listed in `sw.js` ASSETS. Adding
or replacing one means bumping `CACHE`, exactly like any other cached asset.

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

No account, no server of ours, no telemetry. Everything about the reader's
plants stays on the device; a set location is the one thing that leaves, and
it is rounded to roughly a kilometre first. Claims about this are load-bearing
— see the note at the end of this section.

| Key | Contents |
| --- | --- |
| `sprout.state.v1` | Plants, rooms, diary entries, preferences |
| `sprout.theme` | Selected theme |
| `sprout.photo.*` | One resized JPEG data URL per photo |

One thing is **not** in localStorage, and cannot be. `js/notify.js` writes a
reminder digest to IndexedDB (`sprout` → `kv` → `digest.v1`) on every save:
one finished sentence per day for the next month, plus the plant ids behind
it.

**Reminders are scheduled by the operating system, never by a server.** On
the native shell `Notify` hands that digest to the local-notifications
plugin, which fires them whether the app is running or not. There is no push
service, no subscription and no account, so the promise at the top of this
section survives whole. A browser cannot schedule anything for later, so the
web version says so in Profile and offers only to show one on request —
never a switch it has no way of honouring.

The digest is written on both runtimes and the `push` handler in `sw.js`
still reads it, which is what a web-push route would need if one is ever
wanted. That is why `sw.js` knows nothing about plants: it looks up today
and shows the sentence it finds. A Watered tap with no page open is parked
at `pending.v1` and drained on the next load, because only the page can
reach the store.

localStorage is ~5MB, which is the entire budget. Photos are downscaled to a
1000px long edge at 72% quality (`js/photos.js`) to fit inside it. Every
`localStorage` access is wrapped in `try/catch` because private-mode Safari
throws on access rather than returning null.

The Open-Meteo forecast (no API key) is the only outbound request the app
makes. The typefaces used to be a second one and are not any more.

**Do not write that the location stays on the device.** It did not, and the
claim shipped for a while before anyone checked it against `js/weather.js`,
which puts the coordinates in the query string of both the geocoding and the
forecast call. `locateMe()` now rounds them to two places before they are
stored or sent, so the honest sentence is that an approximate location goes
to Open-Meteo and nothing else does. Both stores are told the same thing, in
`native/store-privacy.md`; a privacy claim that drifts from the code is worse
than no claim, and on Play an under-declared form is a removal rather than a
warning.
