# Sprout's voice

The voice from the voiced Reels (`brag-output-2026-10-05-092403/`): soft, feminine and a little
upbeat. Sprout speaking as itself, in the first person. `sample.m4a` is five seconds of it.

```bash
pip install kokoro-onnx soundfile          # plus ffmpeg on the path
python3 say.py "Hi, I'm Sprout." hello.wav
python3 say.py lines.txt out/              # one wav per non-empty line: out/01.wav, 02.wav…
```

The first run downloads the model (325MB) to `~/.cache/sprout-voice` and checks it against its
hash. `SPROUT_VOICE_CACHE` puts it somewhere else.

## Why it comes out the same every time

Kokoro has no randomness: the same model, voice, speed and text give the same audio. All four
are pinned here.

| What | Where | Pinned how |
| --- | --- | --- |
| The voice | `sprout-voice.npy` | Kokoro's `af_heart` style vector, committed as is (510×256 floats). Not looked up by name, so a re-released voice pack cannot change it. |
| The model | `voice.json` → `model` | Download URL and SHA-256. `say.py` refuses a file that does not match. |
| Speed and language | `voice.json` | 1.06, `en-us`. |
| The polish | `voice.json` → `chain` | The ffmpeg filters the Reels used on her: high-pass, a little presence, gentle compression, a very small room. |

Checked when this was set up: regenerating two of the Reels' lines from these files matched the
originals sample for sample (identical length, differing by no more than 16-bit rounding).

## Writing for her

She is Sprout, so the voice rules in `CLAUDE.md` apply: first person, one contraction per line,
"Sprout" only when introducing itself. What she says and what goes on screen are separate
strings in the Reels' `script.json`: punctuation steers her delivery (a trailing `!` lifts a line,
`...` slows one), while the caption keeps the house style. She says URLs best spelt out:
"sprout evergreen dot com".

Changing `speed` or `chain` changes the voice for everything made after. Keep both as they are
unless the change is meant to be permanent.
