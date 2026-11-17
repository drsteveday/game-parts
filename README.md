# game-parts

Reusable parts shared by the appscom games (Sky Battles, Sky Defence) and the platform
lobby, kept and updated in one place. One package, one folder per part, imported per part:

```ts
import { MusicPlayer, MUSIC_TRACKS, DEFAULT_TRACK_IDS } from 'game-parts/music';
```

A game only ships the parts it imports. Parts are bundled into the game at build time;
nothing is loaded from this repo while people play.

| Part    | Import             | What it is                                                         | Size (gzipped) | Assets          |
| ------- | ------------------ | ------------------------------------------------------------------ | -------------- | --------------- |
| `music` | `game-parts/music` | Lobby/menu music: shuffled playlist, fades, own volume and on/off. | 5.2 KB         | `assets/music/` |

Each part's own `README.md` (in `src/<part>/`, also shipped in `dist/<part>/`) has its API,
what the game passes in and its performance cost.

## Handover: using the library in a game or the lobby

Paste this into the other project's thread when it starts using a part.

1. **Add the dependency**, pinned to a release tag (never a branch):

   ```json
   "dependencies": { "game-parts": "github:drsteveday/game-parts#v0.1.0" }
   ```

   The repo is public, so no token is needed anywhere. Release tags contain the built `dist/`, so no build step runs on install. Each part is
   plain ES modules plus `.d.ts` types. Parts that use `three` take the game's own copy
   (peer dependency), so there are never two.

2. **Copy the assets the part needs** into the game's static folder at build time and pass
   that URL to the part. For example, for music in a Vite game (folder kept out of git):

   ```json
   "scripts": {
     "assets": "node -e \"require('fs').cpSync('node_modules/game-parts/assets/music','client/public/music',{recursive:true})\"",
     "predev": "npm run assets",
     "prebuild": "npm run assets"
   }
   ```

   ```ts
   const music = new MusicPlayer({ baseUrl: '/music/', storagePrefix: 'mygame.music' });
   ```

   Files are then served from the game's own domain and cache like any other file.

3. **Write the glue in the game, not in the part.** Feature switches, admin controls,
   settings screens, lobby events and sign-in stay in the game; the part takes settings,
   text, asset URLs, a storage key prefix and callbacks. Keep the storage prefix a game
   already uses, or players lose saved settings.

4. **Updates arrive as pull requests.** Add `.github/dependabot.yml` so each release opens
   a bump PR; the game's own check and build run on it, and merging deploys as usual:

   ```yaml
   version: 2
   updates:
     - package-ecosystem: npm
       directory: /
       schedule: { interval: daily }
       allow: [{ dependency-name: game-parts }]
   ```

   Read `CHANGELOG.md` before merging a major bump: it says what glue to change.

5. **Credits.** The music tracks need their `credit` line shown somewhere in the game
   (CC BY); see `src/music/CREDITS.md`.

## Part rules

The same as rule 9 in each game's `CLAUDE.md`:

1. One folder per part in `src/<name>/`.
2. `index.ts` is the only public entry; `package.json` `exports` has `./<name>` pointing at
   `dist/<name>/index.js` and `.d.ts`.
3. `config.ts` holds defaults as plain data; the game passes overrides in.
4. No game imports: a part imports only from inside `src/` (another part only through its
   `index.ts`) and from `three`.
5. Namespaced state: storage keys take a prefix from config; CSS classes start with the
   part's name and live in the part's own CSS file; no globals.
6. A `README.md`: what it does, its API, what the game passes in, its performance cost.
7. Tests beside the code, runnable without a game or a browser.
8. Feature switches and admin controls stay in the game.

`tools/parts.test.ts` checks rules 1, 2, 4, 6 and 7 on every `npm run check`.

**Performance first.** Parts must stay fast on an iPad 8th gen and a Galaxy S8: no
frameworks, nothing heavy loaded until used, no work in the game's frame loop unless that is
the part's job, no new network or server calls.

## Working on the library

```sh
npm install
npm run check    # strict type check + Vitest (includes the parts guard)
npm run build    # dist/<part>/ for every part
npm run size     # built size per part against sizes.json (after build)
npm run format   # Prettier
```

- **CI** (`.github/workflows/ci.yml`) runs format check, check, build and the size check on
  every PR and push to `main`. The size check fails if a part grows more than 10%
  (gzipped) unless the `## Unreleased` section of `CHANGELOG.md` has a line naming the part
  and the word "size", with the reason.
- **Adding a part:** `src/<name>/` with `index.ts`, `config.ts`, `README.md` and tests;
  add `./<name>` to `exports` in `package.json`; assets in `assets/<name>/`; a line in
  `CHANGELOG.md` and a row in the table above.
- **Releasing:** in one PR, bump `version` in `package.json`, rename `## Unreleased` in
  `CHANGELOG.md` to `## x.y.z (date)` (start a fresh empty `## Unreleased` above it), and
  run `npm run build && npm run size -- --update` so `sizes.json` is the new baseline. After
  it merges, run **Actions > Release > Run workflow** on `main` (or push tag `vx.y.z`). The
  workflow checks, builds, tags a commit that includes `dist/`, and makes a GitHub release
  with the CHANGELOG notes. `main` itself never contains `dist/`.
- **Versions:** fix or new option = patch or minor; anything that needs games to change
  their glue = major, with what to change in `CHANGELOG.md`.
- `tools/music-build.sh` encodes a new music track into `assets/music/` (needs ffmpeg).
