#!/usr/bin/env bash
# Encode a downloaded recording for the music part (src/music).
# Usage: tools/music-build.sh <source file> <track id> [piano]
# Band tracks: at most 2:45, 80 kbps stereo. Piano: at most 4:00, 64 kbps mono.
# Fade in 1 s, fade out at the end, levelled to -18 LUFS, tags stripped.
# Sources and licences: src/music/CREDITS.md.
set -euo pipefail
src=$1 id=$2 kind=${3:-band}
out="$(dirname "$0")/../assets/music/$id.mp3"
if [ "$kind" = piano ]; then len=240 ch=1 br=64k; else len=165 ch=2 br=80k; fi
ffmpeg -nostdin -loglevel error -y -i "$src" -t "$len" \
  -af "afade=t=in:d=1,afade=t=out:st=$((len - 6)):d=6,loudnorm=I=-18:TP=-1.5:LRA=11" \
  -map_metadata -1 -ac "$ch" -ar 44100 -c:a libmp3lame -b:a "$br" "$out"
ls -l "$out"
