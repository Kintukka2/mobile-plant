#!/bin/sh
# mux.sh <n> <id>: poster as frame 0 (replaced, not added), then H.264 + AAC
# from the voiced mix, faststart for Instagram.
set -e
n=$1; id=$2; T=$(node -e "console.log(require('./reels.json')['$id'].poster)")
node render.js $id $T
P="stills/$id-$(printf %.2f $T).png"
cp "$P" frames-$id/0000.png
ffmpeg -hide_banner -loglevel error -y -i "$P" -q:v 2 ../$n-$id.jpg
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames-$id/%04d.png -i mix-$id.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart ../$n-$id.mp4
echo done $n $id
