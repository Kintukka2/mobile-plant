"""Builds the pocket-card page from cards.html: inlines the app's own font
files, the corner cut-out of Sprout and a QR code for sproutevergreen.com.

    python3 marketing/cards/build.py      # needs: pip install segno

Writes build/sprout-pocket-cards.html (the page published as the artifact)
and build/preview.html (the same page in a document skeleton, for Chrome)."""
import base64, os, segno

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
BUILD = os.path.join(HERE, 'build')

def b64(path):
    return base64.b64encode(open(os.path.join(ROOT, path), 'rb').read()).decode()

def qr_svg():
    q = segno.make('https://sproutevergreen.com', error='h')
    m = [list(r) for r in q.matrix]; n = len(m)
    finders = [(0, 0), (n - 7, 0), (0, n - 7)]
    in_finder = lambda x, y: any(fx <= x < fx + 7 and fy <= y < fy + 7 for fx, fy in finders)
    parts = []
    for y in range(n):
        for x in range(n):
            # The 7 x 7 centre is left clear for the mark; level H recovers 30%.
            if not m[y][x] or in_finder(x, y) or (13 <= x <= 19 and 13 <= y <= 19): continue
            parts.append(f'<rect x="{x+.07:.2f}" y="{y+.07:.2f}" width=".86" height=".86" rx=".28"/>')
    for fx, fy in finders:
        # Square finders, drawn as one solid ring each: rounded ones broke decoding.
        parts.append(f'<path fill-rule="evenodd" d="M{fx} {fy}h7v7h-7ZM{fx+1} {fy+1}v5h5v-5Z"/>')
        parts.append(f'<rect x="{fx+2}" y="{fy+2}" width="3" height="3"/>')
    mark = ('<svg x="13.5" y="13.5" width="6" height="6" viewBox="22 18 56 72" fill="none" stroke="#1F6B4C" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M50 84V40"/><path d="M50 58C36 58 28 49 28 36c14 0 22 9 22 22Z"/><path d="M50 46c14 0 22-9 22-22-14 0-22 9-22 22Z"/></svg>')
    return (f'<svg viewBox="0 0 {n} {n}" fill="currentColor" style="color:var(--qr-ink)" shape-rendering="geometricPrecision" role="img" aria-label="QR code for sproutevergreen.com">'
            + ''.join(parts) + mark + '</svg>')

if __name__ == '__main__':
    s = open(os.path.join(HERE, 'cards.html')).read()
    for key, val in {
        'HATTON200': b64('css/fonts/hatton-ultralight.woff2'), 'HATTON500': b64('css/fonts/hatton-medium.woff2'),
        'CORM': b64('css/fonts/cormorant-var.woff2'), 'CORMI': b64('css/fonts/cormorant-var-italic.woff2'),
        'JOST': b64('css/fonts/jost-var.woff2'), 'SACR': b64('css/fonts/sacramento-400.woff2'),
        'BUDDY': b64('site/img/sprout-corner.webp'), 'QR': qr_svg(),
    }.items():
        s = s.replace('{{' + key + '}}', val)
    assert '{{' not in s
    os.makedirs(BUILD, exist_ok=True)
    open(os.path.join(BUILD, 'sprout-pocket-cards.html'), 'w').write(s)
    open(os.path.join(BUILD, 'preview.html'), 'w').write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + s + '</body></html>')
    print(os.path.join(BUILD, 'sprout-pocket-cards.html'))
