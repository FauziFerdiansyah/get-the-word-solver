# Changelog

Versioning follows [AGENTS.md](AGENTS.md#versioning): PATCH for small changes,
MINOR for new capability, MAJOR when existing behaviour or a data shape changes
incompatibly.

## 2.10.0 — 2026-08-23

### Added

- On a phone, the Semua / Umum / Jarang tabs now pin themselves directly under the
  Clues / Answers bar as you scroll the answers, and release again when you scroll
  back up to them. They cannot follow you onto the clue view.

### Changed

- Icons are circular again. The any-purpose icons are transparent, so the launch
  screen shows the artwork instead of the white square the square icons put on top
  of it. The maskable icon and the iOS touch icon stay opaque, because the platform
  crops the first and iOS composites transparency onto black.
- The button that closes the install progress now reads "Terinstall" rather than
  "Mengerti".

## 2.9.1 — 2026-08-23

### Fixed

- `src/data/changelog.js` was missing from the README's structure section. A test
  now lists every source file under `src/` and fails if the README does not name
  it, so that section cannot drift again.

## 2.9.0 — 2026-08-23

### Added

- **Version history in the app**, under the version line in Settings. It reads
  `CHANGELOG.md` itself, so the file and the popup can never disagree, and marks
  which entry is the version you are running.
- Reconstructed the 1.0.0–1.4.0 entries from commit history; the version in
  `package.json` never moved during that work, so those numbers are assigned
  after the fact.

### Changed

- The install button is capitalised, full width, the same height as the buttons
  around it, and filled with the theme's primary colour instead of the muted
  accent that made it look secondary.
- The empty-results panel is now a centred icon with a heading and an explanation,
  rather than a single line of text in a warning strip.
- The copy control on each suggestion looks like a button: bordered, shadowed, and
  a 36px target instead of a bare icon.

### Fixed

- Switching between the Semua / Umum / Jarang tabs flashed the whole list. Rows
  were keyed by word, so every switch unmounted all of them and mounted new ones;
  they are keyed by position now and the same DOM nodes are reused. Each row keeps
  its definition tied to its word so a reused row cannot show the previous one's.

## 2.8.0 — 2026-08-23

### Changed

- **Sessions moved into their own popup**, opened from a button in Settings. As a
  block inside the settings sheet the list pushed everything else down and had to
  be scrolled past.
- Each saved session now shows **the full date and time it was saved**, down to the
  second, in the app's language — two saves a minute apart are told apart at a
  glance.
- Each row previews the puzzle it holds: the placed letters in their colours for
  1 Row mode, or the last row with anything in it for the 6 Rows board. A session
  is recognisable without relying on its name.
- Deleting takes two taps: the first swaps the row's buttons for a Delete/Cancel
  pair, so a stray tap cannot lose saved work.
- The section title is capitalised: "Simpan & Buka Sesi".
- The header counts the slots in use, e.g. `3/12`.

## 2.7.1 — 2026-08-23

### Changed

- Renamed to **Get The Word Solver**, subtitle "Cari jawaban Get The Word! /
  Wordle". Applied to the in-app header, the tab title, the SEO and social
  metadata, the iOS home screen label, the manifest (`short_name` "GTW Solver",
  which fits under a launcher icon) and the version line in Settings, which now
  reads the name from i18n instead of repeating it.

## 2.7.0 — 2026-08-23

### Added

- **Saved sessions.** Keep the puzzle you are working on under a name and reopen
  it later, from Settings. A session stores the word length, the mode, both input
  models and each mode's crossed-out letters, so opening one puts you exactly
  where you left off. Kept in `localStorage` (not cookies: those ride along with
  every request and cap out near 4 kB), up to 12 sessions, and validated on the
  way in so an older or corrupt entry cannot break the app.
- An icon on the Reset button.

### Changed

- README: the project structure now matches the tree, and the demo link points at
  https://fauzi.is-a.dev/get-the-word-solver/.
- `word-circle.png` and the old `type.wav` moved from `public/` to `design/`: both
  are unused since the icons went square and the key sounds became samples, and
  everything in `public/` is deployed.

## 2.6.0 — 2026-08-23

### Changed

- **Icons are square again**, regenerated from the square logo instead of the
  circular one. The maskable copy stays inside Android's centre-80% safe zone, and
  the launch screen shows a square icon. Note the launcher, not the app, decides
  whether it masks that square into a circle or a squircle.
- **The two input modes share nothing.** Reset clears only the mode you are
  looking at, and each mode keeps its own crossed-out letters. Changing the word
  length still clears both, since the number of boxes changes.
- **Reset asks first** whenever the current mode has something in it, naming which
  mode it is about to empty.
- **Random word draws from the current answers**, common tier first, falling back
  to the level's best-ranked words when no clue has been entered. The modal says
  which pool it drew from.

### Fixed

- The install progress bar filled instantly because it counted files, not bytes,
  and then sat still during the second or two the OS spends installing. It now
  re-downloads each file (bypassing the HTTP cache) and reports the megabytes
  moved for 90% of the bar, then waits for the `appinstalled` event for the last
  stretch — shown as a moving stripe, because that part genuinely has no size.

## 2.5.0 — 2026-08-23

### Fixed

- **Single-row mode threw away correct answers.** A green letter plus a yellow of
  the same letter was read as "two copies". That only holds inside one guess; this
  row merges several guesses, so finding T at position 5 and having learned T is
  not at position 3 are two facts about the same T. With R/A yellow and T green,
  HEART was missing entirely — now it is the answer.
- **The install progress overlay could never appear.** Accepting the prompt clears
  `promptEvent`, which unmounted the button component and the overlay with it.
- Switching between 1 row and 6 rows no longer wipes what was typed; the two
  models keep their own state. Changing word length still resets, as it must.
- An empty result list now names any letter that is marked as present and crossed
  out on the keyboard at the same time, instead of just saying "no match".
- The declared OG image size did not match the file (1200×630 declared, 1254×1254
  actual). There is now a real 1200×630 image.

### Added

- **Launch screen** using the supplied artwork, with the round icon centred. It
  runs only when opened as an installed app.
- **Install progress overlay** with a real percentage: it counts the app's files
  as they are pulled into the offline cache. Installation itself exposes no
  progress, so nothing here is a fake timer.
- A copy button on the "copy this address" step of the iOS guide; the other steps
  stay plain icons.
- A green letter in a top box now clears that position's ruled-out box, since
  nothing else can sit there.

### Changed

- Icons regenerated from the circular source on white, with the maskable one kept
  inside Android's 80% safe zone so its edges are no longer shaved by the circle
  mask. The Android splash background is white.
- `public/` shrank from 3.7 MB to 560 kB by quantising the icons and replacing the
  2 MB source art that was being deployed.

## 2.4.0 — 2026-08-23

### Added

- **Deleting a letter now sounds too**, using the pack's own Backspace recording
  as a 27th slot in the sprite. Applies to the clue boxes, the ruled-out letters
  and the 6-row board.
- **Step-by-step install guide** for platforms with no automatic prompt. Numbered
  steps with icons, in three variants: Safari on iOS, another browser on iOS
  (which is pointed at Safari first), and a desktop browser that never reported
  installability.

### Changed

- **The installed app's top bar follows the theme** instead of staying green: the
  `theme-color` meta tracks the page background, so it is near-black in dark mode,
  near-white in light, and exactly `#000`/`#fff` with high contrast. The iOS status
  bar style switches with dark mode as well (iOS applies it at next launch).
- The manifest's `theme_color` is neutral rather than green, so the install splash
  matches too.

## 2.3.0 — 2026-08-23

### Added

- **Real key sounds.** Each letter now plays a Cherry MX Blue recording instead of
  a synthesised voice, which sounded robotic because of its tonal component. The
  26 samples come from the pack bundled with Mechvibes (MIT) and are trimmed into
  a 62 kB MP3 sprite by `scripts/build-key-sounds.mjs` (`npm run build:sounds`).
  The synth stays as the fallback until the sprite loads, or if it cannot.
- **High contrast setting.** With dark mode it takes the surfaces to true black
  (#000) for AMOLED screens; in light mode to pure white. Borders and text follow;
  the green/yellow tile colours do not, since they mirror the game.
- **Hints setting.** Switches off the explanatory texts — the "Kotak atas / Kotak
  bawah" legend, the examples, the board hint and the ranking note.

### Changed

- The random word popup is as wide as an input section (`max-w-sm`) with square
  tiles, so a 6-letter word no longer sits squeezed against the padding.
- Removed the "Coret Huruf yang Tidak Ada" heading above the keyboard; it cost a
  row of vertical space on a phone and the keys are self-explanatory.

### Fixed

- The dark mode setting was the only row without an icon.

## 2.2.0 — 2026-08-23

### Changed

- **Walkthrough rewritten.** 11 vague steps became 8 concrete ones that describe
  the app as it works now: both input modes, the yellow-box rules, live ranked
  suggestions, the phone view switcher, and the install button. Dropped references
  to the removed search button and the old `AA` duplicate-letter encoding.
- **Walkthrough redesigned**: header bar with a step counter and a bordered close
  button, a large step icon, readable body text, a tappable progress bar, and
  Back/Next buttons that keep their positions. Full screen on phones.
- Arrow keys move between steps and Escape closes it.

### Fixed

- Step icons came from an array in the component that had 8 entries for 11 steps,
  so the last three steps fell back to a generic icon. Each step now carries its
  own icon and a test enforces it in both languages.

## 2.1.0 — 2026-08-23

### Added

- Developer credit in Settings, linking to https://fauzi.is-a.dev/.

### Changed

- The Settings title is now a proper sticky header bar: bottom border, icon, and
  a bordered close button matching the rest of the app.

## 2.0.0 — 2026-08-23

### Changed (breaking)

- **Word list regenerated** by `scripts/build-words.mjs` from seven public sources.
  1,562 words removed, 4,086 added. Plurals, regular inflections, proper nouns,
  British-only spellings, roman numerals and profanity are gone; `USED`, `TEEN`
  and `FRIV` among them.
- **`src/data/words.js` export shape**: lists are ordered best-first and expose
  `getRankedWords`, `getWordRank` and `getTopWords`.
- **Solver signature**: `findMatches(words, letters, excluded, disabledLetters)`;
  `colorStates` is gone. `hasInflectedSuffix` and `filterForGetTheWord` were
  removed — that filtering now happens when the list is generated.
- **Single-row input model**: a placed letter with a green/yellow dot, plus a
  per-position list of ruled-out letters. The same letter under several boxes
  means one copy.

### Added

- **6-row board mode** reproducing the real game board, with the game's duplicate
  letter rules.
- **Ranking**: every word has a rank; suggestions are ordered by likelihood
  instead of shuffled, and each row shows its position and tier.
- **Live suggestions** — the search button is gone.
- **Phone view switcher**: sticky Clues / Answers tabs with a live match count.
- **All tier tab**, which the default filter never had.
- **Mechanical key sounds** synthesised per letter, with a release click and a
  "Tes" button in Settings that reports the audio state.
- **Settings**: multi-letter yellow boxes, decorative Enter/Backspace keys.
- **Installable** on Android, iOS/iPadOS, Windows, macOS and Linux.
- **79 tests** (Vitest + Testing Library) and `AGENTS.md` + `docs/`.

### Fixed

- Manifest declared a 64×64 icon as 192×192 and 512×512, so installation was never
  offered.
- Key sounds were silent in real browsers: notes were scheduled outside the user
  gesture, and voices sat below what a phone speaker reproduces.
- Empty state and conflict box ignored the theme, so they were unreadable in dark
  mode.
- Keyboard rows had different key sizes; now a 20-column grid.
- Switching tier animated and resized the tab row, which read as flicker.
- A crossed-out letter silently discarded the whole yellow box.

## 1.4.0 — 2026-07-03

### Fixed

- Keyboard keys were too small on an iPad; enlarged at the `md` breakpoint.

## 1.3.0 — 2026-07-03

### Changed

- Word database expanded across A–Z for all three lengths, after an earlier pass
  that only covered S-patterns.
- Duplicates removed and entries of the wrong length dropped.
- `NEWS` added along with a suffix whitelist, so real words ending in -S stop
  being treated as plurals.
- Translation handling improved and the random word modal reworked.

### Fixed

- The random word modal's shuffle animation never ran, from a `useEffect`
  dependency mistake.

## 1.2.0 — 2026-07-02

### Fixed

- Duplicate letters with mixed green/yellow states were mishandled by the solver.
- Yellow letters did not properly exclude their own position.
- `SAILS` and `SALTS` were missing.

### Changed

- The category indicator moved to the top-left of a word and took the tab colours.

## 1.1.0 — 2026-07-02

### Added

- Word definitions from the Free Dictionary API, copy-to-clipboard, the random
  word picker, and the first-run coach mark.
- Indonesian/English switching, with every string moved into `i18n.js`.
- Common/rare word categories with visual indicators.
- PWA setup: manifest, service worker, and the version display in Settings.
- SEO and social metadata; the emoji language flags became icon images.

## 1.0.0 — 2026-07-02

Initial release: single-row clue input, virtual keyboard, common/rare word
categories, 6 themes, dark mode, Indonesian/English, PWA scaffolding.

---

*Versions 1.0.0 to 1.4.0 are reconstructed from commit history. The version in
`package.json` stayed at 1.0.0 through all of that work, so these numbers are
assigned after the fact to group what shipped. Everything from 2.0.0 onward was
versioned as it was released.*
