# Skills

Version: 2.0.0 · Playbooks for the tasks that come up in this repository.
Each one ends the same way: `npm test` and `npx eslint src scripts` clean, plus a
version bump per [AGENTS.md](../AGENTS.md#versioning).

## Regenerate the word list

```bash
npm run build:words          # caches sources in /tmp/wl on first run
npm run build:words -- --report   # also prints why words were rejected
npm test
```

To change *which* words exist, edit the rules in `scripts/build-words.mjs`, never
`src/data/words.js`.

Before removing a category of words, check it against the official answer list —
that is how the exceptions for `PHOTO`, `BADLY` and `THERE` were found:

```bash
grep -x 'badly\|photo\|there' /tmp/wl/wordle_answers.txt
```

To sanity-check a change, print what a clue set returns:

```js
import { findMatches } from './src/utils/solver.js';
import { getUniqueWords } from './src/data/words.js';
findMatches(getUniqueWords(5, 'all'), ['','','','',''], ['', 'A', 'A', '', ''], new Set());
```

Run it with `npx vite-node`, not bare `node` — the imports are extensionless.

Bump: **MINOR** for ranking or source changes, **PATCH** for a blacklist entry.

## Add a theme

1. Add the palette to `src/data/themes.js`. Every key an existing theme has must
   be present, or dark mode breaks somewhere unrelated.
2. Nothing else: `SettingsModal` maps over `THEMES`.
3. Check the empty state, the conflict box and the disabled keyboard keys in both
   light and dark mode. Those are where hardcoded colours have leaked before.

Bump: **MINOR**.

## Add a setting

1. State + `localStorage` in `src/contexts/ThemeContext.jsx` (`ws-*` key), and add
   it to the provider value.
2. A row in `SettingsModal.jsx`, following the existing toggle markup.
3. Strings in both `id` and `en` in `src/data/i18n.js`.
4. Consume it where it matters.
5. Test it end to end: flip it through the UI, then assert the behaviour changed
   (see the multi-letter test in `App.clue.test.jsx`).

Bump: **MINOR**.

## Tune the key sounds

Everything is in `src/utils/sound.js`:

- `VOICES` — per-letter click / knock / tone / tick frequencies
- `press()` — per-layer gains and decays
- `playKeySound`'s `level` — overall loudness

Keep every frequency above ~240 Hz or phone speakers will not reproduce it. Keep
the pitch spacing wider than `BODY_JITTER`, or two letters can sound identical —
`sound.test.js` asserts 26 distinct voices.

To hear it: `npm run dev`, then Settings → the "Tes" button, which also reports
the `AudioContext` state.

Bump: **PATCH** for parameter tweaks, **MINOR** for a new layer.

## Change the keyboard layout

`src/components/Keyboard.jsx` is a 20-column grid; a key spans 2 columns.
`CENTRED_INDENT` centres the shorter rows when the action keys are hidden.

Assert relationships, not numbers: the existing test reads the `gridColumn` of K,
L and P and checks Backspace covers K+L while Enter sits in P's column. Copy that
approach rather than hardcoding column indexes.

Bump: **PATCH** for spacing, **MINOR** for a new key.

## Work on the PWA

```bash
cd public && magick word-large.png -resize 192x192 icon-192.png
```

Rules that Chrome enforces silently:

- A declared `sizes` must match the real file, or the icon is ignored and
  installation is never offered. `App.install.test.jsx` compares them.
- Keep `orientation` out of the manifest so tablets and desktops are not locked.
- Bump `CACHE_NAME` in `public/sw.js` on every release.

Test installation on a real device over HTTPS; `localhost` also qualifies.

Bump: **PATCH** for icons, **MINOR** for manifest capabilities.

## Add a test

- Component tests render `<ThemeProvider><App /></ThemeProvider>`.
- Scope result queries to `data-testid="results-panel"`; the toast library also
  renders `<li>`.
- The UI defaults to Indonesian, so labels are Indonesian (`Isi Clue`, `Tutup`).
- For anything Tailwind decides (visibility, grid placement), assert the class or
  inline style and note in a comment that jsdom has no stylesheet.
- For audio, install the mock from `src/test-audio-mock.js` and share one log
  object across the file.

Bump: **PATCH**.

## Release

1. Bump `version` in `package.json`.
2. Bump `CACHE_NAME` in `public/sw.js`.
3. Add a `CHANGELOG.md` entry.
4. Append to `docs/SESSIONS.md`.
5. `npm test && npm run build && npx eslint src scripts`.
6. Commit, push to `main`; the GitHub Actions workflow deploys to Pages.
