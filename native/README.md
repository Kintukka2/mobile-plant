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

## First time

```bash
cd native
npm install
npx cap add ios
npx cap add android
```

Set your own `appId` in `capacitor.config.json` before the first build. The
placeholder is `com.example.sprout`, which neither store will accept.

## Every time after that

```bash
npm run ios        # copy, sync, open Xcode
npm run android    # copy, sync, open Android Studio
```

`npm run sync` on its own does the copy and the Capacitor sync without
opening anything.

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

## Things worth knowing before the first submission

- **Apple's privacy label is "no data collected".** That is true, and it is
  worth keeping true.
- **The service worker may not register in the shell.** It does not matter.
  Caching is what it is for, and in a native app every file is already on
  the device. `registerSW()` in `../js/app.js` already gives up quietly when
  the scheme is not http or https.
- **Android needs a notification icon.** A white-on-transparent silhouette
  at `android/app/src/main/res/drawable/ic_stat_sprout.png`, then name it in
  `capacitor.config.json` under `plugins.LocalNotifications.smallIcon`.
  Without one, Android draws a grey square.
- **Check for a newer Capacitor major** before the first install. The
  versions in `package.json` were current when this was written.
