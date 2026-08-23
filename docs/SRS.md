# Software Requirements Specification

Version: 2.0.0 · Applies to: Get The Word Solver

## 1. Purpose

The app helps a player of a Wordle-style word game (NYT Wordle, Microsoft's
"Get the Word", Lingo and clones) find the answer from the clues the game has
already revealed. It does not play the game; it narrows a dictionary down to the
words that remain possible and orders them by how likely each one is to be the
answer.

## 2. Scope

- 4, 5 and 6 letter puzzles.
- English words only.
- Entirely client-side. No account, no backend, no telemetry. The only network
  calls are the optional dictionary lookup for word definitions and translation.
- Deployed as static files to GitHub Pages, installable as a PWA.

Out of scope: playing/solving automatically for the user, other languages,
crossword or anagram solving, multiplayer.

## 3. Users and context

A single, non-technical user on a phone, mid-game, switching between the game app
and this one. Consequences that drive the design:

- Input has to be fast and forgiving; the user is copying what they see on a game
  board from memory.
- The phone screen is small and the on-screen keyboard covers half of it.
- The user cannot be assumed to know Wordle jargon such as "green/yellow".

## 4. Definitions

| Term | Meaning |
|---|---|
| Green | Right letter, right position |
| Yellow | Letter is in the answer, but not at that position |
| Grey | Letter is not in the answer at all |
| Tier | `common` (everyday words) or `rare`, shown as tabs |
| Rank | 1-based position of a word in its length's ranked list; 1 is the most likely answer |
| Single-row mode | All knowledge merged onto one row of boxes |
| Board mode | The real 6-row game board, one guess per row |

## 5. Functional requirements

Numbered requirements live in [REQUIREMENTS.md](REQUIREMENTS.md). Summary:

1. Choose a word length (4/5/6) and an input mode (1 row / 6 rows).
2. Enter clues; suggestions update live, with no search button.
3. Suggestions are ordered best-first and labelled with rank and tier.
4. Cross letters out on a virtual keyboard to exclude them everywhere.
5. Copy a single word or the top 20.
6. Optional word definitions, in Indonesian or English.
7. Random word drawn from the top-ranked words.
8. Settings: theme, dark mode, language, sound, definitions, multi-letter yellow
   boxes, decorative Enter/Backspace keys.
9. First-run walkthrough.
10. Installable to the home screen / desktop.

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | A suggestion pass runs over ≤3,940 words on every keystroke and must stay imperceptible (<16 ms budget). No debounce is used. |
| Bundle | Static output; currently ~515 kB JS (~173 kB gzip). New dependencies need justification. |
| Offline | A service worker serves a cached copy when the network fails. |
| Responsive | Usable at 320 px width for every word length; two-column layout from 1024 px. |
| Accessibility | Labelled controls, ~40 px touch targets, 16 px inputs, themed contrast, no orientation lock. |
| Localisation | Indonesian and English, switchable at runtime; every string in `i18n.js`. |
| Privacy | No analytics, no accounts. Settings live in `localStorage`. |

## 7. Correctness of the word list

The suggestion quality depends on which words exist, so the list is generated
from cross-checked public sources rather than curated by hand. The rules and
sources are documented in [DESIGN.md](DESIGN.md#word-list-generation) and
implemented in `scripts/build-words.mjs`. Ground truth for "is this an acceptable
answer" is the 2,315-word official Wordle answer list; heuristics never override
it.

## 8. Assumptions

- The target games accept the same kind of answers as NYT Wordle: no plurals, no
  regular inflections, no proper nouns, US spelling.
- The user reads either Indonesian or English.
- "Get the Word" has no published dictionary, so its accepted-answer set is
  approximated. This is the single largest source of residual error.
