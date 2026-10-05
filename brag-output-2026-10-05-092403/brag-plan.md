# Sprout: three voiced Reels

**What it is:** a houseplant app that works out each plant's care from the species, the pot, the
room's light and the season, instead of asking how often to remind you.
**For:** anyone with more than a couple of houseplants who has lost one to a fixed schedule.
**Ask:** three Instagram Reels, each on a different part of the app, all in one AI voice
(feminine, soft, upbeat), every one ending on *Coming to Google Play and the App Store*, with
sproutevergreen.com in there.

## The voice
Kokoro (an open TTS model, run locally), voice `af_heart`, speed 1.06. Every line in all three
reels goes through the same voice, speed and processing chain (high-pass, a little presence,
gentle compression, a very small room), so the three sound like one person.

**Sprout is the speaker.** The brand voice in `CLAUDE.md` is Sprout in the first person, so the
voiceover is Sprout talking ("I'm Sprout, and I work it out"), not a narrator describing an app.
The on-screen captions are the spoken words, so the reels work with the sound off.

## Shared shape (about 20s each, 1080×1920, 30fps)
| | Time | What |
| --- | --- | --- |
| Hook | 0–3.4s | Spoken and set big in Hatton 200; each line lands as it is said. No phone. |
| Highlights | ~3.4–14s | The real app in use under three spoken lines, one caption per line above the phone. Taps land on the line that describes them. |
| Sign-off | ~14–20s | Phone drops away, the lockup comes in. *Find me at sproutevergreen.com* (URL on screen as it is said), then *Coming to Google Play and the App Store.* |

## 1 · The schedule
- **Hook:** *Most plant apps ask how often you want reminding.*
- *I'm Sprout, and I work it out.* (Today, scroll to Coming up, tap Monny)
- *From the species, the pot, the room and the season.* (her page, scroll to Watering)
- *And I always show you why.* (ring on **Why 10 and not 8?**: 24cm pot ↑, terracotta ↓)

## 2 · Diagnosis
- **Hook:** *Yellow leaves can mean ten different things.* (the symptom maps to 10 causes in `problems.js`)
- *Tell me the plant, and what you're seeing.* (Monny → Leaves turning yellow)
- *Then what else is true.* (two clues ticked, Diagnose)
- *And I rank the likely cause, for that species.* (ring on **Common in Monstera** under Root rot)

## 3 · The planner
- **Hook:** *Your plant isn't dying. It's just in the wrong room.*
- *Trace your home once, and mark the windows.* (the app's own tour: tracing, size, windows)
- *Point me north.* (the north step)
- *And I'll show you exactly where each plant should stand.* (a plant dropped in, the floor shades)

## Sound
The Reels' piece (D major, 84 BPM, soft pad, a plucked pulse, taps tuned to the chord), mixed
9dB down and side-chain ducked under the voice so she always sits on top. −16 LUFS.

## Honesty notes
Demo data only: the Reels' seeded six-plant greenhouse under a fixed clock (3 Oct 2026, 08:12 in
Sydney). Every number on screen is the app computing from that data. Store availability is worded
the way the marketing site words it.

## Rebuilding
Needs Node, Playwright with Chromium, ffmpeg, and Python with `kokoro-onnx` and `soundfile`.
The Kokoro model files (`kokoro-v1.0.onnx`, `voices-v1.0.bin`, from the kokoro-onnx GitHub
releases) are not committed; `work/vo.py` reads them from the `M` path at its top. From `work/`,
with `node .claude/serve.js` running at the repo root:

```bash
python3 vo.py                 # voice lines → vo/, lengths → vo-lines.json
python3 build-config.py       # script + timeline + lengths → reels.json (checks no line overlaps the next)
node capture.js               # the real app, every frame → phone-*/, events-*.json
node audio.js schedule        # music bed → music-schedule.wav (per reel)
./mix.sh schedule             # voice + ducked music → mix-schedule.wav
node render.js schedule       # every frame → frames-schedule/
./mux.sh 1 schedule           # → ../1-schedule.mp4 + .jpg
```

Words live in `script.json`; where each line is said lives in `timeline.json`.
