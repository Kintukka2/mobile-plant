# Pocket cards

Business-card-sized handouts for garden centres and plant shops. The front
asks a question every plant owner has felt; the back answers it in Sprout's
voice and hands over a QR code to sproutevergreen.com. Seven hooks, one card
each. Like the rest of `marketing/`, nothing in the app reads this folder.

## For the printer: `print/`

Four PDFs, 14 pages each, in the same order: card 1 front, card 1 back,
card 2 front, and so on. Each page is 96 × 61 mm: a 90 × 55 mm trim plus
3 mm bleed all round, with TrimBox and BleedBox set. All text is converted to
outlines, so no fonts are needed at the RIP.

| File | What it is |
| --- | --- |
| `sprout-cards-artwork-cmyk.pdf` | The ink. CMYK, ground runs to the bleed. The QR code is 100% K only. Nothing gold and nothing debossed is printed here. |
| `sprout-cards-foil-plate.pdf` | Champagne gold foil, as 100% black on white: the `?` or `.` ending each hook, and the "Scan to … →" line on each back. Foil goes on over the laminate. |
| `sprout-cards-deboss-plate.pdf` | Blind deboss, no ink, as 100% black: the leaf mark on each front and the large leaf on each back. Identical on all seven cards, so one die per side. The back leaf runs off the trim. |
| `sprout-cards-proof.pdf` | What the finished card should look like, with the trim drawn as a pink dashed line. For approval only, not for press. |

| Card | Hook | Answer |
| --- | --- | --- |
| 1 (pages 1–2) | Keep on *killing* your plants? | Let's keep them *alive.* |
| 2 (pages 3–4) | Keep *forgetting* to water your plants? | I'll *remember* for you. |
| 3 (pages 5–6) | A plant could be *poisonous* to your fur baby. | Know it's *safe* before it comes home. |
| 4 (pages 7–8) | Does your plant have yellow leaves *again*? | There's always a *reason.* Sometimes two. |
| 5 (pages 9–10) | Loving your plants to *death*? | Sometimes the answer is *wait.* |
| 6 (pages 11–12) | Is that corner too *dark* for your plant? | Let's find it some *light.* |
| 7 (pages 13–14) | Same watering routine all *winter*? | Your plants drink *less* when it's cold. |

### The job

- **Trim** 90 × 55 mm, 2.2 mm corner radius. Australian standard size.
- **Stock** 600 gsm triplex with a jade centre ply.
- **Finish** soft-touch matt laminate, both sides.
- **Ground** Viridium emerald, closest spot match Pantone 3435 C.
- **Foil** champagne gold, both sides. The back line is set at 7 pt, the
  smallest a foil block holds on tracked capitals.
- **Deboss** blind, both sides.

### Before the run

- **The CMYK conversion uses Ghostscript's default profile**, not the press's.
  Ask the printer to convert to their own profile, or proof against Pantone
  3435 C. Deep greens drift warm on press.
- **The files are plain PDF 1.6 with live transparency**, not PDF/X. Most
  printers' preflight handles that; if one asks for PDF/X-1a, they can
  flatten it on their side.
- **The hook is Hatton Ultralight at 6.3 mm.** Its hairlines are the first
  thing to break up on soft-touch laminate. Proof it on the real stock.
- **PP Hatton is a commercial face** (Pangram Pangram), and its licence has not
  been checked for print. See `css/fonts/LICENSES.md`. Outlining the text does
  not change what the licence allows.
- **Scan a printed proof** before ordering the run. Every QR code was decoded
  from the rendered files, but only on screen.

## Rebuilding

`cards.html` is the source. It holds the card design and copy as data
(`HOOKS`), with placeholders where the build inlines the app's own font
files and the QR code.

```bash
pip install segno pypdf                 # plus Chrome and Ghostscript
python3 marketing/cards/build.py        # → build/sprout-pocket-cards.html
python3 marketing/cards/print_build.py  # → print/*.pdf
```

`build/sprout-pocket-cards.html` is the interactive page (flip, every hook,
the print ticket) that was published as the review artifact. The print build
loads the same page with `window.SPROUT_PRINT` set, which lays each face out
at true size; change the copy in `HOOKS` and both follow. `CHROME` overrides
the browser path. `build/` is not committed.
