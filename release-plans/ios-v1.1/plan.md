# iOS 1.1 — the first App Store release

**This release:** 1.1, built by `.github/workflows/ios.yml` (the build
number is the workflow's run number). Same code as Android 1.5
(`../android-v1.5/plan.md`), plus the permission changes below.
**Previous:** 1.0, submitted 25 September 2026 from main at #55, rejected.

iOS numbers its own versions from here. 1.1 is the code of Android 1.5, so
a question about one can be read against the other.

---

## What App Review said about 1.0

### Round 1 — Guideline 2.1, Information Needed

The account had little App Review history, so Apple asked for a recording on a
physical device, the app's purpose and audience, setup steps, the external
services, regional differences and any regulated material. The owner
answered every point, with a recording. That answer quoted 48 species, 42
clues and 40 causes and said the app opens into a tour; the notes below
replace it.

### Round 2 — Guideline 5.1.1(iv), Data Collection and Storage

> A custom message appears before the permission request, and the user can
> close the message and delay the permission request with the "not now"
> button. The user should always proceed to the permission request after
> the message.

The screen was the introduction's "Can I use your location?", with **Use
my location** and **Not now**. A message before a permission request may
explain it; it may not offer a way round it.

## Changes

| Change | Where |
| --- | --- |
| The location step is "Your local forecast": one sentence on what is coming and why, and one button, **Continue**, which always raises the system prompt. Not now is gone, and Skip the rest stays hidden on this step | `js/onboard.js` `stepLoc` |
| Whatever the reader answers in the system sheet moves the introduction on. A refusal, a timeout or no fix goes straight to the hemisphere question, with no error text, and holds Today's location card off for a month as Not now did | `js/onboard.js` `locate` |
| Today's "Want a reminder at 8am?" card (Remind me / Not now) is the same pattern for notifications, so it is not shown on iOS. Profile's Reminders switch is the way in there, and asks when tapped. Android keeps the card | `js/views/today.js` `remindAsk`, `UI.platform()` |
| The refusal line in Profile's location sheet: "Location is off for Sprout. Type your town instead." | `js/weather.js` |
| `MARKETING_VERSION` 1.0 → 1.1 | `native/ios/App/App.xcodeproj/project.pbxproj` |
| `CACHE` → `sprout-v119-viridium` | `sw.js` |

Not changed: Today's "Add your location" card. Its button opens the
location sheet, where typing a town needs no permission and "Use my
location" is a second tap the reader makes. Photo and camera access are
asked by iOS itself when a picker opens, with nothing of ours in front.

**Checked in headless Chromium:**

| Case | Result |
| --- | --- |
| Location step | "Your local forecast", one button (Continue), no Skip the rest, Back shown |
| Continue, location granted (Sydney) | Location saved, hemisphere skipped, lands on "Does this look right?" |
| Continue, refused (code 1) | Straight to the hemisphere question, no note; Today's card held for 30 days |
| Continue, timed out (code 3) | Same as refused |
| Back from the hemisphere question | Returns to the location step |
| Today, shell reporting `ios` | No reminder card; location card shown |
| Today, shell reporting `android` | Reminder card shown |
| Profile → location sheet → Use my location, refused | "Location is off for Sprout. Type your town instead." |
| Introduction end to end, then the review screen | Rows as before; hemisphere line when no location |
| Guided tour, "Watch me build one" | Both complete, no errors |

## Owner's checklist

- [ ] **Accept the updated Apple Developer Program License Agreement.** The
      Account Holder signs in at developer.apple.com → Account. App Store
      Connect blocks every submission until then (the yellow banner on Apps).
- [ ] App Store Connect → Sprout Evergreen → the iOS version on the left:
      rename **1.0 to 1.1**. The uploaded build must carry the same version
      string, and the record can be renamed while nothing has been approved.
- [ ] GitHub → Actions → **iOS build and upload** → Run workflow on `main`,
      with upload ticked. Wait for App Store Connect to finish processing the
      build (an email arrives, usually within half an hour).
- [ ] **TestFlight on a real iPhone or iPad** before submitting. Apple's 2.1
      note asks for this. Delete any old copy first so the introduction runs:
  - [ ] The location step shows Continue only; it raises iOS's location
        sheet. Run it once with **Allow** and once with **Don't Allow**; both
        move on.
  - [ ] Today shows no reminder card; You → Reminders asks for
        notification permission when switched on.
  - [ ] "Watch me build one" runs to "Your turn", and the screen stays on.
- [ ] On the 1.1 version page: select the new build, replace **App Review
      Information → Notes** with the notes below, and check the screenshots
      still show the app as it is.
- [ ] In the rejected submission's thread: **Reply to App Review** with the
      reply below, then **Resubmit to App Review**.

## Reply to App Review

```
Hello,

Thank you for the review. We have resolved Guideline 5.1.1(iv) in version 1.1.

- The location screen in the app's introduction no longer has a "Not now" button. It explains what the location is used for and has a single Continue button, which always leads straight to the iOS location permission request. Whichever answer the user gives there, the introduction continues. If location is declined, the app asks which hemisphere the user is in instead, and every feature still works.
- We applied the same rule to notifications. On iOS no in-app message appears before the notification permission request; it is requested only when the user turns on Reminders in You (the round button at the top of Today).
- Location stays optional at all times. In You the user can type a town instead, which needs no permission.

The App Review Information notes have been updated to describe this version.

Best regards,
Daniel Moreira
```

## App Review Information → Notes

Replaces the 2.1 answer, whose figures and first-run description are out of
date.

```
PURPOSE AND AUDIENCE
Sprout is a houseplant care tracker for ordinary plant owners with a few to a few dozen houseplants. Instead of a fixed reminder interval, it computes each plant's watering and feeding schedule from species data (95 species) adjusted for that plant's pot size and material, drainage, room light, window aspect and the season in the user's hemisphere. It also has a symptom-based diagnosis tool (26 symptoms, 43 clues, 47 causes) and a floor plan the user draws, from which the app derives each room's light.

NO ACCOUNT, NOTHING GATED
No sign-up, login, account, paid content, in-app purchase or user-generated content shared with others. Everything is usable immediately.

SUGGESTED WALKTHROUGH
1. Launch. A short introduction asks a few questions (name, pets, experience, plants already at home, location, hemisphere), then shows the answers back. The location step has one Continue button that leads to the iOS permission request; either answer continues.
2. The welcome sheet offers a guided tour of the four tabs on a sample home, which is never saved.
3. Today: tap + to add a plant, choose a species and a room. Its computed watering and feeding schedule appears straight away.
4. Greenhouse > the plan: draw a room, tap a wall to mark a window, set north. The room's light is derived from that. "Watch me build one" on the empty plan draws a sample flat as a demonstration.
5. Diagnose: pick a plant and a symptom, tick the clues that apply, and ranked causes with treatments appear.
6. Discover: browse the species, with matches for the user's rooms.

PERMISSIONS
Location (optional): asked once in the introduction after an explanation with a single Continue button, or from the location sheet in You (the round button at the top of Today) when the user taps "Use my location". Typing a town instead needs no permission.
Notifications (optional): asked only when the user turns on Reminders in You.
Camera and photo library: asked by iOS when the user adds a photo to a plant's diary or picks a floorplan image.

EXTERNAL SERVICES
One: Open-Meteo (open-meteo.com), a free weather and place-name API with no key or account, for the local forecast. Coordinates are rounded to two decimal places (about 1 km) before they are sent. No analytics, crash reporting, advertising, authentication, payments, AI services or server of our own. All data stays on the device. Reminders are local notifications scheduled by iOS. Rating requests use Apple's own in-app review sheet.

REGIONAL DIFFERENCES
None in features or content; free in every territory. The hemisphere decides which months are the growing season and which window aspect is bright, and the forecast is local.

REGULATED OR THIRD-PARTY MATERIAL
Neither. The care data and diagnosis knowledge base are our own writing from general horticultural knowledge. Plant toxicity for cats, dogs and people is general reference, not veterinary or medical advice.
```
