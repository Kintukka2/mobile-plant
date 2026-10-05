# script.json (words) + vo-lines.json (spoken lengths) + timeline.json (where
# each line is said) -> reels.json, the one file the stage, audio and mux read.
import json
S, V, T = (json.load(open(f)) for f in ('script.json', 'vo-lines.json', 'timeline.json'))
out = {}
for id, r in S['reels'].items():
    t = T[id]; ls = r['lines']
    out[id] = dict(eyebrow=r['eyebrow'], duration=t['duration'], hook=r['hook']['text'], hookAccent=r['hook'].get('accent', -1),
        hookAt=t['hookAt'], hookDur=V[id]['hook'], hookEnd=t['hookEnd'], phone=t['phone'], drop=t['drop'],
        captions=[[t['lineAt'][i], t['capEnd'][i], l['text'], 1 if l.get('accent') else 0] for i, l in enumerate(ls)],
        outro=[l['text'] for l in S['outro']], outroAt=t['outroAt'], poster=t['poster'],
        vo=[[t['hookAt'], f'{id}-hook']] + [[t['lineAt'][i], f'{id}-{i}'] for i in range(len(ls))] +
           [[t['outroAt'][i], f'outro-{i}'] for i in range(len(S['outro']))])
    # nothing spoken may run into the next line, or past the end
    vo = out[id]['vo']; lens = [V[id]['hook']] + V[id]['lines'] + V['outro']
    for i, (a, n) in enumerate(vo):
        end = a + lens[i]; nxt = vo[i + 1][0] if i + 1 < len(vo) else t['duration'] - 0.6
        assert end + 0.15 <= nxt, (id, n, round(end, 2), nxt)
json.dump(out, open('reels.json', 'w'), indent=1); print('ok', list(out))
