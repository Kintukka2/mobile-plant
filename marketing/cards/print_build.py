"""Builds the press files from the card page: a proof, CMYK artwork, and
the foil and deboss plates, each 14 pages of 96 x 61 mm (90 x 55 + 3 mm bleed).

    python3 marketing/cards/build.py
    python3 marketing/cards/print_build.py      # needs Chrome, Ghostscript, pypdf

Writes the four PDFs to print/. CHROME overrides the browser path."""
import subprocess, sys, os, re
from pypdf import PdfWriter
from pypdf.generic import RectangleObject

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), 'print')
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
PAGE = open(os.path.join(HERE, 'sprout-pocket-cards.html')).read()
MM = 72 / 25.4

def chrome_pdf(mode, dst):
    html = os.path.join(HERE, 'print-%s.html' % mode)
    open(html, 'w').write('<!doctype html><html><head><meta charset="utf-8"></head><body>'
                          '<script>window.SPROUT_PRINT=%r;</script>' % mode + PAGE + '</body></html>')
    subprocess.run([CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                    '--virtual-time-budget=6000', '--print-to-pdf=' + dst, 'file://' + html],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)

def gs(src, dst, model):
    args = ['gs', '-q', '-o', dst, '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.6',
            '-dPDFSETTINGS=/prepress', '-dAutoRotatePages=/None',
            # Text to outlines: Chrome embeds the variable and CFF faces as
            # Type 3, which preflight rejects, and outlines need no font at the RIP.
            '-dNoOutputFonts']
    if model == 'cmyk':
        args += ['-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK']
    elif model is None:
        pass
    else:
        args += ['-sColorConversionStrategy=Gray', '-sProcessColorModel=DeviceGray']
    subprocess.run(args + [src], check=True, timeout=300)

# The default conversion turns pure black into a four-colour build of about
# 290% ink, which blurs 0.55 mm QR modules at the slightest misregistration.
# Anything that left Chrome as black is set back to black ink alone.
RICH_BLACK = re.compile(rb'(0?\.\d+|1) (0?\.\d+|1) (0?\.\d+|1) (0?\.\d+|1) ([kK])\b')
def k_only(data):
    def swap(m):
        c, mg, y, k = (float(m.group(i)) for i in range(1, 5))
        return b'0 0 0 1 ' + m.group(5) if c > .6 and mg > .55 and y > .55 and k > .75 else m.group(0)
    return RICH_BLACK.sub(swap, data)
def k_only_streams(page):
    seen = set()
    def walk(res):
        for name, ref in (res.get('/XObject') or {}).items():
            obj = ref.get_object()
            if id(obj) in seen or obj.get('/Subtype') != '/Form': continue
            seen.add(id(obj)); obj.set_data(k_only(obj.get_data()))
            if '/Resources' in obj: walk(obj['/Resources'])
    c = page.get_contents()
    if c is not None:
        c.set_data(k_only(c.get_data())); page.replace_contents(c)
    if '/Resources' in page: walk(page['/Resources'])

def boxes(src, dst, title, black=False):
    w = PdfWriter(clone_from=src)
    for page in w.pages:
        if black: k_only_streams(page); page.compress_content_streams()
        # The page is drawn at 100 x 65 mm because Chrome rounds its size. The
        # card sits 5 mm from the top-left corner, so the boxes are measured
        # from there, not centred on the rounded page.
        left = float(page.mediabox.left) + 5 * MM
        top = float(page.mediabox.top) - 5 * MM
        trim = [left, top - 55 * MM, left + 90 * MM, top]
        bleed = RectangleObject([trim[0] - 3 * MM, trim[1] - 3 * MM, trim[2] + 3 * MM, trim[3] + 3 * MM])
        page.mediabox = bleed; page.cropbox = bleed; page.bleedbox = bleed
        page.trimbox = RectangleObject(trim)
    w.add_metadata({'/Title': title, '/Author': 'Sprout'})
    w.write(dst)

jobs = [('proof', None, 'Sprout pocket cards - proof (not for press)', 'sprout-cards-proof.pdf'),
        ('art', 'cmyk', 'Sprout pocket cards - CMYK artwork', 'sprout-cards-artwork-cmyk.pdf'),
        ('foil', 'gray', 'Sprout pocket cards - foil plate (champagne gold)', 'sprout-cards-foil-plate.pdf'),
        ('deboss', 'gray', 'Sprout pocket cards - blind deboss plate', 'sprout-cards-deboss-plate.pdf')]
for mode, model, title, name in jobs:
    raw = os.path.join(HERE, 'raw-%s.pdf' % mode)
    chrome_pdf(mode, raw)
    src = raw
    if mode == 'proof':
        conv = os.path.join(HERE, 'conv-proof.pdf'); gs(raw, conv, None); src = conv
    elif model:
        conv = os.path.join(HERE, 'conv-%s.pdf' % mode); gs(raw, conv, model); src = conv
    boxes(src, os.path.join(OUT, name), title, black=(model == 'cmyk'))
    print(name)
