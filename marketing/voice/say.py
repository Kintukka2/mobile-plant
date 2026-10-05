# Speaks text in Sprout's voice: the one used in the voiced Reels.
#
#   python3 say.py "Hi, I'm Sprout." out.wav
#   python3 say.py lines.txt out-dir/          one wav per non-empty line
#
# The voice is pinned three ways, so it comes out the same next year: the
# style vector itself is committed (sprout-voice.npy, not looked up by name
# in a voice pack that can be re-released), the model is checked against its
# hash, and speed and the processing chain live in voice.json, not in here.
# Writes 48kHz mono WAV, dry of music, trimmed to the voice.
import hashlib, json, os, subprocess, sys, urllib.request
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(HERE, 'voice.json')))
CACHE = os.environ.get('SPROUT_VOICE_CACHE', os.path.expanduser('~/.cache/sprout-voice'))

def model():
    p = os.path.join(CACHE, V['model']['file'])
    if not os.path.exists(p):
        os.makedirs(CACHE, exist_ok=True)
        print('fetching', V['model']['url'], file=sys.stderr)
        urllib.request.urlretrieve(V['model']['url'], p + '.part'); os.rename(p + '.part', p)
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    if h != V['model']['sha256']:
        sys.exit(f'{p} is not the pinned model (sha256 {h}); delete it and run again')
    return p

def voices_stub():
    # kokoro-onnx insists on a voices file even when handed a vector; give it
    # a one-voice pack made from the pinned vector rather than the real one.
    p = os.path.join(CACHE, 'sprout-voices.npz')
    if not os.path.exists(p):
        np.savez(p, **{V['voice']: np.load(os.path.join(HERE, V['voiceFile']))})
    return p

def speak(k, text, out):
    a, sr = k.create(text, voice=np.load(os.path.join(HERE, V['voiceFile'])), speed=V['speed'], lang=V['lang'])
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 2400]
    raw = out + '.raw.wav'; sf.write(raw, a, sr)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af',
                    'aresample=48000,' + V['chain'], '-ar', '48000', out], check=True)
    os.remove(raw)
    print(f'{out}  {len(a) / sr:.2f}s  {text}')

if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__ or 'usage: say.py "text"|lines.txt out.wav|out-dir/')
    src, dst = sys.argv[1:]
    k = Kokoro(model(), voices_stub())
    if os.path.isfile(src):
        os.makedirs(dst, exist_ok=True)
        lines = [l.strip() for l in open(src) if l.strip()]
        for i, l in enumerate(lines, 1): speak(k, l, os.path.join(dst, f'{i:02d}.wav'))
    else:
        speak(k, src, dst)
