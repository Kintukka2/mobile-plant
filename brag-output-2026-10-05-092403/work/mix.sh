#!/bin/sh
# mix.sh <id>: the voice lines placed where reels.json says, cleaned up the
# same way for every reel, then the music ducked under her and the whole thing
# brought to -16 LUFS for Instagram.
set -e
id=$1
args=""; graph=""; n=0
for pair in $(node -e "require('./reels.json')['$id'].vo.forEach(v=>console.log(Math.round(v[0]*1000)+':'+v[1]))"); do
  ms=${pair%%:*}; f=${pair#*:}
  args="$args -i vo/$f.wav"
  graph="$graph[$n:a]aresample=48000,adelay=${ms}|${ms},pan=stereo|c0=c0|c1=c0[v$n];"
  n=$((n+1))
done
ins=""; i=0; while [ $i -lt $n ]; do ins="$ins[v$i]"; i=$((i+1)); done
ffmpeg -hide_banner -loglevel error -y $args -i music-$id.wav -filter_complex "$graph\
${ins}amix=inputs=$n:normalize=0,apad=whole_dur=$(node -e "console.log(require('./reels.json')['$id'].duration)"),highpass=f=85,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3800:t=q:w=1.2:g=2,\
acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2,aecho=0.8:0.5:28:0.12,asplit=2[vo][key];\
[$n:a]volume=-9dB[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=380[duck];\
[vo][duck]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=9" -ar 48000 mix-$id.wav
echo mixed $id
