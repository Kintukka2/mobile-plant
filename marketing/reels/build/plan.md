# Sprout — four Reels, one feature each

**What it is:** a houseplant app that works out each plant's care from the species,
the pot, the room's light and the season, instead of asking how often to remind you.
**For:** people with more than a couple of houseplants who've killed one by schedule.
**Sets it apart:** it reads the light in your home from a traced plan, and explains its
own numbers ("Why 10 and not 8?").
**Format:** 1080×1920, 30fps, ~20s each. Tone: `polished` — Sprout's brand is restrained:
near-black green field, PP Hatton 200, emerald #3FBE8B, no exclamation marks.
**Source:** the real app, served locally, seeded with a believable six-plant greenhouse,
driven by Playwright with a fake clock so every app frame is deterministic. The planner
reel runs the app's own `js/tour.js` animation, not a re-creation.

Reels safe area: nothing to read above y≈220 or below y≈1500; nothing at the right edge.

## Shared shape (each ~20s)
| | time | what |
|---|---|---|
| Hook | 0–3s | Big Hatton line on the field. No phone. |
| Reveal | ~3–3.7s | Phone rises; the real screen is already live. |
| Highlights | ~3.7–16s | The app in use: taps, pushes, scrolls. One short caption per beat, above the phone. |
| Outro | ~16–20s | Phone drops away; payoff line, mark + SPROUT + *evergreen*, sproutevergreen.app. |

## 01 · Planner — "It's in the wrong room"
- Hook: *Your plant isn't dying.* / *It's in the wrong room.*
- The real tour, sped up through tracing, then windows and north, then at full speed for
  the beat where a plant is dropped in and the floor shades by how well it suits it.
- Captions: *Trace your home once.* → *Mark the windows. Point north.* → *Then it shows
  where each plant should stand.*
- Outro: *It reads the light in every room.*

## 02 · Schedule — "Why 10 and not 8?"
- Hook: *Most plant apps ask how often you want reminding.*
- Today (Good morning, 2 due) → tap Monny → plant page → scroll to the watering card.
- Captions: *This one works it out.* → *From the species, the pot, the room and the season.*
  → *And it tells you why.* (ring on WHY 10 AND NOT 8? — 24cm pot ↑, terracotta ↓)
- Outro: *No reminder interval to set.*

## 03 · Diagnosis — "Ten different things"
- Hook: *Yellow leaves can mean ten different things.* (real: that symptom maps to 10 causes)
- Diagnose → Monny → Leaves turning yellow → two clues → Diagnose → ranked causes.
- Captions: *Pick the plant. Pick what you see.* → *Say what else is true.* →
  *It ranks the cause for that species.* (Overwatering · most likely; Root rot · common in Monstera)
- Outro: *A clinic, not a search box.*

## 04 · Pets — "Safe for the cat?"
- Hook: *Is that plant safe for the cat?*
- Discover → Pet safe → back to everything, search "monstera" → species → Toxicity.
- Captions: *23 of 48 are safe for cats and dogs.* → *Rated separately for cats, dogs and humans.*
- Outro: *Know before you bring it home.*

## Sound
One quiet piece per reel in D major at 84 BPM: a soft pad, a sparse plucked motif, UI
taps tuned to the chord, a breath of filtered noise under each push. Same piece, varied
voicing per reel. Mixed for phone speakers, normalised to −16 LUFS.

## Honesty notes
- Demo data only: a seeded greenhouse, a fake 08:12 clock in Sydney. Nothing invented
  is presented as a claim; every number on screen is the app computing from that data.
- The seed avoids the Today greeting's count bug (it calls fertilise tasks "plants ready
  for a drink") by having nothing to fertilise today — reported to the user separately.
