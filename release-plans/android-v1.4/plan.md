# Android 1.4 — fixes from the second closed-testing report

**From:** PrimeTestLab QA report Nº 8220 (test date 7 Oct 2026, window
23 Sep – 7 Oct 2026, 25 testers). One device covered: Pixel 7 Pro, Android 17
(SDK 37), 1080 × 2340.
**Build tested:** 1.2 (versionCode 4), not 1.3. 1.3 was still in review when
they tested, and they didn't use the Sharp AQUOS R8 we asked for in ticket
#3229.
**This release:** 1.4 (versionCode 7). Bug fixes and small polish, no change
to the data format.

The cover reads "0 issues logged". The body fails four areas, logs three
minor bugs (M-01 to M-03), reports a fourth failure without a number (the
diary save) and makes four suggestions (S-01 to S-04). Work from the body.

**Confirmed fixed from report 7959,** on this device: backup through the share
sheet, one plant from a double tap, the nickname counter, the status bar in
both themes, landscape and the gesture bar, Back and resume, and the
reminder permission prompt.

---

## Order of work

1. **M-02**, the self-matching Care heading. Every plant shows it out of season.
2. **Back button**, the diary failure. A native change, so it needs a
   device build.
3. **M-03**, plant removal in the edit sheet.
4. **S-01**, **S-03**, then **S-02**.
5. **M-01** is already on main and needs only a check.
6. **S-04** is a feature and is not in 1.4.

---

## Bugs

### M-01 — A room can be saved without a name

**Reported:** Planner → open a room → clear the name field → leave. The
room is saved with no name: a blank card in Greenhouse and a blank choice
when assigning a plant.

**Already fixed on main** (`bf3eada`, 7 October, after the 1.3 build). The
field still saves as you type, but an empty value keeps the last real name,
which is put back when the field is left, with a toast. Rooms already
saved blank, on a device or in a backup, get the first free "Room N" when
the store loads or restores (`nameBlankRooms()` in `js/store.js`). The room
form already refused an empty name.

**Check:** on the 1.4 device build, clear a room's name on the plan, leave
the field, relaunch. The name is still there.

### M-02 — "Why 12 and not 12?"

**Reported:** Golden Pothos, Care tab: the heading over the watering reasons
reads "Why 12 and not 12?", while the reason below it says autumn moved it
from 7 to 12 days. Snake Plant "35 and not 35", Monstera "14 and not 14".

**Cause.** `wateringInterval()` in `js/schedule.js` returns `base` as this
season's species figure, so out of the growing season it already includes
dormancy. Dormancy is then listed as a factor too, and the heading compared
the result with `base`. With dormancy the only factor, they are the same
number. That is every plant without a room, pot or offset that moves it, for
the whole autumn and winter.

**Fix.** `wateringInterval()` also returns `ref`, the growing-season figure
that every factor, dormancy included, is measured from. The heading asks
"Why 12 and not 7?". When the factors cancel out exactly (a dry-weather
adjustment against dormancy, say), the heading reads "What goes into 7
days" instead of asking a question with no answer.

**Check:** headless Chromium, real autumn date, northern time zone:

| Plant | Before | After |
| --- | --- | --- |
| Golden Pothos | Why 12 and not 12? | Why 12 and not 7? |
| Snake Plant | Why 35 and not 35? | Why 35 and not 18? |
| Monstera | Why 14 and not 14? | Why 14 and not 8? |
| Golden Pothos, spring (Sydney), 30cm pot | Why 14 and not 7? | Why 14 and not 7? (unchanged) |
| Golden Pothos, spring, nothing set | no heading | no heading (unchanged) |
| Golden Pothos, autumn, −5 days | Why 7 and not 12? | What goes into 7 days |

### The diary save returns to Greenhouse (no number in the report)

**Reported:** Plant → Diary → add a note with a photo → **Save entry**. The
entry is saved, but the app shows Greenhouse instead of the plant's diary.

**Cause, reproduced in headless Chromium.** The app registers no handler for
Android's Back button, so Capacitor's default runs `history.back()`. Sheets
are an overlay that isn't tied to the route, so Back with a sheet open
changes the page underneath to Greenhouse and leaves the sheet on top. Save
then writes the entry for the right plant and redraws the page that is now
current, Greenhouse. The likeliest trigger is Back used to hide the keyboard
after typing the note. The same thing can happen behind every sheet: room,
plant, entry, confirm.

**Fix.** Listen for `backButton` through `window.Capacitor.Plugins.App`, the
way `js/notify.js` already reaches the App plugin:

- A sheet is open: close it and stay on the page.
- Otherwise, if there is history: `history.back()`.
- Otherwise: `App.exitApp()`, which is the default this listener replaces.

Registering a listener turns Capacitor's default off, so all three branches
are needed. The web build has no App plugin and is unchanged.

Back unwinds one layer at a time, outermost first, the way Escape does on a
keyboard: the lightbox, then the tour or the rating screen (each handed its
own Escape, so each closes its own way), then a sheet. During the
introduction Back does nothing, since there is no way back through it by
design. Only once nothing is open does it move the page or exit.

**Checked in headless Chromium** with a stubbed Android shell:

| Open | Back does |
| --- | --- |
| Diary sheet on a plant | Closes the sheet, stays on the plant |
| Nothing, with history | Goes back a page (plant to Greenhouse) |
| A sheet with the lightbox over it | Closes only the lightbox, then the sheet on the next press |
| The rating screen | Closes it |
| The planner tour | Closes it, stays on the plan |
| Nothing, no history | Exits the app |

**Device check:** open the diary sheet, type, press Back to hide the
keyboard, press Back again. The sheet closes and the plant page stays.
With the keyboard up, Android uses the first Back to hide it and never
passes it to the app.

### M-03 — A plant can't be removed

**Reported:** no remove action in the plant header, the edit sheet, a card
long-press or swipe, or Settings (only "Delete everything").

**Cause.** The action exists: a "Remove <name>" button at the very bottom
of the Care tab, under "What tends to go wrong". The tester looked in the
edit sheet first, which is where a reader expects it, and didn't scroll to
the end of the Care tab.

**Fix.** A quiet "Remove this plant" at the foot of the edit sheet, with the
existing confirmation ("Its diary entries, measurements and photos will all
be deleted"). It shows only when editing, never when adding. Keep the Care
tab button.

Both buttons now open the same confirmation (`ViewPlant.confirmRemove()`),
so the wording and what gets deleted can't drift apart. The edit-sheet
button sits above the action row, not in it: Save stays pinned in the
footer and Remove scrolls with the form.

**Checked in headless Chromium:** the add sheet has no Remove. The edit
sheet does, below a divider, with Save still pinned. Remove → "Remove
Monty?" → Remove plant lands on Greenhouse with the plant, its diary entry
and its photo gone from storage, and the other plant untouched.

---

## Suggestions

### S-01 — Long grey text still too faint

The second time this has been raised (report 7959, S-04). The 1.1 fix moved
paragraphs from `--ink-4` to `--ink-3` at `0.58`, which passes WCAG AA, but
the backup note and diagnosis details still read as faint on a phone in
normal light.

**Done.** Every one of those paragraphs is `.muted` or `.hint`, both
`--ink-3`, so the token is the fix:

| Theme | Before | After | Weakest surface | Page | Ink 2 |
| --- | --- | --- | --- | --- | --- |
| Viridium | `0.58` | `0.68` | 4.8 → 6.1:1 (`--glass-2`) | 5.3 → 6.8:1 | 8.6:1 |
| Conservatory | `#5C6F66` | `#4E6057` | 4.45 → 5.6:1 (`--bg-4`) | 4.8 → 6.1:1 | 9.4:1 |

Conservatory was failing on its selected surface, so it moves too. Ink 3
stays clearly under Ink 2 in both, so a hint never reads as body copy.
`brand.html` reads the token from the cascade and follows on its own.

### S-02 — Diagnose sounds sure after contradictory answers

After "Diagnose anyway" on answers Sprout flagged as conflicting, the result
still said "Refined" and "Most likely".

**Done.** With a clash in play (`PROBLEM_DATA.clashes()` on the ticked
clues):

| | Before | After |
| --- | --- | --- |
| Heading | Most likely causes | Possible causes |
| Note | refined | mixed answers |
| Top cause | Most likely | Possible |
| Beside the result | nothing | "Two answers disagree", the pair, and Change an answer |
| Diary entry | Most likely: X (most likely) | Some answers disagreed, so less certain. Best fit: X |

The card is plain reference voice, with no persona. Results without a clash
are unchanged: checked with one clue ("Most likely causes", "refined") and
with none ("Possible causes", "symptom only").

### S-03 — The location card keeps coming back

After "Not now" in onboarding, Today kept showing "Add your location" every
morning.

**Done.** The card has a Not now of its own beside Set my location. That
button and the introduction's Not now both hold the card back for thirty
days (`Store.snoozeLocationAsk()`, stored in `settings.locationAsk` as the
date it may come back). Toast: "I'll ask again in a month. Profile has it
any time before then." Profile keeps the way in throughout.

**Checked in headless Chromium:** Not now hides the card and the hide
survives a reload. With the date moved past the month the card returns.
With a location set it stays away. The introduction's Not now sets the
same date.

### S-04 — Editing a diary entry

Edit a saved entry's text, date or photo instead of deleting and recreating
it. A feature, not a fix, so it isn't in 1.4.

---

## Release housekeeping

- [x] `CACHE` in `sw.js`: bump with each fix. `sprout-v77-viridium` for M-02,
      `sprout-v78-viridium` for the Back button, `sprout-v79-viridium` for M-03,
      `sprout-v80-viridium` for S-01 to S-03.
- [x] `native/android/app/build.gradle`: `versionCode 7`, `versionName "1.4"`.
- [x] `js/rate.js` still has `LIVE = false`: 1.4 goes to closed testing.
- [x] **Build.** Run `native/prepare-android.bat`, then sync in Android
      Studio. Sign through **Generate Signed App Bundle or APK** (the
      password is the one Android Studio remembers). The file lands in
      `native\android\app\release\app-release.aab`.
- [ ] **Device check**, on a build installed from Android Studio. Not
      recorded before the upload; still to do, and the first thing to look
      at if the testers report any of these:
  - [ ] **Back button.** Open a plant's Diary, add a note, type something,
        press Back to drop the keyboard, then Back again. The sheet closes
        and the plant stays on screen.
  - [ ] **M-01.** On the plan, clear a room's name and leave the field. The
        old name comes back. Relaunch: still named.
  - [ ] **M-03.** Edit a plant: **Remove this plant** is at the foot of the
        sheet and removes it after the confirmation.
  - [ ] **The planner** (PR #93, new since 1.3): the step dock, undo and
        redo, and the room lock behave on a phone.
- [x] **Upload** to Closed testing as **7 (1.4)**, with the notes below.
      Uploaded and sent for review on 9 October 2026: App bundle, Enhanced,
      API 24+, target SDK 36, with the release notes below in full.
- [ ] **Approved.** Not yet: in review when this was recorded.
- [x] **Reply** on report Nº 8220 with the build number and the items
      addressed. Sent on 9 October 2026. It names 7 (1.4) as in review,
      goes through M-01 to M-03, the diary save and S-01 to S-03, says
      S-04 is planned for a later release, mentions the planner rework and
      that the rating prompt stays off, and asks for a re-test once 1.4
      reaches the testers, on the Sharp AQUOS R8 as well as the Pixel 7 Pro.

## Release notes (Play "What's new", under 500 characters)

> A clearer floor planner: one step at a time, undo and redo, and a lock to
> keep a finished room in place. You can now remove a plant from its edit
> sheet, Back closes whatever is open before leaving the page, and the
> watering explanation compares against the right figure. Diagnose says when
> your answers disagree, the location card can be put off for a month, and
> quieter text is easier to read.

## Status

| Item | Status |
| --- | --- |
| M-01 Empty room name | Done on main (`bf3eada`); device check to do |
| M-02 Care heading | Done; checked in headless Chromium |
| Back button / diary save | Done; checked in headless Chromium, device check to do |
| M-03 Remove a plant | Done; checked in headless Chromium |
| S-01 Contrast | Done; Ink 3 raised in both themes |
| S-02 Diagnose confidence | Done; checked in headless Chromium |
| S-03 Location card | Done; checked in headless Chromium |
| S-04 Edit diary entries | Not in 1.4 |
