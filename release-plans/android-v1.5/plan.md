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

### The first run, reviewed end to end

**From:** the owner, before production: walk a new reader's first session
phase by phase and close the gaps. Walked in headless Chromium at 430×932
from a clean origin, every phase screenshotted.

| Phase | What a new reader met | Change |
| --- | --- | --- |
| 1. Splash | Wordmark, 2.3 s floor | None needed |
| 2. The questions | Sprout asked in the first person and only said who it was on the sheet after them | The first question opens with "I'm Sprout. A few quick questions, then we can start on your plants." |
| 2. The questions | The hemisphere was asked even of someone about to share a location, whose latitude answers it | Location now comes before it, and the hemisphere is asked only after "Not now" or a failed lookup. Order: name, pets, experience, plants, watered (only with plants), location, hemisphere |
| 2. The questions | Pets had no "None"; the only way to say so was Continue with nothing ticked | A **None** chip, which clears the others and moves on by itself like the one-tap answers |
| 2. The questions | No way to bring plants already at home | **Any plants already?** Search the species, tap to add (again for a second of the same), remove from the chips. Each is added by species alone, unplaced, with its acquired date unknown so it is not treated as just bought. A plant that would hurt the reader's pets says so in the list |
| 2. The questions | Plants from that step had no last watering, so every one was due a drink on the first morning | **Watered any of these this week?** follows it, only when something was added: Today, A few days ago (3) or About a week ago (7) per plant, with an "All of them" row when there are two or more. Unanswered stays "start today". Tapping a lit answer clears it |
| 2. The questions | No way back. Experience and hemisphere move on by themselves after a beat, so a mis-tap on the hemisphere (which flips every light reading and every season) stuck until Profile | A back arrow beside the wordmark from the second question on; Android's Back steps back a question too (and does nothing on the first). The automatic move-on is tied to its own question, so a quick Back is never overridden |
| 2. The questions | "Skip the rest" under "Not now"; the device's hemisphere hint and the skip were at `--ink-4`, almost invisible | Skip hidden on the location question; both raised to `--ink-3` |
| 3. Welcome sheet | A second introduction ("Hi, I'm Sprout…") in one long paragraph | Now the end of the introduction: "Welcome, Dan" and one line per answer that changed something (plants, pets, forecast or hemisphere). **Draw my home** leads either way, framed by the plants answer: with plants, "drag each one to where it stands"; without, "then I can suggest plants that will do well in each one", with **Browse plants** beside it |
| 4. The plan, no plants | Step 4 said only "No plants yet" | Once north is confirmed it lists species that would do well in the rooms just drawn, from `Schedule.roomMatches()`, the same list as Discover's "Good matches for your rooms". App only; the planner preview keeps the line |
| 4. The plan, with plants | — | The plants from the introduction wait in step 4's tray, as any unplaced plant does |
| — | The experience answer did nothing anywhere in the app | *Completely new* and *Figuring it out* see the forgiving species first in those room matches, on the plan and in Discover |
| 5. First plant | The first job a new reader ever got was "Fertilise", for a plant the form dates as bought today | A plant with no feed recorded waits one feed interval from the day it was acquired; the feeding card says "first feed once it has settled in". A plant that has been home longer is due as before |
| 6. Reminders | Off by default, and switched on only in Profile. Nothing on the way through mentioned them | On the native shell, once there is a plant, Today asks "Want a reminder in the morning?" under the day's jobs. **Remind me** asks the OS, the same way Profile's switch does; **Not now** is kept for good and Profile keeps the switch. Hidden once the OS has refused |

**Checked in headless Chromium:**

| Case | Result |
| --- | --- |
| First question | Lede above it, no back arrow |
| Pets: None, then Back | Pets saved as `[]`, moved on by itself; None still lit on return |
| Plants: Monstera, Snake Plant twice, remove one | Two plants, both `acquired: null` and due a feed as established plants; Snake Plant marked "Not safe for your cats"; button "Continue with 2 plants" |
| Watered: All of them a week ago, Monstera today, Pothos cleared | Monstera due in 8 days, Snake Plant in 11, Pothos today; All of them unlit; answers lit again after Back and forward |
| No plants added | Watered skipped forwards and back; six dots instead of seven |
| Location: Not now | Hemisphere asked next, skip shown again |
| Location shared (lookup stubbed to Sydney) | Introduction ends without asking the hemisphere; hemisphere `south` from latitude |
| Welcome with plants | "2 plants in…", Draw my home, Show me today first; the plants in step 4's tray |
| Welcome without plants | Forecast line, Draw my home, Browse plants |
| No plants, one drawn room with a window, north confirmed, *Completely new* | Step 4 suggests Spineless Yucca and Aloe Vera for the Living room; Discover lists the same two |
| Monstera added today | Feed due in 28 days, `settling`; Today shows nothing due |
| Today with the native shell stubbed | Reminder ask shown; Not now hides it and records `remind-ask` |

Still to check on a device: the reminder ask's Remind me opening Android's
notification permission dialog on 13 and up, and Back stepping through the
questions.

## Production switches

- [ ] `js/rate.js`: `LIVE = true`. Closed testers are paid, so it stayed
      off until now (`../android-v1.3/plan.md`).
- [ ] `native/android/app/build.gradle`: `versionCode 8`, `versionName "1.5"`.
- [ ] Device check: the 1.4 items (Back closing the diary sheet, the room
      name coming back, Remove this plant), editing a diary entry, and
      Import a home plan from a file saved on the phone (the system file
      picker opens, the sheet reads it, the plan arrives), and the first
      run: Back through the questions, and Today's reminder ask opening the
      notification permission dialog on Android 13 and up.
- [ ] Play Console before the first production release: store listing,
      Data safety (including whether the In-App Review library needs
      declaring), content rating, countries.
- [ ] Production release, ideally staged (for example 20% first).

## Release housekeeping

- [x] `CACHE` in `sw.js`: `sprout-v81-viridium` for S-04,
      `sprout-v92-viridium` for Import a home plan,
      `sprout-v103-viridium` for the first-run review.
