# The store wrapper

Sprout ships to the App Store and Google Play as a thin native shell around
the web app in the directory above. The shell exists for one reason:
**reminders**.

The web has no way to schedule a notification on the device for later, so a
morning reminder needs either a push service with a server behind it or a
native shell using the operating system's own scheduler. Sprout takes the
second, which means there is no server, no account, no subscription
endpoint and nothing to explain about where your data went. The browser
version stays as the try-before-you-install one and says plainly that
scheduled reminders come with the app.

## The app keeps its no-build-step rule

Nothing here changes that. The web app is still classic script tags and no
dependencies; `copy-web.js` copies the shipped files into `www/` and
Capacitor bundles that. The build step belongs to the wrapper, not to
Sprout, and nothing in `www/` is ever read by the web version.

Adding a `js/**.js` file to the app already means editing `index.html` and
the `ASSETS` array in `../sw.js`. It does **not** mean editing anything
here: `copy-web.js` copies the `css` and `js` directories whole, then
checks that every script `index.html` asks for actually arrived and throws
if one did not.

## The identifier is permanent

`appId` in `capacitor.config.json` is `com.sproutevergreen.app`, and it is
already stamped into both platform projects. **Do not change it.** Google
Play locks the application id at the first upload and it can never be
renamed afterwards — a different id is a different listing with no reviews
and no installs. Apple's bundle id is equally fixed once the App Store
Connect record exists.

The reverse-DNS form is a convention, not an ownership check: neither store
verifies the domain. `sproutevergreen.com` was registered anyway, because
the store listings and the try-before-you-install build need somewhere to
point.

The name matters as much as the id. There are already several plant-care
apps called some variant of Sprout on the App Store, at least one of them
close enough in description to draw a confusingly-similar-name rejection,
which is why the listing leads with the full wordmark from the splash
rather than the bare word.

## Both platform projects are committed

`ios/` and `android/` are in the repository, which is Capacitor's own
recommendation and not the default this wrapper started with. Capacitor can
regenerate them, but not everything in them: the Android notification icon,
the app icons, the signing config and any `Info.plist` entry are hand-made
and live nowhere else. While those directories were ignored, the first
`cap add` on another machine would silently have thrown all of it away.

Each platform directory carries its own `.gitignore` from the Capacitor
template, and those cover the parts that genuinely are generated — build
output, `Pods`, `DerivedData`, the copied web assets and the generated
`capacitor.config.json`. So there is no `cap add` step any more.

## Working on it

```bash
cd native
npm install        # once per checkout
npm run ios        # copy, sync, open Xcode
npm run android    # copy, sync, open Android Studio
```

`npm run sync` on its own does the copy and the Capacitor sync without
opening anything. On a Mac the first `sync` also runs `pod install`, which
is the step that was skipped when these projects were scaffolded on Linux.

## How reminders actually work here

`../js/notify.js` already builds the digest: one finished sentence per day
for the next month, worked out from the same schedule the rest of the app
uses. On the shell it hands that list to `@capacitor/local-notifications`,
which gives it to the OS. From then on the notifications fire whether the
app is running or not, with no network involved.

The schedule is rebuilt whenever anything is saved and again whenever the
app comes back to the foreground, because a week away moves every due date.
Rescheduling replaces rather than stacks: a notification's id is its own
date, so the same morning can only ever hold one.

Two platform limits shaped the code, both handled in `notify.js`:

| Limit | What it means here |
| --- | --- |
| iOS keeps 60 pending notifications | The month-long horizon is capped below that |
| Android 13 asks at runtime | The Profile toggle asks, never the app on its own |

Timing is deliberately inexact. A reminder wants to arrive in the morning,
not at 8:00:00, and exact alarms cost an extra Android permission that this
does not need.

## Still to do before a first submission

- **The icons are Capacitor's placeholders.** Everything in
  `ios/App/App/Assets.xcassets` and `android/app/src/main/res/mipmap-*` is
  still the stock Capacitor logo. Sprout's mark is the three paths in
  `../index.html`, drawn at 5% stroke on `#0A1410`.
- **Android needs a separate notification icon**, which is not the app
  icon: a white-on-transparent silhouette at
  `android/app/src/main/res/drawable/ic_stat_sprout.png`, then named in
  `capacitor.config.json` under `plugins.LocalNotifications.smallIcon`.
  Without one, Android draws a grey square. `iconColor` is already set to
  the brand green.
- **Signing.** An upload key for Play and a distribution certificate for
  Apple. Neither belongs in the repository; Play App Signing holds the
  release key for you.

## Things worth knowing

- **Apple's privacy label is "no data collected".** That is true, and it is
  worth keeping true.
- **The service worker may not register in the shell.** It does not matter.
  Caching is what it is for, and in a native app every file is already on
  the device. `registerSW()` in `../js/app.js` already gives up quietly when
  the scheme is not http or https.
- **Capacitor 7 is current** as of this writing; `npm install` resolved
  7.6.9. Check for a newer major before the first store build, since a
  major bump is easier before there is a release to regress.
