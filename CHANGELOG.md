# Changelog

Versioning follows [AGENTS.md](AGENTS.md#versioning): PATCH for small changes,
MINOR for new capability, MAJOR when existing behaviour or a data shape changes
incompatibly.

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

## 1.0.0

Initial release: single-row clue input, virtual keyboard, common/rare word
categories, 6 themes, dark mode, Indonesian/English, PWA scaffolding.
