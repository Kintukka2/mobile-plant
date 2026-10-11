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

### Import a home plan

**From:** the owner, step 3 of the planner funnel. The planner preview at
sproutevergreen.app/planner (PR #111) saves a backup-shaped file, and
until now Restore was the only way in, replacing everything the app held.

**Done.** Settings has a **Home plan** card with **Import a home plan**,
and the empty plan offers "or import one you drew on the web". Both open
a file, then a sheet that says what will change before anything does
(`Store.previewPlan` / `Store.importPlan`):

- The imported drawing replaces the plan: rooms, windows, north, scale
  and any tracing image.
- A room already here with the same name takes the new outline and keeps
  its id, plants, notes and icon. An unmatched drawn room keeps
  everything but its outline. Plants already here keep their rooms and
  lose their spots on the plan.
- The file's plants come in only when "Bring the plant(s) on it too" is
  ticked; it starts off when the garden already has plants.
- Profile, settings and the diary are never touched. The hemisphere is
  taken only if this garden has none.
- A store too full for the result is put back as it was.

**Checked in headless Chromium:**

| Case | Result |
| --- | --- |
| New garden, planner file | 5 rooms with derived light, the Monstera placed, name kept |
| Garden with Living Room, Kitchen, Study and 6 plants | Living Room and Kitchen keep their ids and plants; 3 rooms added; 6 plants unplaced, none added; 5 diary entries kept |
| Same, with Study drawn | Study loses its outline only; the sheet says so first |
| A file that isn't a plan | "That file isn't a Sprout plan." and nothing changes |
| Store full | "Storage is full" and the garden is as it was |
| From the empty plan's link | Same as from Settings, arriving on the plan |

## Production switches

- [ ] `js/rate.js`: `LIVE = true`. Closed testers are paid, so it stayed
      off until now (`../android-v1.3/plan.md`).
- [ ] `native/android/app/build.gradle`: `versionCode 8`, `versionName "1.5"`.
- [ ] Device check: the 1.4 items (Back closing the diary sheet, the room
      name coming back, Remove this plant), editing a diary entry, and
      Import a home plan from a file saved on the phone (the system file
      picker opens, the sheet reads it, the plan arrives).
- [ ] Play Console before the first production release: store listing,
      Data safety (including whether the In-App Review library needs
      declaring), content rating, countries.
- [ ] Production release, ideally staged (for example 20% first).

## Release housekeeping

- [x] `CACHE` in `sw.js`: `sprout-v81-viridium` for S-04,
      `sprout-v92-viridium` for Import a home plan.
