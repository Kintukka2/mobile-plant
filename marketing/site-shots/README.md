# Site screens

The phone screens on sproutevergreen.com, and its share card, made from the
app as it is now so the site never sells an older build than the one on Play.
Nothing in the app or the site reads this folder.

| File | What it makes |
| --- | --- |
| `capture.js` | Today, the plan, a plant page, a diagnosis and the greenhouse, at 390×844 ×3 |
| `og.html`, `og.js` | `site/img/og.jpg`, the 1200×630 card a shared link unfurls into |

The greenhouse is the reels' (`marketing/reels/build/seed.js`), so every
marketing surface shows the same Daniel and the same six plants, with the
tour's sample flat drawn in as the plan. Its windows are placed so the plan
shows the light ladder rather than five rooms of direct sun, and the clock is
fixed so Today has a short list due.

## Rebuilding

```bash
node .claude/serve.js &
NODE_PATH=$(npm root -g) node marketing/site-shots/capture.js
python3 - <<'PY'
from PIL import Image
for f in ['today', 'plan', 'plant', 'diagnose']:
    im = Image.open(f'marketing/site-shots/{f}.png').convert('RGB').resize((720, 1558), Image.LANCZOS)
    im.save(f'site/img/screens/{f}.webp', quality=84, method=6)
PY
NODE_PATH=$(npm root -g) node marketing/site-shots/og.js
```

The full-size PNGs are ignored by git; `site/img/screens/` carries the
720px copies that ship, about 45KB each.
