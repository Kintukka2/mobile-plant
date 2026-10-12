# The Play promo: plan and storyboard

Made with `/brag` (brag-slim), for the one YouTube video the Google Play
listing takes. Written into the repo rather than `brag-output/`, as the
rest of `marketing/` is.

**What it is:** a houseplant care app that works out each plant's care
from where it lives: its pot, its room's light, the season and the
forecast.
**Who for:** people with houseplants who have killed one on a fixed
reminder.
**What sets it apart:** two plants of the same species are not on the same
schedule, and the app says why. Its care follows a plant when it moves.
**Hook:** two Monsteras, side by side, "Every 10 days" and "Every 16 days".
**Tone:** `polished`, Sprout's own voice: calm, first person, warm.
**Why not the Reels:** the stitched Reels repeated what a viewer of the
Reels had already seen, as four hooks in a row. This is one story in one
home, made for 16:9, and it shows two things the Reels never did: care
moving with a plant on the plan, and the weather offer.

| # | Scene | s | On screen (the real app, captured in `capture.js`) | Sprout says |
|---|---|---|---|---|
| 1 | Hook | 0–4.4 | Two phones: Monny's page, "Every 10 days", and Monty's, "Every 16 days" | "Two Monsteras. Two different schedules." |
| 2 | Why | 4.4–9.9 | Each page's "Why N and not 8?" lifted off its screen into the middle | "One's in terracotta, by a bright window." "The other is in plastic, in a dim kitchen." |
| 3 | Reveal | 9.9–17.6 | Today, then its Light section, Monty ringed; Sprout in the corner | "I'm Sprout. I work out each plant's care from where it actually lives." "And I tell you when a plant is in the wrong light." |
| 4 | Move | 17.6–26.2 | The plan: Monty picked up in the kitchen, set down by the living room window ("Bright indirect, Perfect spot"), opened: "Every 13 days" | "Move it somewhere brighter, and its care moves with it." |
| 5 | Weather | 26.2–32.6 | Today's dry-spell offer, accepted; the day's waterings come due | "A hot, dry week coming? I'll offer to water sooner. You decide." |
| 6 | Care | 32.6–39.2 | Monty's pets row (cats, dogs, people), then yellow leaves, diagnosed | "I'll warn you which plants could hurt the cat." "And when a leaf turns yellow, I'll help you find out why." |
| 7 | Private | 39.2–43.3 | All caught up, the resting plate | "Free, with no account. And your plants stay on your phone." |
| 8 | End | 43.3–47.8 | The lockup, "Plant care, worked out", Free on Google Play | "Sprout Evergreen. Free on Google Play." |

Rules kept:

- **The voice rules in `CLAUDE.md`:** first person, British English, one
  contraction a line, no exclamation marks in the captions.
- **The face follows the voice zoning:** Sprout in the corner only while
  it introduces itself, and the resting plate only where the app itself
  shows it. Neither sits beside care data, toxicity or a diagnosis.
- **Every claim is the app's own.** The schedules, reasons, light verdicts
  and causes on screen are what the app computes for this home
  (`home.js`). "Your plants stay on your phone" is
  `native/store-privacy.md`'s claim: a location, the one thing that
  leaves, is not about the plants.
- **No counts**, and no "coming soon to iPhone" in a video that plays on
  Play.
- **Readable:** every caption is held for at least about 0.3s a word once
  it is fully in.

Timing lives in `promo.json`: where each line is said, each scene's span,
and each caption's. A scene's phone plays its capture with `shift` seconds
of delay, so a scene can be moved without capturing again.
