# Music part

Background music for menus and lobbies: real recorded tracks in nine styles, a
shuffled playlist of the ticked tracks, fade in and out, its own volume and
on/off switch. Self-contained: it imports nothing outside this folder, so a
game or the platform lobby can copy it as it is.

## Files

- `index.ts`: the only public entry.
- `config.ts`: the track catalogue (`MUSIC_TRACKS`, `MUSIC_STYLES`) and defaults (`DEFAULT_MUSIC_CONFIG`, `DEFAULT_TRACK_IDS` = the peaceful piano set).
- `player.ts`: `MusicPlayer`.
- `CREDITS.md`: every track, its source and licence. **Show the `credit` line of every track you ship somewhere in your game** (CC BY needs it).
- The audio itself is not in this folder: copy the `.mp3` files (Sky Battles keeps them in `client/public/music/`) to wherever your game serves static files, and pass that as `baseUrl`.

## API

```ts
import { MusicPlayer, MUSIC_TRACKS, DEFAULT_TRACK_IDS } from './parts/music';

const music = new MusicPlayer({ baseUrl: '/music/', storagePrefix: 'mygame.music' });
music.connect({ ctx: audioContext, node: masterGain }); // optional, see below
music.setPlaylist(DEFAULT_TRACK_IDS); // or the ids your admin ticked
music.start(); // lobby opened
music.stop(); // round starting (fades out, stops downloading)
```

| Member                   | What it does                                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new MusicPlayer(opts?)` | `opts` is a partial `MusicConfig`: `tracks`, `baseUrl` (ends in `/`), `storagePrefix` (localStorage keys `<prefix>.volume`, `<prefix>.on`), `volume` (starting level 0..1), `fade` (seconds).                                |
| `setPlaylist(ids)`       | Tracks to shuffle through. Unknown ids are ignored; an empty list stops the music.                                                                                                                                           |
| `start()` / `stop()`     | Want music / don't. If the browser blocks autoplay, it starts on the next tap or key press.                                                                                                                                  |
| `next()`                 | Skip to another track.                                                                                                                                                                                                       |
| `preview(id)`            | Play one track now (for an admin picker); `stop()` ends it.                                                                                                                                                                  |
| `volume`                 | The player's music volume 0..1 (saved on the device).                                                                                                                                                                        |
| `enabled`                | The player's own music on/off (saved).                                                                                                                                                                                       |
| `current`                | The track playing, or null.                                                                                                                                                                                                  |
| `onChange(fn)`           | Hear track, volume and on/off changes (for a "now playing" label). Returns an unsubscribe.                                                                                                                                   |
| `connect(out)`           | Route the music through a Web Audio node (`{ ctx, node }`), so the game's master volume and mute apply. Needed for volume control on iPad Safari, which ignores `audio.volume`. Call it once the game's AudioContext exists. |
| `dispose()`              | Stop and remove listeners.                                                                                                                                                                                                   |

## Performance

- One `<audio>` element with `preload="none"`: nothing downloads until a track plays, one file at a time (1.4 to 2.3 MB each, 64 to 80 kbps, at most 4 minutes).
- `stop()` drops the file so nothing keeps streaming during a round. Background tabs pause.
- Fades run on the audio thread (a Web Audio gain ramp), so a busy frame while a match is built cannot stretch them; no timers run while music plays.

## What the game provides

- Which tracks are ticked (Sky Battles: admin Tuning > Sounds > Lobby music, saved in the weapon config as `music.tracks`, sent to the home screen with `/api/accounts`).
- When to start and stop (Sky Battles: start in a lobby, stop when a round starts or when leaving the lobby).
- A volume slider and on/off button bound to `volume` / `enabled`.
- The credits screen.

## Adding a track

Add it to `MUSIC_TRACKS` with a new id and a `credit` line, put `<id>.mp3` in the served folder, and list it in `CREDITS.md`. Only public domain (CC0) or CC BY recordings. Sky Battles encodes with `tools/music-build.sh`.
