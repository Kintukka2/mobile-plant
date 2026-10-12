# Instagram Reels

Five voiced Reels, one feature each, for Sprout's Instagram. About 21–23s,
1080×1920 (9:16), 30fps, H.264 + AAC at -16 LUFS. Ready to upload as they
are.

| File | Feature | Hook |
| --- | --- | --- |
| `01-planner.mp4` | Home planner | "Your plant isn't dying. It's just in the wrong room." |
| `02-schedule.mp4` | Watering schedule | "Most plant apps ask how often you want reminding." |
| `03-diagnose.mp4` | Diagnosis | "Yellow leaves can mean ten different things." |
| `04-pets.mp4` | Pet safety | "Is that plant safe for the cat?" |
| `05-greenhouse.mp4` | The greenhouse | "Think of it as a smart home, for your plants." |

**Sprout speaks in every one**, in the voice pinned in `marketing/voice/`
(the same vector, speed, model and processing as anything else she says),
in the first person as the voice rules in `CLAUDE.md` have it. The
captions are her words, so a Reel still reads with the sound off. The
music is ducked under her.

Each `.jpg` is that reel's cover, also baked in as frame 0, so Instagram
picks it up without being asked. `share-copy.txt` has a caption for each.

`promo-landscape.mp4` is the Google Play listing's promo video, and it
is not the Reels: someone who has watched them sees nothing twice. It is
its own film, made in `promo/`, 1920×1080 for Play's 16:9 slot and about
48s, inside Google's 30 seconds to 2 minutes. One home and one plant: two
Monsteras on different schedules, and why; Sprout noticing one is in the
wrong light; moving it on the floor plan, and its care moving with it; the
forecast's offer to water sooner; pets and diagnosis; free, no account.
Play takes it only as a YouTube link, so it is uploaded to YouTube
(unlisted is fine, ads off, not made for kids) and the link goes in the
listing's Video field. `promo-thumbnail.jpg` is its 1280×720 custom
thumbnail, and `promo/share-copy.txt` its YouTube title and description.
Its reveal line is spelt "livs" in `promo/script.json`'s `say` on purpose:
the voice's phonemizer reads "actually lives." with a long i, as in "long
lives". The caption keeps "lives".

Rendered on 12 October 2026 from the app as it is on Play. Every Reel ends
on sproutevergreen.com, free on Google Play and coming soon to iPhone; the
promo ends on Google Play alone, since that is where it plays. No line
quotes a species count, since the list grows. Earlier cuts showed
an older app and are in git history at `70a9a28`.

Nothing here is part of the app or the site, and nothing reads from it. It is
not in `sw.js` ASSETS and needs no `CACHE` bump. `build/seed.js` is also the
greenhouse `marketing/site-shots/` and `marketing/store-shots/` photograph.

## Rebuilding

The phone footage is the real app, not a mock-up. It is served locally,
seeded with the six-plant greenhouse in `build/seed.js`, and driven by
Playwright under a fake clock, so every app frame is deterministic. A change
to the app shows up in the next rebuild. `build/plan.md` is the storyboard.

You need Node, Playwright with Chromium, ffmpeg, and Python with
`kokoro-onnx` and `soundfile`. Run everything from `build/`, with the app
server up:

```bash
node .claude/serve.js &        # from the repo root → :8787
cd marketing/reels/build
python3 vo.py                  # her lines → vo/, spoken lengths → vo-lines.json
python3 build-config.py        # script + timeline + lengths → reels.json; fails if a line overruns the next
node capture.js                # the real app, every frame → phone-*/, events-*.json (or name reels)
node render.js pets 3,9,15     # check stills first → stills/
node audio.js pets             # music → music-pets.wav
./mix.sh pets                  # her voice + ducked music → mix-pets.wav
node render.js pets            # every frame → frames-pets/
./mux.sh 4 pets                # → ../04-pets.mp4 + .jpg

# the Play promo, its own film
cd ../promo
python3 vo.py                  # her lines → vo/, spoken lengths → vo.json
node capture.js                # the real app → phone-*/, events-*.json (or name scenes)
node render.js 3.2,12,21       # check stills first → stills/
node audio.js                  # one bed for the whole film → music.wav
./mix.sh                       # her voice + ducked music → mix.wav
node render.js                 # every frame → frames/
./mux.sh                       # → ../promo-landscape.mp4 + ../promo-thumbnail.jpg
```

What she says and what is captioned are separate strings in
`build/script.json`; where each line falls is `build/timeline.json`, and
the taps in `capture.js` are timed to land while the line that describes
them is spoken. `reels.json` is generated: edit the other two. The first
`vo.py` run downloads the voice model (325MB) and checks its hash.

The capture fixes the date at 3 October 2026 and the time zone at
`Australia/Sydney`. Without that, the season, the greeting and the due
dates change with the day you run it.
