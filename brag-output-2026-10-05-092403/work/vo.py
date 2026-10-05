# One voice for all three reels: Kokoro af_heart, the same speed and the same
# processing, so the reels sound like one person. Writes one wav per line and
# vo-lines.json with each line's spoken length.
import json, numpy as np, soundfile as sf, sys
from kokoro_onnx import Kokoro
M = '/tmp/claude-0/tts/'
k = Kokoro(M + 'kokoro-v1.0.onnx', M + 'voices-v1.0.bin')
S = json.load(open('script.json')); out = {}
def say(name, text):
    a, sr = k.create(text, voice=S['voice'], speed=S['speed'], lang='en-us')
    # trim the model's own leading/trailing silence so timing is the voice's
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 2400]
    sf.write(f'vo/{name}.wav', a, sr); return round(len(a) / sr, 3)
import os; os.makedirs('vo', exist_ok=True)
out['outro'] = [say(f'outro-{i}', l['say']) for i, l in enumerate(S['outro'])]
for id, r in S['reels'].items():
    out[id] = { 'hook': say(f'{id}-hook', r['hook']['say']), 'lines': [say(f'{id}-{i}', l['say']) for i, l in enumerate(r['lines'])] }
json.dump(out, open('vo-lines.json', 'w'), indent=1); print(json.dumps(out))
