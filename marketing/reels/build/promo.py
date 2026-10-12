"""Joins the landscape reels into Play's promo video: ../promo-landscape.mp4.

    LAND=1 node render.js <id>      (for each reel below, first)
    python3 promo.py

Play's store listing takes one YouTube video, and Google asks for 16:9, so
this is the Reels' landscape cut (stage.html?land) run back to back, about
a minute. Every reel but the last is cut as its phone drops away, before
its sign-off, so the sign-off is said once, at the end; each joins the next
with a half-second dissolve, picture and sound together. The voice and
music come from each reel's own mix (mix.sh), so nothing is re-spoken.

Writes ../promo-landscape.mp4 and ../promo-thumbnail.jpg (1280x720, for
YouTube's custom thumbnail).
"""
import json
import os
import subprocess

ORDER = ['schedule', 'planner', 'diagnose', 'pets']
FADE = 0.5
R = json.load(open('reels.json'))
FF = os.environ.get('FFMPEG', 'ffmpeg')


def run(*a):
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)


# Each reel up to just after its phone has fallen away, the last one whole.
lens = [R[i]['duration'] if n == len(ORDER) - 1 else round(R[i]['drop'] + 0.35 + FADE, 3)
        for n, i in enumerate(ORDER)]

args, graph = [], []
for n, (i, d) in enumerate(zip(ORDER, lens)):
    args += ['-framerate', '30', '-t', str(d), '-i', f'frames-land-{i}/%04d.png']
    args += ['-t', str(d), '-i', f'mix-{i}.wav']
    graph.append(f'[{2 * n}:v]settb=AVTB,fps=30,format=yuv420p[v{n}];[{2 * n + 1}:a]aresample=48000[a{n}]')

v, a, t = 'v0', 'a0', lens[0]
for n in range(1, len(ORDER)):
    off = round(t - FADE, 3)
    graph.append(f'[{v}][v{n}]xfade=transition=fade:duration={FADE}:offset={off}[vx{n}]')
    graph.append(f'[{a}][a{n}]acrossfade=d={FADE}[ax{n}]')
    v, a, t = f'vx{n}', f'ax{n}', t + lens[n] - FADE
graph.append(f'[{a}]loudnorm=I=-16:TP=-1.5:LRA=9[aout]')

run(*args, '-filter_complex', ';'.join(graph), '-map', f'[{v}]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '../promo-landscape.mp4')

# The thumbnail: the last reel's sign-off, lockup and store line both in.
last = ORDER[-1]
f = round((R[last]['outroAt'][1] + 1.2) * 30)
run('-i', f'frames-land-{last}/{f:04d}.png', '-vf', 'scale=1280:720', '-q:v', '2', '../promo-thumbnail.jpg')
print('promo', round(t, 2), 's', dict(zip(ORDER, lens)))
