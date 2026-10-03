#!/bin/sh
# mux.sh <n> <id>: poster as frame 0, then H.264 + AAC at -16 LUFS, faststart.
set -e
F=${FFMPEG:-ffmpeg}
n=$1; id=$2; T=$(node -e "console.log(require('./reels.json')['$id'].poster)")
node render.js $id $T
cp "stills/$id-$(printf %.2f $T).png" frames-$id/0000.png
$F -hide_banner -loglevel error -y -i "stills/$id-$(printf %.2f $T).png" -q:v 2 ../0$n-$id.jpg
$F -hide_banner -loglevel error -y -framerate 30 -i frames-$id/%04d.png -i audio-$id.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -r 30 \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 \
  -shortest -movflags +faststart ../0$n-$id.mp4
echo done $n $id
