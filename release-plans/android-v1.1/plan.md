# Android 1.1 — fixes from closed testing

**From:** PrimeTestLab QA report Nº 7959 (test date 30 Sep 2026, window
23 Sep – 7 Oct 2026, 25 testers). One device covered: Sharp AQUOS R8
(A301SH), Android 13, 1260 × 2730.
**Build tested:** 1.0 (versionCode 2).
**This release:** 1.1 (versionCode 3). Bug fixes and polish only: no new
screens, no change to the data format, so a minor bump rather than 2.0.

The report's cover reads "10 of 10 checks passed, no issues logged". Its body
does not: the coverage table fails three areas and logs four minor bugs
(M-01 to M-04) plus five suggestions (S-01 to S-05). Work from the body.

---

## Order of work

1. **M-01** backup. Users are told their data lives only on the phone and to
   back it up, and on the phone the backup does nothing.
2. **M-02** and **M-03**: small fixes in `js/views/greenhouse.js` and
   `css/styles.css`.
3. **M-04** and **S-01** together. Both are Android theme changes and share
   one device build.
4. **S-04**, **S-05**, then the wording half of **S-03**, then **S-02**.
5. Photo storage in IndexedDB (the other half of S-03): a separate change,
   not in 1.1.

---

## Bugs

### M-01 — "Download backup" saves nothing

**Reported:** You → Settings → Download backup. The button flashes; no file,
no save dialog, no message. Restore opens the file picker as expected.

**Cause.** `exportData()` (`js/views/settings.js:28`) builds a Blob, points an
`<a download>` at its object URL and clicks it. A browser turns that into a
download. The Capacitor Android WebView has no download handler for `blob:`
URLs and drops the click. The function also shows "Backup downloaded"
without checking, so on the web it can claim a success that never happened.

**Fix.**
- Native: write the JSON from `Store.exportAll()` to the cache directory
  with `@capacitor/filesystem`, then hand that file to the Android share
  sheet with `@capacitor/share` (Save to Files, Drive, email). The share
  sheet is the right destination, not just a workaround: a copy saved to
  the phone's own Downloads doesn't survive losing the phone, which is the
  case the backup exists for.
- Reach both plugins through `window.Capacitor.Plugins`, the way
  `js/notify.js:282` reaches LocalNotifications. The app gains no
  dependency, and the plugins live in `native/package.json` only.
- Web: keep the `<a download>` path.
- Both: show the success toast only once the write or share has resolved.
  If the reader dismisses the share sheet, say nothing was saved.

**Also.** `Store.importAll` (`js/store.js:437`) catches and ignores each
failed photo write, so restoring a backup larger than the free space drops
photos silently. Count the failures and say how many didn't fit.

**Check:** on a device build, back up, confirm the file arrives where it was
sent, clear app data, restore from that file, and confirm the plants, rooms,
diary entries and photos all come back.

### M-02 — A double tap on "Add to my greenhouse" adds the plant twice

**Reported:** Greenhouse → + → A plant → ZZ Plant → two quick taps. Two
identical ZZ Plant cards appear and the count rises by two. The same
happened with Spider Plant.

**Cause.** The `#f-save` handler in `plantForm`
(`js/views/greenhouse.js:356`) has no guard. `UI.closeSheet()`
(`js/ui.js:385`) keeps the sheet on screen for a 200 ms exit animation,
and the button still takes taps during it, so the second tap calls
`Store.addPlant` again. Discover's "Add to my greenhouse" opens the same
form and has the same bug.

**Fix.**
- `.sheet-backdrop.is-closing { pointer-events: none; }` next to the
  existing `.is-closing` rules (`css/styles.css:4985`). One rule covers
  every sheet: rooms, diary entries and plants alike.
- A one-shot flag in the `plantForm` save handler as well. Of all the sheets,
  this is where a double submit costs the most to clean up.

**Check:** in headless Chromium, dispatch two clicks on `#f-save` in the
same tick and 50 ms apart. Exactly one plant is created.

### M-03 — Long nicknames are cut off mid-word without warning

**Reported:** the nickname "Monstera by the reading chair near the tall
bookshelf" saves as "Monstera by the reading chair near the t". Renaming
with the edit pencil does the same.

**Cause.** `#f-nick` has `maxlength="40"` (`js/views/greenhouse.js:247`).
The field stops taking characters and says nothing. The edit pencil opens
the same form, which is why renaming does the same thing.

**Fix.**
- Raise the limit to 60.
- Show a live count ("52/60") from about 45 characters, so the limit is
  visible before it is hit. The hint stays in the first person.
- Check that a 60-character name truncates with an ellipsis on the plant
  tile, the hero (`js/views/plant.js:146`) and the All plants list. Make
  sure nothing overflows its container.
- While there: room names allow 40 characters in the Greenhouse form
  (`greenhouse.js:494`, `:503`) but 30 on the plan (`js/views/plan.js:453`).
  Pick one limit for both.

**Check:** screenshots at 430×932 with a 60-character nickname on every
screen that shows a plant's name.

### M-04 — White strip down the left edge in landscape

**Reported:** Greenhouse tab, phone turned sideways: a plain white strip
appears along the left edge.

**Cause.** In landscape, Android 13's default cutout mode keeps the window's
content out of the camera cutout. What shows in that band is the window
background. `AppTheme.NoActionBar`
(`native/android/app/src/main/res/values/styles.xml`) is a DayNight theme
with `android:background` set to `@null` and no `windowBackground`, so the
band falls back to the system default, which is white under a light system
theme.

**Fix.**
- Set `android:windowBackground` on `AppTheme.NoActionBar` to the deep field
  `#0A1410`, the value `index.html` already uses for `theme-color`. On its
  own, this gives the tester's expected result.
- Optional, only after checking on a device: set
  `android:windowLayoutInDisplayCutoutMode` to `shortEdges` and pad the app
  shell with `env(safe-area-inset-left/right)`, so the app fills the screen.
  The app targets SDK 36, so Android 15+ already draws edge to edge and
  needs those insets regardless. Some Android WebView builds report zero
  for them, so this step is gated on a device check rather than assumed.

**Known gap:** under Conservatory (the light theme) the band will be dark.
A dark band beside a light app is still far better than a white one beside
a dark app. Matching it exactly needs runtime control of the window colour,
the same work as S-01.

**Check:** device build, both themes, both landscape orientations
(cutout on the left and on the right).

---

## Suggestions

### S-01 — Status bar doesn't match the app

Add `@capacitor/status-bar` to `native/`. On boot, and wherever the theme
changes, set the bar colour and icon style. `js/app.js:77` already updates
`theme-color` on a theme switch, so that is the place: `#0A1410` with light
icons under Viridium, `#F7F3EC` with dark icons under Conservatory. Guard
the call the same way `notify.js` does, so the web build never reaches for
a plugin that isn't there. Ship with M-04.

### S-02 — Planner hints cover the drawing space

After a room is drawn, the Add a plant button and the reshape tip
(`js/views/plan.js:834`) sit on top of the compass hint. Together they cover
the lower third of the grid, where a second room would go.

- Collect the hints into one tray under the grid instead of overlaying it.
- Make the reshape tip dismissible, and remember the dismissal in the saved
  preferences so it doesn't come back on every visit.
- Check with screenshots at 430×932 and around 412 px wide (the AQUOS's CSS
  width), with one room drawn and with two.

### S-03 — Storage explained in browser terms

Settings says everything "lives in this browser only" and that "browsers
give me around 5MB" (`js/views/settings.js:116`, `:127`, `:151`, `:165`).

- **In 1.1:** on the native shell, say "on this phone" instead of "in this
  browser". Drop the 5MB figure; it means nothing to the reader. Warn while
  a photo is being added once usage passes 85%. Today that warning appears
  only in Settings, where nobody adding a photo will see it. The copy
  follows the voice rules in `CLAUDE.md`: first person, no exclamation
  marks, never telling the reader off.
- **Later, separately:** move photos from localStorage to IndexedDB, which
  `js/notify.js` already uses and which has far more room. That means a
  migration, a change to the backup format and updates to the storage table
  in `CLAUDE.md`. Too big to ride along with bug fixes.

### S-04 — Long body text too faint

Multi-line explanations use `.dim` → `--ink-4`, which is
`rgba(196, 218, 206, 0.32)` on the dark field (`css/styles.css:57`, `:568`).
The tester called out the Diagnose cause text and the backup note in
Settings.

- Move paragraph-length text to `--ink-3` (`0.50`), or to a new token that
  meets WCAG AA 4.5:1 on `--bg-1`. Keep `--ink-4` for short labels and
  metadata.
- Check the Conservatory values too (`css/styles.css:4315`).
- `brand.html` reads every swatch from the live cascade, so it updates
  itself. Only its prose on what each tone is for may need a line.

### S-05 — Light problems missing from Today

A plant page can show "Wrong light" while Today says "Everything is watered,
fed and content" (`js/views/today.js:52`).

- When `Schedule.lightMatch(p)` returns `verdict: 'bad'` for any active
  plant, don't use the "content" greeting. Add a short line naming the plant
  and linking to it.
- `lightMatch` returns `null` for a plant with no room or a room with no
  light reading. Treat that as nothing to say, not as fine. A plan room's
  light is null while north is unconfirmed or the hemisphere is a guess, so
  Today stays silent exactly when the plan does.
- This is a conversation surface, so first person, and it must not open the
  same way as the line above it.

---

## Release housekeeping

- [ ] Bump `CACHE` in `sw.js` (currently `sprout-v58-viridium`): CSS and JS
      both change.
- [ ] `native/`: install `@capacitor/filesystem`, `@capacitor/share` and
      `@capacitor/status-bar`, then `npm run sync`.
- [ ] `native/android/app/build.gradle`: `versionCode 3`, `versionName "1.1"`.
- [ ] `native/README.md`: list the three new plugins and what each is for.
- [ ] Privacy: no change needed. A backup only leaves the phone when the
      reader picks a destination in the share sheet. Nothing is sent
      automatically and nothing reaches a server of ours. Re-read
      `native/store-privacy.md` against the final code anyway, per
      `CLAUDE.md`.
- [ ] Headless Chromium covers M-02, M-03, S-02, S-04 and S-05. M-01, M-04
      and S-01 only show up on Android and need a device build before
      PrimeTestLab is told they are fixed.
- [ ] Reply on report Nº 7959 in the PrimeTestLab dashboard with the build
      number and the items addressed.

## Status

| Item | Status |
| --- | --- |
| M-01 Backup | Done in code; needs a device build to confirm |
| M-02 Double add | Not started |
| M-03 Nickname length | Not started |
| M-04 Landscape strip | Not started |
| S-01 Status bar | Not started |
| S-02 Planner hints | Not started |
| S-03 Storage wording | Not started (IndexedDB move deferred) |
| S-04 Contrast | Not started |
| S-05 Light on Today | Not started |
