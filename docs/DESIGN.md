# Design

Version: 2.0.0

## Shape of the app

One React tree, no router, no server. `App.jsx` owns every piece of state and
passes it down; there is no global store because the state is small and shallow.

```
App  ── level, mode, clues, clueStates, excluded, board, disabledLetters, category, mobileView
 │
 ├── LevelSelector / ModeSelector / ViewSwitcher      pick what is being edited
 ├── ClueGrid | BoardGrid                             the two input models
 ├── Keyboard                                         cross letters out
 ├── ResultsList                                      ranked output
 └── Settings / CoachMark / RandomWord / Install      side surfaces
```

Suggestions are a `useMemo` over the inputs, not an event handler:

```
inputs change → useMemo → solver → ranked array → split into tiers → render
```

That is why there is no search button. Recomputing on every keystroke is
affordable because the largest candidate list is 3,940 short strings and the
filter is a linear scan with early exits.

## The two input models

**Board mode** mirrors the real game: 6 rows, each row a complete guess with its
own colours. Each row is an independent constraint, which is what makes duplicate
letters exact — a guess showing one T as present and another as absent proves the
answer holds exactly one T. This is the model with no ambiguity, so anything the
single-row model cannot express belongs here.

**Single-row mode** merges everything known onto one row. Each position carries:

- a placed letter, green (this position) or yellow (in the word, not here)
- a list of further letters ruled out of that position

Two rules that took several iterations to get right:

- The same letter under several boxes means **one** copy with several positions
  ruled out. The obvious implementation — one letter per box, count the
  occurrences — claimed two A's when the user only knew "A is not at 2 or 3", and
  hid the correct answer.
- A letter repeated inside one box is **deduped**. An earlier version read `AA` as
  "two A's". It worked, but nobody could discover it, so the encoding was removed
  and the 6-row board is the documented way to say "two of the same letter".

A yellow placed letter is folded into that position's ruled-out list before
solving, so there is one code path rather than two.

## Ranking

Every list in `src/data/words.js` is stored best-first, so a word's rank is its
index. `getWordRank` builds a lookup on demand; the solver sorts matches by it.

Score, per word:

```
0.5 × zipf(OpenSubtitles) + 0.5 × zipf(Wikipedia)   spoken + written familiarity
+ up to 1.2 for being in google-10000-english        everyday web vocabulary
+ 3.5 for being an official Wordle answer            curated "this is an answer"
− up to 2.0 when the count is inflated by name use   JOHN, PETER, BERLIN, JAPAN
```

The name penalty exists because both frequency corpora are case-folded, so
`berlin` inherits the city's frequency while only meaning "a carriage".

The `common` / `rare` split is a score threshold, which is what lets the two
arrays be concatenated and still be globally ordered.

## Word list generation

`scripts/build-words.mjs` downloads seven public sources into a cache directory
and writes `src/data/words.js`. Sources and removal rules are listed in the
[README](../README.md#-word-list-sources); the reasoning behind the two
non-obvious choices:

**Official answers bypass every heuristic.** The 2,315 curated Wordle answers are
evidence, not guesses. They contain `PHOTO`, `EMAIL`, `BEING`, `ODDLY`, `BADLY`
and `THERE` — all of which a "no clippings, no gerunds, no adverbs, no function
words" heuristic would delete. Calibrating against that list is how those rules
got their exceptions.

**Proper nouns are found through capitalisation, not word lists.** WordNet keeps
capitalisation in its data files, so a lemma never observed in lowercase is a
proper noun. A first-names list was tried as a filter and rejected: `DAISY`,
`GRACE`, `PEARL`, `HOLLY`, `OLIVE`, `BILLY` and `ROBIN` are all official Wordle
answers. Names are demoted in ranking instead of removed.

Irregular verb forms (`CAME`, `DREW`, `WROTE`, `BUILT`) are re-admitted after the
lemma gate because curated answer lists use them, while regular inflections
(`USED`, `WALKED`, `RUNNING`) stay out.

## Sound

Key sounds are synthesised, not sampled: a Mechvibes-style pack would add weight
and its licensing is unclear, while a synth gives every letter its own voice for
free. Each press layers a leaf click, a mid-band knock, a case resonance and a
bottom-out tick, with per-letter frequencies and small per-press jitter.

Two constraints shaped the numbers:

- Nothing below ~240 Hz. An earlier version voiced the body at 110–250 Hz, which
  phone speakers cannot reproduce, so presses were inaudible on a handset.
- Pitches climb geometrically (~5% per key) so the ±1.5% jitter can never blur two
  letters together.

Playback waits on `resume()`'s promise. Guessing with `setTimeout` dropped the
first press and every note of the test sound, because the retry then ran outside
the user gesture that a browser requires to start audio.

## Responsive layout

Below 1024 px the input panel and the results are two views behind sticky tabs.
Stacking them meant scrolling past the whole keyboard to read the answers and
back again to change a clue. From 1024 px both are visible side by side and the
tabs disappear.

Tiles are `flex-1` with a max width rather than fixed sizes, so a 6-letter board
fits a 320 px screen (~40 px tiles) and grows to 44–48 px on larger screens.

The keyboard is a 20-column CSS grid — 10 keys with half-key granularity. A
flexbox row-per-line version gave row 2 (9 keys) visibly wider keys than row 1
(10 keys). The grid also lets Enter span two rows in the last column, which is
how the game draws it.

## PWA

The manifest was the reason installation never worked: `word.png` is 64×64 but was
declared as both 192×192 and 512×512, and Chrome rejects an icon whose declared
size does not match the file. Icons are now generated from the real 512×512
source. `orientation` was removed so tablets and desktops are not pinned to
portrait, and `display_override` allows minimal-ui.

The service worker is network-first with a cache fallback, so a stale bundle is
never served while online. Its `CACHE_NAME` must be bumped on release; it is a
static file Vite does not process.

## Known limitations

- "Get the Word" publishes no dictionary, so its accepted answers are
  approximated from the Wordle answer list plus frequency and part-of-speech
  rules. Expect occasional misses in both directions.
- Single-row mode cannot express "two of the same letter" unless one of them is
  green. That is deliberate; board mode covers it.
- Definitions and translation depend on third-party APIs and fail silently.
- The sound engine cannot be verified by ear in CI; tests assert the audio graph,
  not how it sounds.
