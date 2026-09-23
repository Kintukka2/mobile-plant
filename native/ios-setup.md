# Getting Sprout onto the App Store

Written from a Windows machine, which is the constraint everything here
follows from: **Xcode only runs on macOS, and there is no way around that.**
No cross-compiler, no emulator, no workaround.

There are two ways to build without owning a Mac. This document recommends
one and records the other, because the recommended one is newer and less
written about, and if it stops fitting the fallback needs to be findable.

`native/store-listing.md` and `native/store-privacy.md` hold the copy and the
privacy answers. This file is only the mechanics.

---

## Route A — Xcode Cloud (recommended)

Apple's own CI, configured entirely in the App Store Connect web UI. It is
the right answer here for one reason above all the others: **it signs the
build itself.** No certificate to generate, no `.p12` to export, no
provisioning profile to download, no secrets to paste. Those four things are
where a Mac-less iOS setup normally dies.

25 compute hours a month are included with the developer programme. A build
of this app is a few minutes, so that is not a constraint.

### What the repository already provides

`native/ios/App/ci_scripts/ci_post_clone.sh` runs after Xcode Cloud clones
the repo and before it builds. It installs Node, runs `npm ci`, copies the
web app in with `copy-web.js`, and runs `cap sync ios`.

Without it the build fails on a missing `Pods` directory — or, worse,
succeeds and ships an empty WebView, because `App/App/public` is generated
and git-ignored.

It lives beside the `.xcodeproj` rather than at the repository root, because
that is where Xcode Cloud looks.

`native/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` is the
other half, and it is easy to miss because a Mac supplies it silently.
**Xcode Cloud can only build a shared scheme.** Capacitor's generated project
has none: the `App` scheme Xcode writes on first open lives in `xcuserdata/`,
which the template git-ignores, so a clean checkout offers Xcode Cloud
nothing to select and the workflow cannot be saved. On a Mac this is one tick
in Manage Schemes. Here it is written out by hand, and its
`BlueprintIdentifier` is the `App` target's UUID out of `project.pbxproj` — if
that project is ever regenerated from scratch, the UUID changes and the
scheme has to follow it.

`ITSAppUsesNonExemptEncryption` is set to `false` in `Info.plist`. The app's
only cryptography is HTTPS to Open-Meteo, which is exempt. Leaving the key
out does not mean "no" — it means every upload parks in Processing until the
export-compliance question is answered by hand in App Store Connect.

### The one thing that still needs a value from you

`DEVELOPMENT_TEAM` is not set in `project.pbxproj`. Signing is already
`Automatic`, and Xcode Cloud issues the certificate and profile itself, but
`xcodebuild archive` refuses to run without a team id — *Signing for "App"
requires a development team.* The id is the ten-character string at
developer.apple.com → Account → Membership details. It is not a secret; it
appears in every provisioning profile and is safe to commit.

### Setting it up

1. **App Store Connect → your app → Xcode Cloud** (the tab beside
   Distribution and TestFlight).
2. Grant access to `Kintukka2/mobile-plant` when prompted.
3. **Product**: the `App` scheme. **Workspace**: `native/ios/App/App.xcworkspace`.
   If the scheme does not appear in that menu, the shared scheme above is
   missing or its UUID no longer matches the target.
4. **Start condition**: a branch change on `main`.
5. **Action**: Archive, destination **iOS**.
6. **Post-action**: TestFlight (Internal Testing).
7. Save and run it once by hand.

The first build is the one that fails. Read the log from the top: almost
every first failure is in `ci_post_clone.sh`, not in the app.

---

## Route B — GitHub Actions (fallback)

Only if Xcode Cloud will not fit. It works, and it is free on this
repository because public repositories get macOS runner minutes at no cost,
but it puts the whole signing apparatus back on you.

You would need, once:

- **A distribution certificate**, which can be made without a Mac. Generate
  a key and a CSR with `openssl`, upload the CSR at
  developer.apple.com → Certificates, download the `.cer`, and convert the
  pair to a `.p12`. Git Bash on Windows has `openssl`.
- **A provisioning profile** — App Store distribution, for
  `com.sproutevergreen.app`, signed by that certificate.
- **An App Store Connect API key** — Users and Access → Integrations, with
  the App Manager role. The `.p8` downloads exactly once.
- **Four GitHub secrets**: the base64 of the `.p12`, its password, the
  base64 of the profile, and the base64 of the `.p8` plus its key and issuer
  ids.

The workflow itself is the easy part; it is those four artefacts, and the
fact that each expires on its own schedule, that make this the second
choice.

---

## Before either route produces anything submittable

App Store Connect gates a build behind metadata, the same way Play does.

| Section | Where the answer lives |
| --- | --- |
| Name, subtitle, description, keywords | `native/store-listing.md` |
| App Privacy | `native/store-privacy.md` § Apple |
| Privacy policy URL | `https://sproutevergreen.com/privacy` |
| Support URL | `https://sproutevergreen.com` |
| Category | Lifestyle, primary; Reference, secondary |
| Age rating | 4+ — every question in Apple's questionnaire answers None or No |
| Pricing | Free |

Two Apple-specific traps:

- **The app icon must have no alpha channel.** App Store Connect rejects a
  transparent icon at upload, after the archive has already been built.
  `native/make-icons.js` flattens it; do not replace the icon by hand
  without doing the same.
- **EU trader status.** Without it the app cannot be distributed in the EU
  at all. App Store Connect → Business.

Screenshots are a separate job: Apple wants 6.7" and 6.5" iPhone sizes, and
they must be captured on an Apple device or simulator. The Android set
cannot be reused.

---

## What in here has not been verified

Everything. This file was written on Linux, in a sandbox with no macOS, no
Xcode, no Apple SDK, and no network route to Apple's hosts.

`ci_post_clone.sh` is shell-syntax checked and nothing more. Its logic
follows the same sequence as `prepare-ios.command`, which is known to work
on a real Mac, but no one has run it under Xcode Cloud.

Expect the first build to fail. That is the normal cost of a CI setup nobody
could dry-run, not a sign the approach is wrong.
