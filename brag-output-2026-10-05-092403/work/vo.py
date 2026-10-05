# One voice for every reel: Sprout's, pinned in marketing/voice/ (the style
# vector itself, speed and language), so these lines match every other
# voiceover. The processing chain is applied later, in mix.sh. Writes one
# wav per line and vo-lines.json with each line's spoken length.
import json, os, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VD = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../marketing/voice')
sys.path.insert(0, VD); import say as pinned
VOICE = json.load(open(os.path.join(VD, 'voice.json')))
VEC = np.load(os.path.join(VD, VOICE['voiceFile']))
k = Kokoro(pinned.model(), pinned.voices_stub())
S = json.load(open('script.json')); out = {}
def say(name, text):
    a, sr = k.create(text, voice=VEC, speed=VOICE['speed'], lang=VOICE['lang'])
    # trim the model's own leading/trailing silence so timing is the voice's
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 2400]
    sf.write(f'vo/{name}.wav', a, sr); return round(len(a) / sr, 3)
os.makedirs('vo', exist_ok=True)
out['outro'] = [say(f'outro-{i}', l['say']) for i, l in enumerate(S['outro'])]
for id, r in S['reels'].items():
    out[id] = { 'hook': say(f'{id}-hook', r['hook']['say']), 'lines': [say(f'{id}-{i}', l['say']) for i, l in enumerate(r['lines'])] }
json.dump(out, open('vo-lines.json', 'w'), indent=1); print(json.dumps(out))
