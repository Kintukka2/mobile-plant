#!/bin/sh
# mux.sh: the poster as frame 0 (replaced, not added, so the length and the
# sync stay), then H.264 + AAC, faststart. Writes ../promo-landscape.mp4 and
# ../promo-thumbnail.jpg, the 1280x720 custom thumbnail YouTube asks for.
set -e
T=$(node -e "console.log(require('./promo.json').poster)")
node render.js $T
P="stills/$(printf %.2f $T).png"
cp "$P" frames/0000.png
ffmpeg -hide_banner -loglevel error -y -i "$P" -vf scale=1280:720 -q:v 2 ../promo-thumbnail.jpg
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames/%04d.png -i mix.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart ../promo-landscape.mp4
echo done
