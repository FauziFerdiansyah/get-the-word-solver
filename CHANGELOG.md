# Changelog

Versioning follows [AGENTS.md](AGENTS.md#versioning): PATCH for small changes,
MINOR for new capability, MAJOR when existing behaviour or a data shape changes
incompatibly.

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

## 1.0.0

Initial release: single-row clue input, virtual keyboard, common/rare word
categories, 6 themes, dark mode, Indonesian/English, PWA scaffolding.
