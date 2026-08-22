# Requirements

Version: 2.0.0 · `FR` = functional, `NFR` = non-functional.
The "Verified by" column names the test that fails if the requirement breaks.

## Input

| ID | Requirement | Verified by |
|---|---|---|
| FR-1 | Word length is selectable between 4, 5 and 6 letters. | `App.board.test.jsx` — 4-letter level |
| FR-2 | Changing length or mode clears the inputs, asking for confirmation when something was filled in. | `App.board.test.jsx` — reset |
| FR-3 | Single-row mode: a box holds one letter whose position is known (green), switchable to yellow with a dot. | `App.clue.test.jsx` — flips a placed letter |
| FR-4 | Single-row mode: each box has a second field listing letters that are in the word but not at that position. | `App.clue.test.jsx` — yellow box |
| FR-5 | The same letter may be listed under several boxes and still means one copy. | `solver.test.js` — several positions |
| FR-6 | A letter repeated inside one box is deduped, not read as two copies. | `solver.test.js` — repeated letter |
| FR-7 | A letter that is green somewhere and yellow elsewhere requires two copies. | `solver.test.js` — green + yellow |
| FR-8 | One box holds 1 letter by default, up to 6 when the multi-letter setting is on. | `App.clue.test.jsx` — default / six |
| FR-9 | Ruled-out letters wrap 3 per row over at most 2 rows, and the font shrinks with each letter while typing. | `App.clue.test.jsx` — shrinks while typing |
| FR-10 | A letter crossed out on the keyboard cannot be added as a yellow letter; only that letter is refused, with a reason. | `App.clue.test.jsx` — crossed-out letter |
| FR-11 | Board mode offers 6 rows × word length, one guess per row. | `App.board.test.jsx` — switches modes |
| FR-12 | Each board tile cycles grey → green → yellow via a dot, or the ↑/↓ keys. | `App.board.test.jsx` — fillRow |
| FR-13 | Board mode applies the game's duplicate rules: green+yellow count is the minimum, and a grey tile of the same letter makes it exact. | `solver.test.js` — gray duplicate |
| FR-14 | Letters crossed out on the keyboard are excluded in both modes. | `solver.test.js`, `App.clue.test.jsx` |
| FR-15 | Typing advances focus across boxes and rows; backspace walks back. | manual |

## Suggestions

| ID | Requirement | Verified by |
|---|---|---|
| FR-20 | Suggestions recompute on every input change; there is no search button. | `App.clue.test.jsx` — suggests as soon as typed |
| FR-21 | Nothing is shown until at least one clue exists. | `App.board.test.jsx` — shows nothing |
| FR-22 | Results are ordered best-first by rank. | `solver.test.js` — ordered best-first |
| FR-23 | Each suggestion shows its position and its tier. | `App.clue.test.jsx` — labels tier |
| FR-24 | Tiers are filterable by All / Common / Rare tabs; All is the default and looks selected. | `App.clue.test.jsx` — starts on All |
| FR-25 | Switching tier resets to the first page and must not animate or resize the tab row. | `App.clue.test.jsx` — switching tier |
| FR-26 | 10 suggestions per page, with the remaining count on the "show more" button. | `App.clue.test.jsx` — starts each tier |
| FR-27 | A single word or the top 20 can be copied. | manual |
| FR-28 | Definitions are optional and render on first paint when already cached. | `ResultsList` seeded state |
| FR-29 | The random word comes only from the top 400 ranked words for that length. | `solver.test.js` — top slice |

## Word list

| ID | Requirement | Verified by |
|---|---|---|
| FR-30 | `src/data/words.js` is generated and reproducible from `scripts/build-words.mjs`. | `npm run build:words` diff |
| FR-31 | Words are uppercase A–Z, correct length, no duplicates. | `solver.test.js` — word lists |
| FR-32 | Excluded: non-lemmas, proper nouns, plurals, regular past tenses, gerunds, comparatives, superlatives, -LY adverbs, British-only spellings, roman numerals, profanity, informal clippings. | `solver.test.js` — drops words |
| FR-33 | Kept: everyday words and lexicalised irregular verb forms (CAME, DREW, WROTE). | `solver.test.js` — keeps everyday words |
| FR-34 | The 2,315 official Wordle answers bypass every heuristic. | coverage assertion 2306/2315 |
| FR-35 | Every word has a rank; common-tier words rank ahead of rare-tier ones. | `solver.test.js` — ranks common ahead |

## Presentation and platform

| ID | Requirement | Verified by |
|---|---|---|
| FR-40 | Phones get sticky Clues / Answers tabs below the header, with a live match count; desktop shows both panels. | `App.view.test.jsx` |
| FR-41 | Settings opens full screen on phones and as a card from 640 px up, with a sticky close button. | `App.view.test.jsx` — full screen sheet |
| FR-42 | The keyboard is a 20-column grid; Backspace fills the two columns under K and L, Enter is one column wide and two rows tall right of L and under P. | `App.clue.test.jsx` — puts backspace under K and L |
| FR-43 | Enter and Backspace are decorative, hidden until enabled in Settings. | `App.clue.test.jsx` — hides the keys |
| FR-44 | Every letter key has its own synthesised sound; press and release differ. | `sound.test.js`, `App.sound.test.jsx` |
| FR-45 | Sound can be switched off and tested from Settings, which reports the audio state. | `App.sound.test.jsx` — goes quiet |
| FR-46 | Installable on Android, iOS/iPadOS, Windows, macOS and Linux: valid manifest, honest icon sizes, no orientation lock, iOS meta tags, service worker with a fetch handler. | `App.install.test.jsx` |
| FR-47 | An install button appears only when the browser reports installability, or on iOS with instructions. | `App.install.test.jsx` |

## Non-functional

| ID | Requirement |
|---|---|
| NFR-1 | A suggestion pass over the largest list (3,940 words) stays imperceptible; no debounce. |
| NFR-2 | Usable at 320 px for every word length; fluid tiles, never horizontal scroll. |
| NFR-3 | Inputs render at 16 px or the viewport pins `maximum-scale=1.0`, so iOS never zooms on focus. |
| NFR-4 | Touch targets ~40 px, `touch-manipulation` on every interactive element. |
| NFR-5 | All colours from the active theme; light and dark both legible, including empty and error states. |
| NFR-6 | Indonesian and English complete; no user-facing literal outside `i18n.js`. |
| NFR-7 | `npm test` and `npx eslint src scripts` pass with zero failures and zero warnings. |
| NFR-8 | No analytics or account; settings in `localStorage` only. |
| NFR-9 | Service worker serves a cached copy when offline; `CACHE_NAME` changes with every release. |
