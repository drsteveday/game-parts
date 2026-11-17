# game-parts: notes for Claude threads

Shared library of reusable parts for the appscom games (Sky Battles, Sky Defence) and the
platform lobby. Read `README.md` (part rules, releasing, handover). The plan behind it is
`docs/SHARED-LIBRARY.md` in `drsteveday/sky-battles`.

- `npm run check` (types + tests incl. the parts guard), `npm run build`, `npm run size`
  must pass before merging. Merge to `main`; releases are made by the Release workflow.
- Performance is the top rule: parts must stay fast on iPad 8th gen and Galaxy S8.
- A part imports nothing from any game. Games pass settings, text, URLs, storage prefix
  and callbacks. Switches and admin controls stay in the game.
- Never change a part's storage keys or option names without a major version and a
  CHANGELOG line saying what games must change.
- Every change gets a line in `CHANGELOG.md` under `## Unreleased`.
