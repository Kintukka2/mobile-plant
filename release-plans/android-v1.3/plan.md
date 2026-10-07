# Android 1.3 — the rating ask off for closed testing

**This release:** 1.3 (versionCode 6). Code 5 was the first 1.3 bundle,
which Play refused for its minimum SDK (below).
**Previous:** 1.2 (versionCode 4), live to closed testers since 6 October 2026.

---

## Why it exists

1.2 shipped the rating screen with its automatic ask live. PrimeTestLab
replied on ticket #3229 (6 October) and asked for it to stay out of closed
testing. Their testers are paid to use the app. Play's ratings policy treats
ratings from paid testers as incentivised, so Google can strip them and
penalise the listing. The ask needs a week since install and ten care
actions over three days, so testers who started on 23 September may already
qualify in 1.2.

## What's in it

- **The automatic rating ask is off.** `LIVE = false` at the top of
  `js/rate.js` makes `Rate.eligible()` refuse with "switched off until the
  production release", so `Rate.maybeAsk()` never opens the screen.
  `Rate.open()` and `?rate` still open it for review. Turn `LIVE` on in the
  build that goes to production, and nowhere earlier.
- **The UI work merged since 1.2** (PRs #87 to #89):
  - new Sprout scenes for Greenhouse, the plan and Diagnose
  - the room drawn in the room form, with the hemisphere behind an "i"
  - add a plant to a room from its card, with photos in the plant picker
  - more room in Diagnose, with the pills beside the cause
  - the species photo in Discover's room matches
- `CACHE` is `sprout-v73-viridium`.

One native change: **minSdk 24** (Android 7.0), up from the template's 23.
The first 1.3 upload, as 5 (1.3), was refused on 7 October 2026 with "Play
automatic protection requires a minimum SDK version of 24 or higher". That
protection is a Play Console enhancement, not something in the build, so
1.2 went through before it applied. Raising the floor drops only Android 6
phones. The plugins are as in 1.2.

## Checked here

Headless Chromium, with a stubbed Android shell and a reader who passes
every other rule (installed a month ago, two plants, twelve care actions
over four days):

| `LIVE` | `Rate.eligible()` | Opens by itself | `Rate.open()` |
| --- | --- | --- | --- |
| `false` (this build) | "switched off until the production release" | No | Opens |
| `true` (for comparison) | "eligible" | Yes | Opens |

The UI changes from #87 to #89 were tested in their own PRs, not again
here.

## Release checklist

- [x] `js/rate.js`: `LIVE = false`. `CLAUDE.md` says so in the rating
      paragraph.
- [x] `native/android/app/build.gradle`: `versionCode 6`, `versionName "1.3"`.
      Code 5 went to the refused upload and is treated as spent.
- [x] `native/android/variables.gradle`: `minSdkVersion = 24`.
- [x] `CACHE` bumped to `sprout-v73-viridium`.
- [ ] **Build.** Run `native/prepare-android.bat`, then sync in Android
      Studio. Sign through **Generate Signed App Bundle or APK** (the
      password is the one Android Studio remembers). The file lands in
      `native\android\app\release\app-release.aab`.
- [ ] **Quick device check.** The new Greenhouse, room form and Diagnose
      screens look right. Optionally run `Rate.eligible()` through
      `chrome://inspect` and confirm it says "switched off".
- [ ] **Upload** to Closed testing as **6 (1.3)**, with the notes below.
      Remove the refused 5 (1.3) bundle from the draft release first (the ✕
      beside it), or Play keeps reporting its error.
- [ ] **Reply to PrimeTestLab** on ticket #3229: the ask is off from 1.3.

---

## Release notes (Play "What's new", under 500 characters)

> A tidier Greenhouse: add a plant straight from a room's card, with
> photos in the plant picker. The room form now draws the room as you set
> its windows, Discover shows each species' photo in its room matches, and
> Diagnose has more room to read, with fresh Sprout scenes throughout.
