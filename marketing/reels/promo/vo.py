# Sprout's lines for the promo, in the pinned voice (marketing/voice/), dry:
# the processing chain is applied once over the whole film in mix.sh, as the
# reels do. Writes vo/<id>.wav and vo.json with each line's spoken length.
import json, os, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VD = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../voice')
sys.path.insert(0, VD); import say as pinned
VOICE = json.load(open(os.path.join(VD, 'voice.json')))
VEC = np.load(os.path.join(VD, VOICE['voiceFile']))
k = Kokoro(pinned.model(), pinned.voices_stub())
os.makedirs('vo', exist_ok=True); out = {}
for l in json.load(open('script.json'))['lines']:
    a, sr = k.create(l['say'], voice=VEC, speed=VOICE['speed'], lang=VOICE['lang'])
    # trim the model's own leading/trailing silence so timing is the voice's
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 2400]
    sf.write(f"vo/{l['id']}.wav", a, sr); out[l['id']] = round(len(a) / sr, 3)
json.dump(out, open('vo.json', 'w'), indent=1); print(json.dumps(out))
