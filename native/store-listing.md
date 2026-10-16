# Play Store listing

Copy ready to paste, with the character limits that matter. Everything here
describes what the code actually does — the claims are the same ones
`native/store-privacy.md` makes to the Data safety form, deliberately, so a
reviewer reading both finds one story.

## App name — 29 / 30

```
Sprout Evergreen — Plant Care
```

Brand first, then the words a stranger types. There are already several
plant apps called some variant of Sprout, so the second word is doing real
work; "Plant Care" is what makes the listing findable at all.

## Short description — 79 / 80

```
Plant care and watering reminders worked out from your pots, light and weather.
```

Play shows this under the title and weights it for ranking, alongside the
name. "Plant care" is already in the name, so this line spends its
characters on the next search term, "watering reminders", and still says
what makes Sprout different: the schedule comes from the pot, the light
and the weather. Live since 12 October 2026. The previous line, "Plant care
schedules built from real species data, your pots, weather, and home.", is
the one to run against it in a Store listing experiment.

## Full description — 2,744 / 4,000

```
Most plant apps ask how often you want reminding. Sprout works it out.

A houseplant companion that sets plant care and watering reminders for each plant, from what it is and where it lives. Free, with no account, no ads and no subscription.

Every plant care schedule starts from care data for the species you own: warm and cool season watering intervals, a feeding cycle, ideal light and toxicity for some of the most common houseplants. Sprout then adjusts it for where each plant lives: pot size and material, drainage, how bright the room is, which way the window faces and the season where you live. A Monstera in a 24cm terracotta pot by a bright window dries out faster than one in a plastic pot in a dim corner, so it is watered sooner. Every schedule comes with the reason behind it.

<b>Watering that follows the weather</b>
Set a location and Sprout reads the local forecast. Before a hot, dry week it offers to water two days sooner, and before a cool, wet spell two days later. You approve every change.

<b>Draw your home, find the light</b>
Group plants into rooms, or trace your floor plan, mark the windows and point north. Sprout works out which rooms are bright, which are dim and which borrow light through a doorway, then shows where each plant should stand and tells you when one is in the wrong light.

<b>A plant doctor for when something looks wrong</b>
Yellow leaves, brown tips, drooping, sudden leaf drop, fungus gnats. Pick the symptom, answer a few questions about what else you are seeing, and Sprout ranks the likely causes, weighted by what your species is prone to. Each cause comes with clear steps for what to do about it.

<b>Pet safe plants, stated plainly</b>
Tell Sprout you have cats or dogs and it flags what is toxic to them. Every plant is rated separately for cats, dogs and people, because the same plant is not equally risky to each. One tap in Discover shows the ones safe for both.

<b>Find plants that suit your rooms</b>
Browse the plant library with photos, care needs and toxicity for every species, and see which plants suit the light in your rooms.

<b>A plant care journal worth keeping</b>
Every plant gets a diary and a growth chart: photos, measurements, repotting, problems and milestones. Propagation guides show how to grow new plants from the ones you have.

<b>One reminder, only when it matters</b>
At most one notification a day, and only on days something is due.

<b>Private by design</b>
No sign-up, no analytics and no server of Sprout's own. Your plants, photos, diary and schedule live on your phone and are never uploaded. The only thing that leaves is an approximate location, rounded to about a kilometre, sent to the weather service for your forecast.

Works offline.
```

Rewritten on 12 October 2026 after a brand, store-search and competitor
review. What changed, and why:

- **Free comes first.** The category leaders keep reminders and diagnosis
  behind subscriptions; Sprout has no purchases at all, so it is in the
  second paragraph, not left to be discovered.
- **Search terms, used naturally.** Plant care, watering, houseplant,
  reminders, toxic and light each appear two to five times. More than that
  reads as keyword stuffing, which Play counts against a listing.
- **Bold headings in sentence case** instead of capitals. Play allows `<b>`
  in the full description and discourages heavy capitalisation.
- **No counts.** The species list and the diagnosis tables grow, so like
  the site the listing states neither.
- **Only what the app does.** Cats and dogs, not "other pets", because those
  are the two it tracks. "Every schedule", not "every number", comes with a
  reason. Propagation is "from the ones you have", because not every species
  propagates from cuttings. No plant identification by photo, which Sprout
  does not do.
- **Never name a competitor.** Play's policy forbids it; "Most plant apps"
  is as far as the contrast goes.

The privacy section is unchanged in substance and must keep saying exactly
what `native/store-privacy.md`, `site/privacy.html`, `README.md` and
`CLAUDE.md` say about what leaves the device.

## Screenshots

In `store-assets/listing`, generated by `marketing/store-shots/` (its
README has the commands): a headline over a real screen in a drawn phone.
Real screens, not mockups. What is in the phone is what the app draws.

- **Upload set `a`** from `listing/a/android-phone/`, in file order:
  Today, Greenhouse, the plan, a plant, Discover, Diagnose, All caught up.
- **Sets `b` and `c`** are for store listing experiments against `a`:
  `b` leads with privacy, `c` lifts one card off each screen.
- **`listing/a/tablet/`** is Set A in landscape at 2560×1440, showing the
  app's wide layout. Upload the same seven to both the 7-inch and the
  10-inch tablet sections; the size suits both.
- **`listing/*/ios-6.9/`** is the same sets at 1320×2868, for the App
  Store when Sprout is there.
- `listing/overview.jpg` shows every set side by side, for review only.

JPEG, which both stores accept, with no alpha channel: Play rejects alpha
in a PNG. Play wants a minimum of two and allows eight, every side between
320 and 3840, and the long side no more than twice the short.

The plan is generated now too. The old note that it had to come off a
phone dates from when headless Chrome could not click the HOME toggle;
Playwright can.

The feature graphic, `store-assets/play-feature-graphic-1024x500.png`,
is the lockup and one line, "Houseplant care, worked out for your home",
beside the plant page in the same phone. It renders with the screenshots.

## Promo video

```
https://www.youtube.com/watch?v=E8N01OwKGOE
```

Public on YouTube since 12 October 2026, embedding on, not made for kids,
with the English subtitles from `marketing/reels/promo-landscape.en-GB.srt`.
It is `marketing/reels/promo-landscape.mp4`, made in `marketing/reels/promo/`
for this slot (its README has how). Play takes it in the Graphics section of
the main store listing, as a YouTube link only; replace the video on
YouTube and this link has to change with it.

## Category and tags

- **Category** — Lifestyle. House & Home is the alternative; Lifestyle is
  where the established plant apps sit, so it is where people browse.
- **Tags** — **House & home** and **Lifestyle**, and nothing else. Play's tag
  list is a fixed taxonomy with no entry for gardening or plants, so the five
  obvious ones cannot be typed in. Two true tags beat five vague ones:
  Weather in particular looks tempting and is wrong, because someone browsing
  it wants a forecast app and bounces. Tags feed category browsing and
  recommendations, not text search — the title and descriptions carry the
  search words, so nothing is lost here.
- **Contact email** — `kintukka.developer@gmail.com`. It is published on the
  listing and on the privacy page, which is why it is an address made for
  this rather than a personal or work one. If it ever starts collecting
  scraped spam, point a `hello@sproutevergreen.com` alias at it with
  Cloudflare Email Routing and change the three places it appears — both
  pages in `site/` and this line.
- **Website** — `https://sproutevergreen.com`
- **Privacy policy** — `https://sproutevergreen.com/privacy`, which is
  the page in this repository at `site/privacy.html`. It has to be live before
  the listing can be submitted.

## Before the bundle will upload

Three things Play rejects at upload or at **Preview and confirm**, after the bundle has
already built and uploaded. None is caught by Gradle, Android Studio or
anything local, so they cost a full rebuild each time.

- **Target API level.** Play refuses a new app below the current floor —
  36 as of the first submission, and it rises roughly every August. The
  Capacitor template pins whatever was current when it was generated, so
  check `native/android/variables.gradle` before building rather than after.
- **Minimum SDK.** Play automatic protection, one of the enhancements Play
  Console switches on, needs `minSdkVersion` 24 or higher. The Capacitor
  template pins 23, and the 1.3 upload was refused for it ("requires a
  minimum SDK version of 24 or higher"). It is 24 in
  `native/android/variables.gradle` now; leave it there or above.
- **Version code.** Play keeps a version code once a bundle carrying it has
  been uploaded, even to a draft release that is then discarded. Bump
  `versionCode` in `native/android/app/build.gradle` for every upload
  attempt, not every successful one.

A third is only a warning and can be ignored: "no deobfuscation file
associated with this App Bundle". It applies to obfuscated builds and
`minifyEnabled` is false, so there is nothing to deobfuscate.

## Content rating questionnaire

Play uses IARC. Answer **no** to all of: violence, sexuality, profanity,
controlled substances, gambling, simulated gambling, user interaction,
sharing location with other users, personal information sharing, digital
purchases. There is no user-generated content and no way for users to
contact each other, so the whole interactive block is no.

Expected outcome: **Everyone / PEGI 3 / rated for all ages.**

## Target audience and content

- **Target age** — tick **13-15, 16-17 and 18 and over**. Keep every under-13
  box unticked: ticking one pulls the listing into the Designed for Families
  programme and a much heavier policy review for no benefit. Do not tick 18+
  alone either — Play warns on that page that an adults-only audience lets it
  apply availability restrictions, and there is nothing in a plant tracker
  that needs them.
- **Ads** — **No**, the app contains no ads. This is asked separately from
  Data safety and is checked against the binary.
- **App access** — all functionality is available without an account. Say so;
  leave the credentials fields empty.
- **Government app** — no. **Financial features** — none. **Health** — no,
  the app makes no health claims about people.

## App Store

The same story for Apple, which differs in three ways: the description
is plain text (no `<b>`, which App Store Connect would show literally),
there is a 170-character promotional text above it that can change
without a review, and keywords are their own field. Sprout runs on iPad
as well, so "your device", never "your phone", wherever the copy says
where things live.

**Subtitle — 30 / 30:** `Plant care that fits your home`

**Promotional text — 121 / 170:**

```
Watering reminders worked out from your pots, light and local weather. Free, with no account, no ads and no subscription.
```

**Keywords — 97 / 100**, comma-separated with no spaces, and none
repeating a word already in the name or subtitle (Apple indexes those
anyway):

```
houseplant,watering,reminder,succulent,monstera,fern,indoor,garden,schedule,repot,soil,light,pets
```

**Description:**

```
Most plant apps ask how often you want reminding. Sprout works it out.

A houseplant companion that sets plant care and watering reminders for each plant, from what it is and where it lives. Free, with no account, no ads and no subscription.

Every plant care schedule starts from care data for the species you own: warm and cool season watering intervals, a feeding cycle, ideal light and toxicity for some of the most common houseplants. Sprout then adjusts it for where each plant lives: pot size and material, drainage, how bright the room is, which way the window faces and the season where you live. A Monstera in a 24cm terracotta pot by a bright window dries out faster than one in a plastic pot in a dim corner, so it is watered sooner. Every schedule comes with the reason behind it.

WATERING THAT FOLLOWS THE WEATHER
Set a location and Sprout reads the local forecast. Before a hot, dry week it offers to water two days sooner, and before a cool, wet spell two days later. You approve every change.

DRAW YOUR HOME, FIND THE LIGHT
Group plants into rooms, or trace your floor plan, mark the windows and point north. Sprout works out which rooms are bright, which are dim and which borrow light through a doorway, then shows where each plant should stand and tells you when one is in the wrong light.

A PLANT DOCTOR FOR WHEN SOMETHING LOOKS WRONG
Yellow leaves, brown tips, drooping, sudden leaf drop, fungus gnats. Pick the symptom, answer a few questions about what else you are seeing, and Sprout ranks the likely causes, weighted by what your species is prone to. Each cause comes with clear steps for what to do about it.

PET SAFE PLANTS, STATED PLAINLY
Tell Sprout you have cats or dogs and it flags what is toxic to them. Every plant is rated separately for cats, dogs and people, because the same plant is not equally risky to each. One tap in Discover shows the ones safe for both.

FIND PLANTS THAT SUIT YOUR ROOMS
Browse the plant library with photos, care needs and toxicity for every species, and see which plants suit the light in your rooms.

A PLANT CARE JOURNAL WORTH KEEPING
Every plant gets a diary and a growth chart: photos, measurements, repotting, problems and milestones. Propagation guides show how to grow new plants from the ones you have.

ONE REMINDER, ONLY WHEN IT MATTERS
At most one notification a day, and only on days something is due. Reminders are scheduled on your device, with nothing sent from a server.

PRIVATE BY DESIGN
No sign-up, no analytics and no server of Sprout's own. Your plants, photos, diary and schedule live on your device and are never uploaded. The only thing that leaves is an approximate location, rounded to about a kilometre, sent to the weather service for your forecast.

Works offline.
```

Headings in capitals because plain text has no bold, and a capitalised
line is the convention App Store descriptions use for it. The 1.0 text
said "48 of the most common houseplants"; like the Play copy and the
site, this one states no count, because the list grows.

**Screenshots:**

- **iPhone 6.9"** from `listing/a/ios-6.9/`, all seven in file order.
  Every smaller iPhone size scales from it, which is why App Store
  Connect shows the medium display as "Using existing assets".
- **iPad 13"** from `listing/a/ios-ipad-13/`, the same seven at
  2752×2064 in the app's wide layout. The smaller iPads scale from it.
- **Header and Search Results**, on the version page's first tab:
  `store-assets/app-store-header-3840x1646.jpg` (the product page header,
  21:9: the app's splash widened, its wordmark over a row of lit
  conservatory arches, after the cabin windows of Apple's own example; a
  scene rather than screens, since the screenshots sit right under it) and
  `store-assets/app-store-search-3840x2560.jpg` (the search results asset,
  3:2). Both are optional; without the search asset, search shows the
  first screenshots instead. Neither may have an alpha channel.
