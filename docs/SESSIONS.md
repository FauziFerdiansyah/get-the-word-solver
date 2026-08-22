# Sessions

Newest first. One entry per working session: what changed, why, and anything the
next agent would otherwise rediscover the hard way.

---

## 2026-08-23 — v2.4.0

- **Delete sound.** The sprite gained a 27th slot from the pack's real Backspace
  recording (keycode 14), rather than reusing a letter. `SPRITE_LAYOUT` is now
  `[...letters, 'BACKSPACE']` and a test compares it against the generator's
  `LAYOUT`, so the two cannot drift.
- **theme-color.** The installed app showed a green stripe above a dark page
  because the meta tag kept the manifest's brand colour. It now tracks
  `theme.bg` from ThemeContext, which makes it compose with all six themes, dark
  mode and high contrast for free.
- **iOS install guide.** iOS never fires `beforeinstallprompt`, so the button used
  to show a single line of text. Replaced with a modal of numbered steps and
  icons, in three variants. iPadOS 13+ reports a Mac UA, so detection also checks
  `navigator.maxTouchPoints`; non-Safari iOS browsers get pointed at Safari, since
  that is where the Share sheet reliably has "Add to Home Screen".

---

## 2026-08-23 — v2.3.0

Six items from a single round of feedback.

- **Sound replaced with real samples.** The synth read as "robotic" because its
  case-resonance layer is a tonal oscillator mapped to a musical scale — 26
  letters became a melody. Real switch recordings have no clear pitch. Mechvibes
  is MIT *and* bundles its audio in-repo (`src/audio/cherrymx-*/sound.ogg`), which
  gave a defensible licence; its 2 MB whole-keyboard sprite was trimmed to the 26
  letters and re-encoded as a 62 kB mono MP3.
  - MP3, not the original Ogg Vorbis: Safari's Vorbis support in
    `decodeAudioData` is unreliable and this has to work on iOS.
  - Fixed 300 ms slots, sample at the slot start, silence after. The padding
    absorbs the uniform decoder delay MP3 prepends to a decoded buffer, so no
    per-letter offset table is needed.
  - The sprite loads on the first user gesture, so the first press of a session
    still uses the synth. Deliberate: a muted visitor should not pay 62 kB.
- **High contrast** setting added to `ThemeContext`, layered on top of
  `resolvedTheme` so it composes with all six themes and with dark mode.
- **Hints** setting hides the explanatory copy in ClueGrid, BoardGrid and the
  results header.
- Dark mode row got the icon it was missing; random word modal widened to
  `max-w-sm` with square tiles; keyboard heading removed.

Testing note: Iconify fetches icon data over the network, so in jsdom it renders
an empty placeholder instead of an `<svg>`. Asserting `querySelector('svg')` can
never pass — assert the placeholder element instead, which still distinguishes a
row that has an icon from one that does not.

---

## 2026-08-23 — v2.2.0

Walkthrough (CoachMark) rewritten after the user called it ugly and out of date.

- Copy: 11 steps → 8, each one short and matching current behaviour. The old copy
  still told users to press "Cari Jawaban" (removed in 2.0.0) and explained the
  `AA` duplicate encoding (also removed).
- Layout: reused the settings sheet's shape — header bar with border, step
  counter, bordered close button, full screen on phones. Added a tappable
  progress bar, labelled Back/Next buttons that stay in place (hiding Back on
  step 1 used to shift Next sideways), and arrow-key / Escape handling.
- Real defect found: icons lived in an `ICONS` array inside the component with 8
  entries while i18n had 11 steps, so steps 9–11 rendered a generic fallback.
  Icons moved into the step data, with a test asserting every step in both
  languages has one.

---

## 2026-08-23 — v2.1.0

Settings polish requested after the v2.0.0 release.

- The title row became a real header bar — sticky with a bottom border, a gear
  icon in a bordered box, and a close button styled like the app's other icon
  buttons. Without the border the sticky title had nothing separating it from the
  content scrolling underneath in the full screen sheet.
- Added a developer credit card linking to the author's site. Verified the URL
  first: `http://fauzi.is-a.dev/` 301s to HTTPS, so the link uses `https://`
  directly rather than paying for a redirect from an HTTPS page.

---

## 2026-08-23 — v2.0.0

Long session driven by live feedback while the user played the game alongside the
app. Grouped by area.

### Word list rebuilt and ranked (MAJOR)

The user reported words that the game rejects (`USED`, `TEEN`) and words that are
not words (`FRIV`). None were in the local `src/data/words.js`, so the whole list
was regenerated rather than patched.

- New `scripts/build-words.mjs` generates the list from words_alpha, WordNet,
  OpenSubtitles, Wikipedia frequency, google-10000-english, the official Wordle
  answers and the LDNOOBW profanity list.
- 1,562 words removed, 4,086 added: 4L 2,042 · 5L 3,234 · 6L 3,940.
- Every word now carries a rank; the solver returns results ordered instead of
  shuffled, and `getTopWords` feeds the random word picker.

Calibration findings worth keeping:

- Function words (`THERE`, `WOULD`, `WHICH`) and `PHOTO`, `VIDEO`, `EMAIL`,
  `LATTE`, `BADLY`, `ODDLY`, `BEING` **are** official Wordle answers. The first
  blacklist deleted them; the answer list now bypasses every heuristic.
- A first-names filter had to be abandoned — `DAISY`, `GRACE`, `PEARL`, `HOLLY`,
  `BILLY`, `ROBIN` are answers. Names are penalised in ranking instead.
- WordNet lists some comparatives (`larger`) as adjective lemmas, so the
  comparative guard uses noun membership only.

### Board mode (MINOR)

Added the 6-row game board (`BoardGrid`, `findMatchesFromBoard`) with the real
duplicate rules, plus `ModeSelector`.

### Single-row input model, three iterations (MAJOR)

1. Started as one letter per box with a green/yellow dot. The solver counted a
   letter listed twice as two copies, which hid correct answers.
2. Replaced with a per-box list of ruled-out letters, where `AA` meant "two A's".
   The user called the encoding weird — correctly, it was undiscoverable.
3. Landed on: dot on the placed letter for green/yellow, plus a ruled-out list
   that dedupes. Two-of-the-same-letter is board mode's job now.

The dot was removed in step 2 and had to be restored; do not remove it again.

### Live suggestions and mobile layout (MINOR)

- Search button removed; results are a `useMemo`.
- `ViewSwitcher`: sticky phone-only Clues/Answers tabs under the header, with a
  live match count. It was briefly moved above the header and moved back.
- Fluid tiles, tighter padding, ~40 px targets, All tier tab added, dark-mode
  fixes for the empty state and conflict box.

### Keyboard (MINOR)

Rebuilt as a 20-column grid after two wrong readings of the game's layout. Final:
Backspace spans the two columns under K and L; Enter is one column wide and two
rows tall, right of L and under P. Decorative, behind a setting.

### Sound engine (MINOR, then a real bug fix)

Synthesised per-letter switch sounds. Two bugs made it silent in a real browser
while passing tests:

- The test sound scheduled its notes with `setTimeout`, so they ran outside the
  user gesture and the browser refused to start audio.
- Key presses retried after a fixed 60 ms guess instead of chaining off
  `resume()`.

Also raised every frequency above 240 Hz; the original 110–250 Hz body was
inaudible on phone speakers. Added a "Tes" button that reports the
`AudioContext` state.

### PWA (MINOR)

Installation never worked because the manifest declared `word.png` (really 64×64)
as 192×192 and 512×512. Generated real icons, dropped the orientation lock so
tablets and desktops qualify, added `display_override`, a 180 px Apple touch
icon, and an install button driven by `beforeinstallprompt`.

### Testing

From zero to 79 tests (Vitest + Testing Library + jsdom). Two traps found while
writing them:

- The toast library renders `<li>`, so unscoped `listitem` queries picked up
  notifications as answers.
- `sound.js` caches its `AudioContext`, so a fresh log per test left the cached
  context reporting into the previous one.

### Notes for whoever is next

- The user repeatedly saw behaviour that contradicted passing tests. Every time,
  a hard reload resolved it — a service worker is registered.
- iOS zoom on focused inputs is handled by `maximum-scale=1.0` in the viewport,
  not by CSS. An earlier `.clue-strip:focus { font-size: 16px }` rule blocked the
  live font shrinking the user asked for.
