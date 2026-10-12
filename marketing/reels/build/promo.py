"""Joins the landscape reels into Play's promo video: ../promo-landscape.mp4.

    LAND=1 node render.js <id>      (for each reel below, first)
    python3 promo.py

Play's store listing takes one YouTube video, and Google asks for 16:9, so
this is the Reels' landscape cut (stage.html?land) run back to back, about
a minute. Every reel but the last is cut as its phone drops away, before
its sign-off, so the sign-off is said once, at the end.

The sound is mixed here from the stems (vo/*.wav and music-<id>.wav), not
from the reels' finished mixes. Joining those meant four beds, each
normalised on its own, each cut through its payoff chord and bells, thrown
against the next inside half a second: every join was a hard cut. All four
beds are the same progression in the same key and tempo (audio.js), so each
one leaves on its Gmaj7, faded out before the payoff can sound, as the next
comes in on its opening D: one track, resolving where the reels resolve.
Voice and ducking are mix.sh's chain, run once over the whole promo, then
one loudness pass.

Writes ../promo-landscape.mp4 and ../promo-thumbnail.jpg (1280x720, for
YouTube's custom thumbnail).
"""
import json
import os
import subprocess
import wave

ORDER = ['schedule', 'planner', 'diagnose', 'pets']
FADE = 0.8        # the picture's dissolve
LEAD = 0.6        # the dissolve starts this long before the phone drops
BED_OUT = 1.0     # each outgoing bed's fade, ending just after its drop
R = json.load(open('reels.json'))
FF = os.environ.get('FFMPEG', 'ffmpeg')


def run(*a):
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)


def secs(path):
    with wave.open(path) as w:
        return w.getnframes() / w.getframerate()


last = len(ORDER) - 1
# Each reel up to its drop and the dissolve after it, the last one whole.
lens = [R[i]['duration'] if n == last else round(R[i]['drop'] - LEAD + FADE, 3)
        for n, i in enumerate(ORDER)]
starts = [0.0]
for d in lens[:-1]:
    starts.append(round(starts[-1] + d - FADE, 3))
total = round(starts[-1] + lens[-1], 3)

args, graph, k = [], [], 0


def inp(*a):
    global k
    args.extend(a)
    k += 1
    return k - 1


for n, (i, d) in enumerate(zip(ORDER, lens)):
    v = inp('-framerate', '30', '-t', str(d), '-i', f'frames-land-{i}/%04d.png')
    graph.append(f'[{v}:v]settb=AVTB,fps=30,format=yuv420p[v{n}]')

# Music: every bed but the last ends 0.1s after its drop, so the payoff
# chord's swell, the drop's breath and the bells at drop+0.3 never play
# mid-promo; the last plays whole and its payoff closes the film. The next
# bed needs no fade of its own: it opens by swelling up over its first 0.4s
# (audio.js), and the dissolve starts it 0.6s before the drop so that swell
# lands under the outgoing fade rather than after it, which left a hole.
beds = []
for n, i in enumerate(ORDER):
    m = inp('-i', f'music-{i}.wav')
    chain = f'[{m}:a]aresample=48000'
    if n < last:
        end = round(R[i]['drop'] + 0.1, 3)
        chain += f',atrim=0:{end},afade=t=out:st={round(end - BED_OUT, 3)}:d={BED_OUT}:curve=qsin'
    ms = round(starts[n] * 1000)
    graph.append(f'{chain},adelay={ms}|{ms}[m{n}]')
    beds.append(f'[m{n}]')
graph.append(f'{"".join(beds)}amix=inputs={len(beds)}:normalize=0,apad=whole_dur={total}[bed]')

# Voice: each reel's lines at its own offset; the sign-off only from the last.
lines = []
for n, (i, d) in enumerate(zip(ORDER, lens)):
    for t, f in R[i]['vo']:
        if n < last and f.startswith('outro'):
            continue
        end = t + secs(f'vo/{f}.wav')
        assert end < d - FADE, f'{f} runs into the join ({end:.2f} > {d - FADE:.2f})'
        ms = round((starts[n] + t) * 1000)
        a = inp('-i', f'vo/{f}.wav')
        graph.append(f'[{a}:a]aresample=48000,adelay={ms}|{ms},pan=stereo|c0=c0|c1=c0[l{len(lines)}]')
        lines.append(f'[l{len(lines)}]')

# The same voice chain and ducking as mix.sh, once over the whole promo.
graph.append(f'{"".join(lines)}amix=inputs={len(lines)}:normalize=0,apad=whole_dur={total},highpass=f=85,'
             'equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3800:t=q:w=1.2:g=2,'
             'acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2,aecho=0.8:0.5:28:0.12,asplit=2[vo][key]')
graph.append('[bed]volume=-9dB[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=380[duck]')
graph.append('[vo][duck]amix=inputs=2:normalize=0:duration=longest,atrim=0:' + str(total) +
             ',loudnorm=I=-16:TP=-1.5:LRA=9[aout]')

v = 'v0'
for n in range(1, len(ORDER)):
    graph.append(f'[{v}][v{n}]xfade=transition=fade:duration={FADE}:offset={starts[n]}[vx{n}]')
    v = f'vx{n}'

run(*args, '-filter_complex', ';'.join(graph), '-map', f'[{v}]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '../promo-landscape.mp4')

# The thumbnail: the last reel's sign-off, lockup and store line both in.
f = round((R[ORDER[-1]]['outroAt'][1] + 1.2) * 30)
run('-i', f'frames-land-{ORDER[-1]}/{f:04d}.png', '-vf', 'scale=1280:720', '-q:v', '2', '../promo-thumbnail.jpg')
print('promo', total, 's; joins at', [round(s + FADE / 2, 2) for s in starts[1:]], dict(zip(ORDER, lens)))
