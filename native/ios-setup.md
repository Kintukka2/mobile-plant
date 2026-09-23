# Getting Sprout onto the App Store

Written from a Windows machine, which is the constraint everything here
follows from: **Xcode only runs on macOS, and there is no way around that.**
No cross-compiler, no emulator, no workaround.

There are two ways to build without owning a Mac. **The first one does not
work from Windows, and this file used to recommend it.** That is recorded
below rather than deleted, because it is the obvious thing to reach for and
the reason it fails is not written down anywhere obvious.

`native/store-listing.md` and `native/store-privacy.md` hold the copy and the
privacy answers. This file is only the mechanics.

---

## Route A — Xcode Cloud (does not work without a Mac)

Apple's own CI. Everything about it looks like the right answer: it signs the
build itself, so there is no certificate to generate, no `.p12` to export, no
provisioning profile to download and no secrets to paste — the four things
where a Mac-less iOS setup normally dies. 25 compute hours a month come with
the developer programme, and a build of this app is a few minutes.

**Onboarding is Xcode-only, and there is no way around it.** Both pages that
ought to start it say *"Get started in Xcode"* and offer no button:

- App Store Connect → Xcode Cloud (the account-level tab)
- App Store Connect → the app → Xcode Cloud (`/apps/<id>/ci`)

The second one is the one that matters, because the documentation and most
third-party write-ups say workflows are configurable from the web — and they
are, *once one exists*. Creating the first one is what accepts the Xcode
Cloud terms and grants source-control access, and that flow lives in Xcode.
So the web UI manages Xcode Cloud; it cannot start it.

Worth re-testing if a Mac ever comes within reach for an hour, because the
repository is already set up for it: `ci_post_clone.sh`, the shared scheme
and the signing team are all committed and all of it is equally useful to
Route B.

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

`DEVELOPMENT_TEAM = 67UQU5992R` is set on both build configurations of the
`App` target. Signing stays `Automatic` and Xcode Cloud still issues the
certificate and profile itself, but `xcodebuild archive` refuses to run with
no team id at all — *Signing for "App" requires a development team.* The id
is not a secret: it is stamped into every provisioning profile the account
ever issues, which is why it lives in the project file rather than in a
build variable. It is the ten-character string on App Store Connect →
Users and Access → your user → Team ID, or at developer.apple.com →
Membership details. Do not confuse it with the Developer ID on the same
page, which is a UUID and is not what the build setting wants.

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

## Route B — GitHub Actions (in use)

`.github/workflows/ios.yml`. It builds on a macOS runner, signs, and uploads
to App Store Connect.

**Manual trigger only.** This repository is private, so macOS minutes are
billed at **ten times** the normal rate against the account's included
allowance. An earlier draft of this file claimed the runners were free
because public repositories get them at no cost — true, and irrelevant here.
Building on every push would spend a month's allowance in an afternoon, so
the workflow runs from the Actions tab when there is something to ship, with
a checkbox to build without uploading.

### Two artefacts, not four

The obvious version of this needs a certificate, a provisioning profile, an
API key and four secrets, each expiring on its own schedule. Two of those go
away: `-allowProvisioningUpdates` together with the API key lets `xcodebuild`
create and download the App Store provisioning profile itself, every run. A
profile generated by hand and stored as a secret is a thing that works for a
year and then stops without warning.

The certificate cannot go the same way, and the reason is worth writing down:
a runner is ephemeral, so with no certificate imported `xcodebuild` asks App
Store Connect for a **new** one on every build and hits the three-certificate
account limit within a few runs. Importing the same `.p12` each time is what
prevents that.

**1. A distribution certificate**, made without a Mac. In Git Bash:

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout dist.key -out dist.csr \
  -subj "/emailAddress=kintukka.developer@gmail.com/CN=Daniel Moreira/C=AU"
```

Upload `dist.csr` at developer.apple.com → Certificates → **+** → **Apple
Distribution**. Download the `.cer`, then:

```bash
openssl x509 -inform DER -in distribution.cer -out dist.pem
openssl pkcs12 -export -inkey dist.key -in dist.pem -out dist.p12
openssl base64 -A -in dist.p12 -out dist.p12.b64
```

Keep `dist.key` and `dist.p12` somewhere safe and off the repository. Losing
them costs one of the three certificate slots to replace.

**2. An App Store Connect API key** — App Store Connect → Users and Access →
Integrations → App Store Connect API → **+**, role **App Manager**. The `.p8`
downloads exactly once. Note the Key ID beside it and the Issuer ID above
the table.

### The five secrets

Settings → Secrets and variables → Actions → New repository secret.

| Secret | Value |
| --- | --- |
| `IOS_DIST_CERT_P12` | the contents of `dist.p12.b64` |
| `IOS_DIST_CERT_PASSWORD` | the export password chosen above |
| `APPSTORE_API_KEY_ID` | the ten-character Key ID |
| `APPSTORE_API_ISSUER_ID` | the Issuer ID, a UUID |
| `APPSTORE_API_PRIVATE_KEY` | the whole `.p8` file, `BEGIN`/`END` lines included |

### Build numbers

`CURRENT_PROJECT_VERSION` is overridden with the workflow run number rather
than committed. App Store Connect rejects a build number it has already
seen — including from a build that was deleted — and the run number is the
only counter here that never repeats. The marketing version stays as
`project.pbxproj` says.

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

`ios.yml` has had its YAML parsed and every `run:` block checked with
`bash -n`, and the heredoc that writes `ExportOptions.plist` was confirmed to
survive YAML's indentation stripping with its terminator at column 0. That is
the whole of it. No step has run on a macOS runner.

`ci_post_clone.sh` is shell-syntax checked and nothing more, and is now dead
weight unless Route A ever becomes reachable. Its logic follows the same
sequence as `prepare-ios.command`, which is known to work on a real Mac.

Expect the first build to fail. That is the normal cost of a CI setup nobody
could dry-run, not a sign the approach is wrong. The likely places, in order:
`npx cap sync ios`, the keychain import, and the first signing step.
