# Android 1.5 — the first production release

**This release:** 1.5 (versionCode 8), the first build for the Production
track. Production access was granted on 11 October 2026
(`../android-v1.4/plan.md`).
**Previous:** 1.4 (versionCode 7), closed testing only.

A few changes the owner wanted first, then the production switches.

---

## Changes

### S-04 — Edit a diary entry

**From:** PrimeTestLab report Nº 8220, S-04, held back from 1.4 as a
feature rather than a fix. Entries could only be deleted and written again,
so correcting a typo lost the note and its photo.

**Done.** Every entry in the Diary timeline has a pencil beside its delete
icon, revealed the same way. It opens the sheet entries are added with,
filled in: date, text, and for a measurement its value and unit. The kind
stays what it was. The photo can be kept, replaced or removed.

- A replacement photo is stored before the old one is deleted, so a full
  store refusing it leaves the entry as it was.
- An entry left with no text and no photo is refused the same way a new
  one is.
- Changing the date of a watering, feed or repot moves the plant's
  schedule with it (`Store.updateLog`). If that entry set the schedule,
  it now comes from the latest entry of its kind; if the schedule came from
  the plant form's "Last watered", it only ever moves forward.

**Checked in headless Chromium:**

| Case | Result |
| --- | --- |
| Open a note with a photo | "Edit note", date, text and photo filled in, "Save changes" |
| Change text and date | Saved, photo kept, toast "Entry updated" |
| Replace the photo | New photo stored, old one deleted |
| Remove the photo | Entry kept with no photo, old one deleted |
| Clear the text with no photo | Refused: "Write something, or attach a photo" |
| Open a measurement | Value 40 and unit "leaves" filled in; 42 saved |
| Move the latest watering from 8 to 5 October | Schedule anchor moves to 5 October |
| Edit an older watering while "Last watered" says 9 October | Stays 9 October |

## Production switches

- [ ] `js/rate.js`: `LIVE = true`. Closed testers are paid, so it stayed
      off until now (`../android-v1.3/plan.md`).
- [ ] `native/android/app/build.gradle`: `versionCode 8`, `versionName "1.5"`.
- [ ] Device check: the 1.4 items (Back closing the diary sheet, the room
      name coming back, Remove this plant) and editing a diary entry.
- [ ] Play Console before the first production release: store listing,
      Data safety (including whether the In-App Review library needs
      declaring), content rating, countries.
- [ ] Production release, ideally staged (for example 20% first).

## Release housekeeping

- [x] `CACHE` in `sw.js`: `sprout-v81-viridium` for S-04.
