"""Flattens every rendered PNG to 24-bit RGB and rebuilds overview.jpg.

Play rejects a screenshot with an alpha channel even when every pixel is
opaque, so each file is rewritten as RGB. The screenshots then go to JPEG
at quality 92 with no chroma subsampling, which both stores accept: as PNG
the forty of them came to 60MB, and at this setting the hairlines and the
ultralight headline survive with nothing visible lost. The feature graphic
stays PNG, being one small file. The overview lays every set
out in a row, the way the inspiration's A/B sheet did, for review rather
than for upload.

    python3 -I flatten.py <listing dir> <png> [<png> ...]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

out, files = sys.argv[1], sys.argv[2:]
for f in files:
    im = Image.open(f)
    if im.mode != 'RGB':
        bg = Image.new('RGB', im.size, (5, 10, 8))
        bg.paste(im, mask=im.convert('RGBA').split()[3])
        bg.save(f, optimize=True)
        im = bg
    if os.path.dirname(f).startswith(out):
        im.convert('RGB').save(f[:-4] + '.jpg', quality=92, subsampling=0, optimize=True)
        os.remove(f)

sets = sorted(d for d in os.listdir(out) if os.path.isdir(os.path.join(out, d)))
rows = []
for s in sets:
    d = os.path.join(out, s, 'android-phone')
    if os.path.isdir(d):
        rows.append((s, [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.endswith('.jpg')]))
if rows:
    TW, TH, GAP, LEFT, TOP = 270, 480, 24, 140, 40
    cols = max(len(r[1]) for r in rows)
    sheet = Image.new('RGB', (LEFT + cols * (TW + GAP) + GAP, TOP + len(rows) * (TH + GAP * 2)), (5, 10, 8))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('DejaVuSans.ttf', 40)
    except OSError:
        font = ImageFont.load_default()
    for r, (name, frames) in enumerate(rows):
        y = TOP + r * (TH + GAP * 2)
        draw.text((40, y + TH // 2 - 24), name.upper(), fill=(63, 190, 139), font=font)
        for c, f in enumerate(frames):
            sheet.paste(Image.open(f).convert('RGB').resize((TW, TH), Image.LANCZOS), (LEFT + c * (TW + GAP), y))
    sheet.save(os.path.join(out, 'overview.jpg'), quality=90, optimize=True)
    print('overview', sheet.size)
