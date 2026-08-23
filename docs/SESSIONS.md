# Sessions

Newest first. One entry per working session: what changed, why, and anything the
next agent would otherwise rediscover the hard way.

---

## 2026-08-23 — v2.12.0

- **The "Disalin" alert on Android** was the `title` attribute on the copy button:
  browsers render it as a native tooltip, which after a tap reads as a second,
  unstyled popup. `aria-label` carries the same text without drawing anything.
- **There is no audio permission to request.** Browsers gate audio on a user
  gesture, not on a permission, so `navigator.permissions` has nothing to offer
  here. The closest equivalent is a button whose click is itself the gesture:
  "Aktifkan Suara", shown only while `getAudioReport().state !== 'running'`.
- **Launching the installed app from the browser is not possible.** No API exists
  for it (`getInstalledRelatedApps` can detect, never launch), so the install
  progress just closes with "Berhasil Diinstall" rather than pretending.
- **Updating an installed app**, which is what the user asked about: no store, no
  update API. The signal is `CACHE_NAME` in `sw.js` changing each release, which
  makes it a different file, so the browser installs a new worker. `main.jsx`
  listens for `updatefound` plus an already-`waiting` worker, calls
  `registration.update()` on launch since an installed app does not always
  re-check, and fires `ws-update-ready`. `UpdateBanner` offers a reload that
  deletes the caches first — without that, a network-first worker can still hand
  back the old bundle.
- Toast descriptions: `gooeyToast` takes `description`, so the iOS ringer-switch
  caveat sits under the title instead of being concatenated for every platform.

---

## 2026-08-23 — v2.11.1

**iOS had no sound while Android did.** The bug was the unlock being one-shot:

```js
let loaded = false;
export async function warmUp() {
  if (loaded) return;   // ← set on the first pointerdown, forever
  ...
  silent.start(0);      // ← the actual unlock, inside that guard
}
```

`warmUp` was wired to a single `onPointerDown` on the root div. Android accepts
`pointerdown` as a gesture that may start audio, so the first tap unlocked it and
everything worked. Safari does not reliably accept `pointerdown`; its attempt
missed, `loaded` was already true, and no later tap could try again.

Split into `warmUp` (load buffers once) and `unlock` (retry every gesture until
`state === 'running'`), with `installAudioUnlock` attaching document listeners for
`pointerdown`, `touchend`, `click` and `keydown` in the capture phase and removing
them once running. Test drives a mock that refuses `resume()` twice before
accepting, which fails against the old one-shot code.

Worth remembering: any "unlock on first gesture" flag that is set before knowing
the unlock succeeded has this shape of bug.

The remaining iOS cause is outside our reach — Safari mutes Web Audio with the
ringer switch — so the Test button now says so on iOS instead of leaving the user
guessing, and reports whether samples or the synth are in play.

---

## 2026-08-23 — v2.11.0

- **Settings popups leaked between openings.** `SettingsModal` returned `null`
  when closed but stayed mounted, so its `showSessions` / `showChangelog` state
  survived — reopening Settings reopened whatever was last shown. Now mounted
  conditionally from App. Any component that owns popup state and hides itself
  with an early `return null` has this bug waiting.
- **Toasts.** `gooeyToast` exposes `.success`, `.error`, `.warning` and `.info`;
  every call site now picks one instead of prefixing emoji. Durations went up by a
  second across the board — a test enforces a 2.5s floor so nothing slips back.
  Centring needed CSS: `.gooey-content` had no flex of its own and `.gooey-title`
  carries `padding: 0 4px 2px 2px`, which is what pushed labels off-centre.
- **Single-word copy** shows a tick on the button for 1.2s rather than a toast.
  A notification for an action the user just performed is noise; the toast stays
  for Copy All, where the count matters.
- Renamed labels, and the sound row now says what it plays (Cherry MX Blue
  recordings) with an icon on its Test button.

---

## 2026-08-23 — v2.10.0

- **Stacked sticky bars.** The tier tabs stick under the Clues/Answers bar, whose
  height varies with the breakpoint. Rather than hardcode an offset, ViewSwitcher
  measures itself with a ResizeObserver and publishes `--view-switcher-h`, which
  the tabs use as their `top`. Nothing special was needed to keep them off the
  clue view: that panel is `display:none` there, so a sticky child cannot paint.
  `lg:static` returns them to normal flow on desktop, where both panels are shown.
- **Icons back to circular, and transparency now depends on the job.** The
  any-purpose icons are transparent so the launch screen shows artwork rather than
  a white square — that white was the whole reason the square icons looked wrong.
  Maskable stays opaque (the platform crops it) and the iOS touch icon stays opaque
  (iOS composites transparency onto black). Quantising to 256 colours kept the
  circle's edge while taking icon-512 from 180 kB to 52 kB.
- The icon tests were asserting "square and white". Rewritten to assert the
  reasons instead, so they still mean something after a design change.

---

## 2026-08-23 — v2.9.1

The README edit for v2.9.0 never ran: it sat behind a `&&` chain whose earlier
`grep` found nothing and returned non-zero, so the commit went out without it.
Fixed, and replaced the one-off check I had run by hand with a test that walks
`src/` and fails when the README does not name a source file. A convention only
holds if something enforces it.

---

## 2026-08-23 — v2.9.0

- **In-app changelog.** `src/data/changelog.js` imports `CHANGELOG.md` with Vite's
  `?raw` and parses the subset of Markdown the file uses. Chosen over a hand-kept
  data file so the two cannot drift; a test compares the parsed versions against
  the file's `##` headings and against `package.json`.
- **AGENTS.md** now states the changelog entry is required and documents the format
  the parser depends on. It is a product surface, so a malformed entry is a
  visible defect.
- **1.x history reconstructed** from `git log --reverse`. The version stayed at
  1.0.0 through all of it, so the numbers are assigned after the fact — the
  changelog says so rather than implying those releases existed.
- **Tier tab flicker** was rows keyed by word: every switch unmounted ten `<li>`
  and mounted ten more. Keyed by position now. That reuses the DOM node for a
  different word, so `WordItem` stores its definition alongside the word it
  belongs to and resets during render when they disagree — otherwise a reused row
  would briefly show the previous word's definition.
- Install button, empty state and copy control restyled.

---

## 2026-08-23 — v2.8.0

Sessions reworked into a popup after the first version was a block inside the
settings sheet, where the growing list pushed the toggles down.

- `SessionManager` is now a dialog with the same shape as the other sheets:
  bordered sticky header, slot counter, full screen on a phone.
- `formatSavedAt` uses `Intl.DateTimeFormat` with the app language, printing
  weekday, date and h:m:s. Wrapped in try/catch and falling back to ISO, because
  a bad locale tag or a stale timestamp should not take the list down.
- `sessionPreview` returns the tiles to draw: the placed letters for single-row
  mode, or the last board row with content — that is the guess in progress, which
  is what makes a session recognisable.
- Delete is two taps, done inline rather than with a nested ConfirmModal; stacking
  dialogs on a phone is worse than a row that changes its buttons.

Test note: the per-session Open button disappears while a row is in its confirm
state, so a test that waits for it after tapping delete will fail. Assert the
Cancel button instead.

---

## 2026-08-23 — v2.7.1

Renamed the app to "Get The Word Solver". The name appeared in seven places —
i18n (both languages), the `<title>`, three meta tags, the manifest's `name` and
`short_name`, and hardcoded in SettingsModal's version line. The last one now
reads `t.appTitle`, so there is one fewer copy to forget. A test asserts the name
in every surface and that the old one appears nowhere.

`short_name` is "GTW Solver": a launcher truncates anything much longer.

---

## 2026-08-23 — v2.7.0

- **Saved sessions** in `src/utils/sessions.js` plus a `SessionManager` inside the
  settings sheet. Storage is `localStorage`: cookies would be sent with every
  request for no reason on a static site and cap out near 4 kB. Sets are stored as
  arrays because JSON has none, and `isValidSession` checks every array against
  the word length it claims — a saved session is user data that an older build may
  have written, so it is validated rather than trusted. Capped at 12.
  `snapshot()` is called at save time, not on render, so the list can never hold a
  stale board.
- README's structure section had drifted badly: it listed 11 components when there
  are 16, and none of the utils, docs or generated assets. Rewritten from the real
  tree. Demo URL updated to the custom domain.
- `public/word-circle.png` (116 kB) and `public/type.wav` (55 kB) were dead weight
  being deployed — the icons are square now and the key sounds are samples. Moved
  to `design/`, which is not served.
- Renamed `App.install3.test.jsx` to `App.regressions.test.jsx`; the number told
  nobody anything.

---

## 2026-08-23 — v2.6.0

- **Square icons.** Regenerated everything from `word-large.png` rather than
  `word-circle.png`. Worth knowing: a PWA cannot force the icon's outline. A
  `purpose: maskable` icon is cropped to whatever shape the launcher uses, so the
  only thing under our control is keeping the artwork square and inside the
  centre-80% safe zone. `word-circle.png` is now unused.
- **Mode isolation.** `disabledLetters` became `disabledByMode` — keyed by mode,
  with the active set derived. Reset clears only the active mode; level change
  still clears both because the box count changes.
- **Reset confirmation** reuses ConfirmModal, with a message naming the mode.
  `confirmReset` was split into `confirmLevelChange` / `confirmResetClues` /
  `confirmResetBoard`.
- **Random word** now draws from the top 30 common matches, then rare, then the
  level's top words. Its test computes the expected pool from the solver instead
  of reading the DOM, which only shows the first page of ten.
- **Install progress made honest.** It counted files, so it hit 100% instantly and
  then appeared frozen while the OS worked. Now: fetches with `cache: 'reload'`
  so bytes really move, reports megabytes, gives downloading 90% of the bar, and
  holds the last 10% until `appinstalled` fires (15 s cap, since some browsers
  never send it). That stretch shows a stripe rather than a number, because it has
  no measurable size.

---

## 2026-08-23 — v2.5.0

Field report with two real logic bugs in it.

- **The HEART bug.** Reproduced immediately: R/A yellow + T green returned 0
  matches even though HEART satisfied every positional constraint. Cause was my
  own rule, "green + yellow of one letter = two copies". True within a single
  guess, false on a row that merges several guesses. Yellow now raises the
  minimum to one and no further; two greens still count as two.
- **Install progress could never show.** Accepting the prompt calls
  `setPromptEvent(null)`, and the component's own guard `if (!promptEvent &&
  !isIOS) return null` then unmounted it along with the overlay. Found by the
  test, not by inspection.
- Mode switching no longer calls `clearInputs`. The clue row and the board are
  separate state, so each survives a round trip.
- Empty results now name letters that are both crossed out and marked present.
  That contradiction is the likeliest cause of the intermittent "no answers"
  report, and it was invisible before.
- Green letter clears its position's ruled-out box; note this does lose the "this
  letter is somewhere" fact, which is why it only fires for green.

Platform work:

- A manifest cannot carry a splash image — Android builds its splash from `name`,
  `background_color` and the icons, full stop. iOS can, but only through a matrix
  of `apple-touch-startup-image` PNGs per exact device size: ~300 kB of JPEG for
  four iPhones, and nothing for the rest. Painting the launch screen inside the
  app instead costs two 10 kB SVGs and works on every platform.
- The square-then-round icon the user saw is Android applying its circle mask to
  the maskable icon. Their replacement had content at 90% of the canvas, outside
  the 80% safe zone, so its edges were being shaved. Regenerated at 80%.
- `public/` held 3.7 MB, all of it deployed: a 2 MB `word-large.png`, a 1.2 MB
  `word-circle.png`, and 500 kB of unquantised icons. Now 560 kB.

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
