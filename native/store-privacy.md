# What to tell the stores

Both privacy forms get filled in once, under time pressure, months after the
code that decides the answers was written. This file is the answers, derived
from the code, with the place that proves each one — so submission is a copy
job rather than a memory test.

Re-read it whenever a network call is added. A form that drifts from the code
is the problem it exists to prevent.

## What actually leaves the device

| What | Where it goes | When | Proof |
| --- | --- | --- | --- |
| Coordinates, rounded to 2 places (~1.1km) | `geocoding-api.open-meteo.com` | Once, when the reader sets a location, to name the nearest town | `js/weather.js` → `locateMe()` |
| The same rounded coordinates | `api.open-meteo.com` | On each forecast refresh | `js/weather.js` → `fetchForecast()` |
| A place name the reader typed | `geocoding-api.open-meteo.com` | Only if they search for a city instead of using the device | `js/weather.js` → `searchPlace()` |

`locateMe()` rounds before it returns, so nothing at full precision is ever
stored or transmitted. Worst-case displacement at two decimal places is about
785 metres, which is inside a single forecast grid cell — the forecast is
identical, the hemisphere still reads off the sign, and the geocoder still
returns the same town.

Nothing accompanies those requests: no identifier, no account, no device
information beyond what any HTTPS request carries.

**What never leaves, at all:** plants, species, rooms, the floor plan, photos,
diary entries, growth measurements, the reader's name, their pets, their
experience level, the reminder schedule and the notification digest. Photos
are in `localStorage`; the digest is in IndexedDB. Neither has anywhere to go.

**There is no second origin any more.** The three typefaces that used to
load from Google Fonts — which handed Google an IP address and a user agent
on every cold start, for nothing — are self-hosted alongside PP Hatton as of
the store build. Open-Meteo is now the only host the app contacts at all,
which is what makes the tables below short.

## Apple — App Store Connect → App Privacy

**Do you or your third-party partners collect data from this app?** → **Yes**

One data type:

| Field | Answer |
| --- | --- |
| Category | Location → **Coarse Location** |
| Purpose | **App Functionality** |
| Linked to the user's identity | **No** |
| Used for tracking | **No** |

Every other category — Contact Info, Health, Financial, Contacts, User
Content, Identifiers, Usage Data, Diagnostics — is **not collected**.

Two answers worth understanding rather than copying blind:

- **Not "no data collected."** That was nearly declared here and would have
  been wrong. Coordinates going to a third party for a feature is collection,
  whether or not anything is kept. Apple allows some data to go undeclared,
  but the exemption is written around data the user types into your interface
  with obvious purpose, and a device-API location does not sit comfortably
  inside it.
- **Coarse, not Precise.** True only because of the rounding in `locateMe()`.
  If that rounding is ever removed, this answer becomes **Precise Location**.

`NSLocationWhenInUseUsageDescription` in `ios/App/App/Info.plist` is the
sentence shown in the permission dialog, and it matches the onboarding screen
on purpose — the reader meets the dialog one tap after reading it.

## Google Play — App content → Data safety

**Does your app collect or share any of the required user data types?** → **Yes**

| Field | Answer |
| --- | --- |
| Data type | Location → **Approximate location** |
| Collected | **Yes** |
| Shared | **Yes** — see the note below |
| Processed ephemerally | **Yes** |
| Required or optional | **Optional** — the app works without it and says so |
| Purpose | **App functionality** |

Everything else: **not collected, not shared**. On-device storage is not
collection under Play's definition, which is what makes photos, the diary and
the digest all "no" despite there being a lot of them.

Security section:

| Field | Answer |
| --- | --- |
| Encrypted in transit | **Yes** — both Open-Meteo endpoints are HTTPS |
| Users can request deletion | There is no account and no server copy. Uninstalling removes everything; Profile clears a saved location on demand. |

**The one genuine judgement call: "shared".** Play treats a transfer to a
third party as sharing, but exempts a service provider processing on your
behalf. Open-Meteo is a public API called to render a feature, which is
arguably that — but there is no processing agreement behind it, so the
defensible answer is the conservative one. **Declare it shared.** Over-
declaring costs a line on the listing. Under-declaring is an app removal,
and Play does not warn first.

## Before submitting

- Re-read the table at the top against `js/weather.js`. If a request was
  added, this file is stale.
- Both stores ask about children and ads. Sprout has no ads, no analytics,
  no SDKs beyond Capacitor and its two plugins, and is not aimed at children.
- Play asks for a privacy policy URL even when almost nothing is collected.
  `sproutevergreen.com/privacy` is the obvious home for it, and the tables
  above are most of the text.
