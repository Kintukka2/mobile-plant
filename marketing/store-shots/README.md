# Store screenshots

The Google Play and App Store listing images and the Play feature graphic,
made from the app as it is now, so the listing never sells an older build
than the one on the store. Nothing in the app or the site reads this folder.

Each frame is a short headline over a real screen in a drawn phone, on the
reels' green ground. The layout came from a competitor's listing kit (a
final set plus A/B variants, both stores' sizes); the type, colour, ground
and voice are Sprout's own.

| File | What it does |
| --- | --- |
| `capture.js` | Photographs seven app screens at 390×844 ×3 into `raw/`, plus the cards the lifted set floats over the frame |
| `sets.js` | Every frame's copy and layout, three sets |
| `frame.html` | Draws one frame at any size from the query string, e.g. `frame.html?set=a&n=1&w=1080&h=1920` |
| `render.js` | Renders every frame of every set at both sizes, and the feature graphic |
| `flatten.py` | Strips alpha (Play rejects it), converts to JPEG, builds the overview sheet |

Output goes to `native/store-assets/listing/<set>/<size>/NN-<screen>.jpg`,
and `overview.jpg` beside them shows every set at a glance. The feature
graphic is `native/store-assets/play-feature-graphic-1024x500.png`, from
`native/store-assets/feature-graphic.html`.

## The sets

| Set | What it tests | Frames |
| --- | --- | --- |
| `a` Final | The listing itself: centred, calm, store order | 7 |
| `b` Private by design | Leading with what never leaves the phone, a subhead on each | 6 |
| `c` Lifted | Words left, the phone leaning in, one card lifted off the screen | 7 |

Upload `a` as the listing and run `b` and `c` as Play store listing
experiments against it.

| Size | Pixels | For |
| --- | --- | --- |
| `android-phone` | 1080×1920 | Google Play phone screenshots |
| `ios-6.9` | 1320×2868 | App Store 6.9" iPhone, the size the others scale from |

## Rules the copy keeps

- The voice rules in `CLAUDE.md`: British English, no exclamation marks,
  one contraction per line.
- **Sprout's face on openers only.** The corner cut-out
  (`site/img/sprout-corner.webp`) is on each set's first frame. The
  closers on Today show the app's own resting plate. Nothing goes beside
  care data, toxicity or a diagnosis: no face on any plant, Discover or
  Diagnose frame.
- **Every privacy line is true to `native/store-privacy.md`.** "Your plants
  stay on your phone" is safe because a location, the one thing that
  leaves, is not about the plants. Do not write "nothing leaves the
  phone".
- **The figures are the ones `.claude/check-species.js` holds the site
  to:** 48 species, 23 safe for both cats and dogs. Discover's "Pet safe"
  filter is the same test, so the screen and the headline agree.

## Rebuilding

```bash
node .claude/serve.js &
NODE_PATH=$(npm root -g) node marketing/store-shots/capture.js        # or name screens: capture.js plant today
NODE_PATH=$(npm root -g) node marketing/store-shots/render.js         # or one set and size: render.js c ios-6.9
```

The home is the site's (`marketing/site-shots/state.js`): the reels' six
plants in the tour's sample flat, north confirmed. The clock is fixed at
6 October 2026 in Sydney, so Today has four waterings due. Change a screen
in the app and both this and `marketing/site-shots/` need recapturing.

`raw/` is ignored by git and rebuilt by `capture.js`; the feature graphic
reads `raw/plant.png`, so capture before rendering it.
