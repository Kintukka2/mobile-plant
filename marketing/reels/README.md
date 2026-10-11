# Instagram Reels

The tooling for Sprout's 20-second Reels: 1080×1920 (9:16), 30fps, H.264 +
AAC at -16 LUFS, one feature each.

| Reel | Feature | Hook |
| --- | --- | --- |
| `planner` | Home planner | "Your plant isn't dying. It's in the wrong room." |
| `schedule` | Watering schedule | "Most plant apps ask how often you want reminding." |
| `diagnose` | Diagnosis | "Yellow leaves can mean ten different things." |
| `pets` | Pet safety | "Is that plant safe for the cat?" |

**There are no finished Reels in here right now.** The first renders, and
the voiced set and launch film made after them, were removed on 12 October
2026 because the app had moved past them: letter tiles where the species
photographs now are, the Greenhouse before it had a scene of its own, the
planner before its rework, and an end card offering the retired web app (or
promising a Play release that has since happened). A Reel that shows an
app the reader will not find is worse than none. They are in git history at
`70a9a28` if the cut is ever wanted for reference.

Before the next render, the end card copy in `build/reels.json` and
`build/stage.html` needs to point at sproutevergreen.com and say Sprout is
on Google Play.

Nothing here is part of the app or the site, and nothing reads from it. It is
not in `sw.js` ASSETS and needs no `CACHE` bump. `build/seed.js` is also the
greenhouse `marketing/site-shots/` and `marketing/store-shots/` photograph,
so it stays even while there is nothing rendered.

## Rebuilding

The phone footage is the real app, not a mock-up. It is served locally,
seeded with the six-plant greenhouse in `build/seed.js`, and driven by
Playwright under a fake clock, so every app frame is deterministic. A change
to the app shows up in the next rebuild. `build/plan.md` is the storyboard.

You need Node, Playwright with Chromium, and ffmpeg. Run everything from
`build/`, with the app server up:

```bash
node .claude/serve.js &                  # from the repo root → :8787
cd marketing/reels/build
node capture.js planner                  # → phone-planner/, events-planner.json
node render.js planner 2.5,9.5,15.5      # check stills first → stills/
node render.js planner                   # every frame → frames-planner/
node audio.js planner                    # → audio-planner.wav
./mux.sh 1 planner                       # → ../01-planner.mp4 + .jpg
```

`PLAYWRIGHT=/path/to/playwright` and `FFMPEG=/path/to/ffmpeg` override
module and binary resolution. Copy and timing live in `build/reels.json`.
The stage (`build/stage.html`) draws every frame as a pure function of time.
It takes its type from `css/fonts/`, so a typeface change in the app reaches
the reels too.

The capture fixes the date at 3 October 2026 and the time zone at
`Australia/Sydney`. Without that, the season, the greeting and the due
dates change with the day you run it.
