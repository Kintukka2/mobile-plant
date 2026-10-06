# Android 1.2 — the rating screen

**This release:** 1.2 (versionCode 4).
**Previous:** 1.1 (versionCode 3), the fixes from PrimeTestLab report 7959.
Everything in 1.1 is in this build as well, so if 1.1 never reached Play,
this upload supersedes it and nothing is lost. Play only needs each version
code to be higher than the last one uploaded.

---

## What's in it

**The rating screen** (`js/rate.js`, PRs #81 and #82). One full screen asking
for a store rating: five stars in laurels and the face in a ring. One
button, plus a quiet link to the store page for when no sheet appears.

- **One trigger.** It opens on the Today tap that clears the day's last task,
  1.6 seconds later, once "All caught up" has settled.
- **Strict policy** (`POLICY` at the top of `js/rate.js`):
  - Native only, and at least a week after install.
  - Ten care actions over three different days, and at least two plants.
  - Not within a fortnight of a diagnosis.
  - Ninety days between asks, three asks ever, and never again after the
    button has been tapped once.
- **No opinion question first.** Both stores forbid asking whether the
  reader is enjoying the app before offering the rating. Routing only the
  happy ones to the stars is review gating, and can get a listing pulled.

**The in-app review sheet.** `@capacitor-community/in-app-review` 7.1.0 is
now in `native/`, so the button asks Play for its own review sheet instead
of sending the reader out to the listing.

| Case | What the button does |
| --- | --- |
| The plugin is present and the call succeeds | Play's sheet, if Play decides to show one |
| The call fails | Opens the Play listing |
| No plugin (web) | Thanks the reader and nothing else |

The plugin is on the iOS allowlist too (`ios.includePlugins` in
`native/capacitor.config.json`), so the two builds don't drift. The iOS
`APP_STORE_ID` in `js/rate.js` is still `null` until there is a listing.

---

## Checked here

Headless Chromium, with the plugin stubbed:

- **Call succeeds:** one `requestReview()`, and no listing opened.
- **Call rejects:** `requestReview()`, then the Play listing.
- **No plugin:** the Play listing directly.

Also checked:

- `npx cap sync` lists the plugin for both platforms.
- It registers as `InAppReview` with `requestReview()`, the name and method
  `js/rate.js` calls.
- It needs no Android permission and supports minSdk 23. Its review library
  defaults to `com.google.android.play:review:2.0.1`, and it builds against
  the same Android Gradle plugin (8.7.2) as the app.

**Not checked:** a Gradle build. There is no Android SDK in the cloud
container.

---

## Release checklist

- [x] `native/`: install `@capacitor-community/in-app-review`, add it to
      `ios.includePlugins`, `npx cap sync`.
- [x] `native/android/app/build.gradle`: `versionCode 4`, `versionName "1.2"`.
- [x] `native/README.md` plugin table and the rating note in `CLAUDE.md`.
- [x] `CACHE` in `sw.js`: already `sprout-v65-viridium` from the rating PRs.
      This release changes no cached app file.
- [x] **Device build** (`native/prepare-android.bat`), confirmed on a phone
      on 6 October 2026:
  - [x] It builds. This is the first build with the new plugin.
  - [x] Open the screen on demand. Connect the phone, open
        `chrome://inspect` on a computer, pick the Sprout WebView, and run
        `Rate.open()` in its console. `Rate.eligible()` says why a device
        would or wouldn't be asked on its own. If the DevTools window opens
        blank, with an empty address bar and nothing printed after Enter,
        use the **inspect fallback** link instead of **inspect**. The plain
        link downloads a matching DevTools from Google, and when that fails
        the window looks open but is attached to nothing.
  - [x] Tap **Leave a rating**. Play shows its sheet only when the app was
        installed from Play, and decides for itself whether to show it at
        all, so seeing no sheet is not by itself a failure. For a build that
        is sure to show it, use Play's internal app sharing, which is the
        route Google documents for testing this API. Tapped on a build
        installed from Android Studio: no sheet, as expected there.
  - [x] **No sheet appeared? Open the store page** opens the Play listing.
  - [x] The 1.1 checks: backup and restore, the status bar in both themes,
        the landscape cutout band. All pass.
- [ ] **Privacy.** The app never sees a rating or a review: Google's own
      sheet collects it and sends it to Google. So nothing in the four
      privacy documents changes. Before submitting, check Play's current
      Data safety guidance on the Play In-App Review library, in case Play
      expects it listed.
- [ ] **Upload** the bundle to the closed testing track, with the release
      notes below.

---

## Release notes (Play "What's new", under 500 characters)

> Once Sprout has been looking after your plants for a while, it may ask for
> a rating, at a quiet moment just after you've finished the day's care, and
> only a few times ever. It uses Google Play's own rating sheet, so you never
> leave the app.
>
> Also in this version: backups now save through your phone's share sheet,
> long plant names are kept in full, a double tap no longer adds a plant
> twice, and the status bar and landscape layout match the app.

Drop the second paragraph if 1.1 already went out with those notes.
