# Instagram Reels

Four 20-second Reels, one feature each, for Sprout's Instagram. 1080×1920
(9:16), 30fps, H.264 + AAC at -16 LUFS. Ready to upload as they are.

| File | Feature | Hook |
| --- | --- | --- |
| `01-planner.mp4` | Home planner | "Your plant isn't dying. It's in the wrong room." |
| `02-schedule.mp4` | Watering schedule | "Most plant apps ask how often you want reminding." |
| `03-diagnose.mp4` | Diagnosis | "Yellow leaves can mean ten different things." |
| `04-pets.mp4` | Pet safety | "Is that plant safe for the cat?" |

Each `.jpg` is that reel's cover. It is also baked in as frame 0, so
Instagram picks it up without being asked. `share-copy.txt` has a caption for
each.

Nothing here is part of the app or the site, and nothing reads from it. It is
not in `sw.js` ASSETS and needs no `CACHE` bump.

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
