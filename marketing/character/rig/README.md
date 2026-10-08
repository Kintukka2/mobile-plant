# Sprout, rigged

The base pose taken apart so Sprout can move: walk, sit on a ledge, swing
its leaf arms, land in a corner. Every other file in `marketing/character/`
is a finished picture on its own ground. These are cut-outs with transparent
backgrounds, meant to be put back together on whatever surface needs them.

| File | What it is |
| --- | --- |
| `sprout-sitting.png` | The finished sitting pose: arms at rest, legs dangling, rounded bottom. 928 × 1414, transparent |
| `sprout-sitting.webp` | The same at the web cut-out's scale (551 × 840), for a page to use directly |
| `body.png` | Head and torso, 937 × 1212. The frame every other part is placed in |
| `arm-left.png`, `arm-right.png` | The two leaf arms, cropped, placed at `parts.*.at` in `rig.json` |
| `leg.png` | One leg and foot, hanging straight down from its pivot. Used twice |
| `rig.json` | Where each part sits, what it turns about, the draw order and the sitting pose |
| `build-rig.py` | Rebuilds all of the above from `../sprout-base.png` (numpy and Pillow) |

## Where it came from, and what is not the designer's

The frame is `sprout-base.png` with its ground keyed out and cropped exactly
as `site/img/sprout-corner.webp` is, at the original's full resolution. Two
things in here were not drawn by the designer:

- **The chest behind the arms.** In the original the arms cover it, so
  there was nothing there to cut out. It is painted in: jade at the sides,
  the face's mint carried down into a belly. It only shows while an arm is
  turned away from rest.
- **The legs.** No image in the pack shows Sprout below the arms. The legs
  are drawn in the arms' own jade to fit the character; a designer-drawn
  pair would replace `leg.png` without changing anything else.

With both arms at angle 0 the parts stack back into the original pixel for
pixel, which is what lets an animation end on the site's corner image.

## Putting it together

Draw in this order, all in the `frame`'s coordinates: the two legs (at
`hips`, rotated about the leg's `pivot`), the body, `arm-right`, then
`arm-left`. The left arm overlaps the right; the shadow at the seam is the
left one's. Angles are radians, clockwise positive, as canvas `rotate()`
takes them. A standing or sitting figure clips body and arms to a bottom
rounded at `bottomRadius`, which hides the flat crop; the corner placement
uses no rounding and no legs.

The loading-screen prototype is the working example: arms swing against
the legs on a walk, flare on a jump and fold home before landing.

## Placing it

Same rule as the rest of the pack: a file being here does not put a face on
a screen. Giving the sitting pose a placement in the app is a decision under
brand guide Decision 13, and then it gets a 360 WebP in `img/sprout/`, an
entry in `SPROUT_POSES`, an ASSETS line and a `CACHE` bump like any other pose.
