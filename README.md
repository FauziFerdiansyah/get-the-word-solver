# 🟩 Get The Word Solver

A lightweight, mobile-first web app to help you find answers for **Get The Word!** (Microsoft) and **Wordle** puzzles instantly — fully client-side, no API needed.

![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Multi-length support** — solve 4, 5, and 6-letter word puzzles
- **Two input modes** — a single combined clue row, or the full **6-row board** where every guess is entered on its own row with grey/green/yellow tiles
- **Live suggestions** — there is no search button: the ranked list updates as you type
- **Phone view switcher** — a sticky Clues / Answers toggle with a live match count, so you never scroll past the keyboard to read the suggestions
- **Duplicate-safe yellows** — each box has its own "in the word but not here" strip, so the same letter can be yellow at several positions (`A` under box 2 and 3) without pretending the answer holds two of them; an optional setting lets one box rule out up to 6 letters at once
- **Smart filtering** — green (correct position), yellow (wrong position), grey (absent), and disabled letters, with correct duplicate-letter handling
- **Ranked suggestions** — every word carries a rank, so the most likely answer is always first
- **Game-like keyboard** — 20-column grid where Backspace fills the two columns under K and L and Enter is the tall key right of L, plus a physical press effect
- **Curated word list** — auto-generated and cross-checked against WordNet, two frequency corpora and the official Wordle answer list; no plurals, inflections, proper nouns, abbreviations or slang
- **6 color themes** — Wordle Classic, Mint Fresh, Sunset Warm, Ocean Blue, Lavender Dream, + Colorblind mode
- **Dark/Light mode** — neo-brutalism styling adapts beautifully to both
- **Mechanical key sounds** — a real Cherry MX Blue recording per letter, 62 kB for all 26, with a synthesised fallback and a "Test" button in Settings
- **High contrast mode** — true black (#000) for AMOLED screens, clean white in light mode
- **Hideable hints** — switch the explanations off once you know the app
- **In-app version history** — every release note, read straight from CHANGELOG.md
- **In-app version history** — every release note, read straight from CHANGELOG.md
- **Random word** — drawn from the words currently matching your clues, common tier first
- **Saved sessions** — keep a puzzle you are working on and reopen it later, with a preview and the exact time it was saved; stored on your device
- **Coach mark tutorial** — step-by-step guide for first-time users
- **Mobile-first responsive** — fluid tiles that fit a 320px phone at every word length, 10-column keyboard grid, 44px tap targets, and 16px inputs so iOS never zooms on focus; desktop shows a 50/50 split
- **Installable (PWA)** — one-tap install where the browser supports it, plus an illustrated step-by-step guide on iOS; correctly sized 192/512/maskable icons and a top bar that matches the theme
- **100% static** — deploys to GitHub Pages with zero backend
- **Goey toast notifications** — smooth feedback on settings changes
- **Dark-mode safe** — every surface is themed, including empty states and conflict warnings

---

## 🖥️ Demo

Live: [https://fauzi.is-a.dev/get-the-word-solver/](https://fauzi.is-a.dev/get-the-word-solver/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone git@github.com:FauziFerdiansyah/get-the-word-solver.git

# Navigate to project directory
cd get-the-word-solver

# Install dependencies
npm install
```

### Development

```bash
# Start dev server with hot reload
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Changes auto-refresh instantly.

### Build for Production

```bash
# Build static files
npm run build

# Preview production build locally
npm run preview
```

Output goes to the `dist/` folder, ready for static hosting.

---

## 📦 Deployment (GitHub Pages)

This project includes a GitHub Actions workflow that auto-deploys on push to `main`.

1. Push your code to the `main` branch
2. Go to **Settings → Pages → Source** → select **"GitHub Actions"**
3. Every push to `main` will automatically build and deploy

Manual deployment:
```bash
npm run build
# Upload the dist/ folder to your hosting
```

---

## 🎨 Themes

| Theme | Description |
|-------|-------------|
| Wordle Classic | Traditional green/yellow like NYT Wordle |
| Mint Fresh | Vibrant mint green & purple (default) |
| Sunset Warm | Warm orange tones |
| Ocean Blue | Cool blue & teal |
| Lavender Dream | Soft purple pastels |
| Buta Warna | Colorblind-friendly (blue/orange instead of green/yellow) |

All themes support Dark Mode (except Buta Warna which stays consistent for accessibility).

---

## 🏗️ Project Structure

```
get-the-word-solver/
├── public/                       # served as-is
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # service worker (network-first + cache)
│   ├── icon-192.png              # generated icons: any purpose
│   ├── icon-512.png
│   ├── icon-maskable-512.png     # content inside Android's centre-80% safe zone
│   ├── apple-touch-icon.png      # 180px, iOS home screen
│   ├── og-image.png              # 1200×630 social preview
│   ├── screen-light.svg          # launch screen backgrounds
│   ├── screen-dark.svg
│   ├── keys.mp3                  # generated: 27 key samples in 300ms slots
│   ├── error.wav                 # error and success cues
│   ├── bell.wav
│   ├── word.png                  # favicon
│   ├── word-large.png            # square logo, source for the icons
│   ├── favicon.ico / favicon.svg / icons.svg
│   └── id.png / en.png           # language flags
├── design/                       # source art, not deployed
│   ├── word-circle.png
│   └── type.wav
├── src/
│   ├── App.jsx                   # owns every piece of state
│   ├── main.jsx                  # entry point, service worker registration
│   ├── index.css                 # Tailwind entry, theme overrides, keyframes
│   ├── components/
│   │   ├── LevelSelector.jsx     # 4 / 5 / 6 letters
│   │   ├── ModeSelector.jsx      # 1 row / 6 rows
│   │   ├── ViewSwitcher.jsx      # phone-only clues / answers tabs
│   │   ├── ClueGrid.jsx          # single-row input: green box + ruled-out box
│   │   ├── BoardGrid.jsx         # 6-row board, one guess per row
│   │   ├── Keyboard.jsx          # 20-column grid, letter crossing-out
│   │   ├── ResultsList.jsx       # ranked suggestions, tier tabs, copy
│   │   ├── SettingsModal.jsx     # themes, language, sound, toggles
│   │   ├── SessionManager.jsx    # sessions popup: save / open / delete
│   │   ├── ChangelogModal.jsx    # version history, parsed from CHANGELOG.md
│   │   ├── CoachMark.jsx         # 8-step walkthrough
│   │   ├── RandomWordModal.jsx   # dice, drawn from the current answers
│   │   ├── ConfirmModal.jsx      # reset / level-change confirmation
│   │   ├── LaunchScreen.jsx      # in-app splash for the installed app
│   │   ├── InstallButton.jsx     # one-tap install where supported
│   │   ├── InstallGuideModal.jsx # step-by-step guide for iOS and desktop
│   │   └── InstallProgressModal.jsx  # offline precache progress
│   ├── contexts/
│   │   └── ThemeContext.jsx      # theme, dark mode, contrast, every setting
│   ├── data/
│   │   ├── words.js              # GENERATED, rank-ordered word lists
│   │   ├── themes.js             # 6 colour themes
│   │   ├── i18n.js               # id / en strings
│   │   └── changelog.js          # parses CHANGELOG.md for the in-app history
│   ├── utils/
│   │   ├── solver.js             # findMatches (1 row), findMatchesFromBoard (6)
│   │   ├── sound.js              # sample playback + synth fallback
│   │   ├── sessions.js           # saved sessions in localStorage
│   │   ├── platform.js           # standalone / iOS detection
│   │   ├── dictionary.js         # Free Dictionary API + cache
│   │   └── translator.js
│   ├── *.test.js / *.test.jsx    # 159 tests: solver, sound, and one file per
│   │                             # UI area (clue, board, view, settings,
│   │                             # sessions, coach, sound, install, pwa,
│   │                             # regressions)
│   ├── test-setup.js             # jsdom shims, cleanup
│   └── test-audio-mock.js        # Web Audio stand-in shared by tests
├── scripts/
│   ├── build-words.mjs           # regenerates src/data/words.js
│   └── build-key-sounds.mjs      # regenerates public/keys.mp3
├── docs/
│   ├── SRS.md / REQUIREMENTS.md / DESIGN.md / SKILLS.md / SESSIONS.md
├── .github/workflows/deploy.yml  # builds and deploys to GitHub Pages
├── AGENTS.md                     # rules for AI agents, versioning policy
├── CHANGELOG.md
├── index.html
├── vite.config.js                # build config, __APP_VERSION__ define
├── vitest.config.js              # jsdom environment for tests
└── package.json
```

---

## 📚 Documentation

| Document | Contents |
|---|---|
| [AGENTS.md](AGENTS.md) | Working rules for AI agents, versioning policy, repo map |
| [docs/SRS.md](docs/SRS.md) | Software requirements specification |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Numbered requirements, each mapped to the test that verifies it |
| [docs/DESIGN.md](docs/DESIGN.md) | Architecture and the reasoning behind the harder decisions |
| [docs/SKILLS.md](docs/SKILLS.md) | Playbooks: regenerate the word list, add a theme or setting, tune sounds |
| [docs/SESSIONS.md](docs/SESSIONS.md) | Log of work sessions |
| [CHANGELOG.md](CHANGELOG.md) | Released versions |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

### 1. Fork & Clone

```bash
git fork https://github.com/FauziFerdiansyah/get-the-word-solver.git
git clone git@github.com:YOUR_USERNAME/get-the-word-solver.git
cd get-the-word-solver
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style and conventions
- Use functional components with hooks
- Keep components small and focused
- Test on mobile viewport (375px width)

### 4. Version, Commit & Push

Every change bumps the version — PATCH for small, MINOR for new capability,
MAJOR for breaking changes. See [AGENTS.md](AGENTS.md#versioning).


```bash
git add .
git commit -m "feat: description of your change"
git push -u origin feature/your-feature-name
```

### 5. Open a Pull Request

Go to the repository on GitHub and open a PR against `main`. Describe your changes clearly.

### Commit Convention

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | UI/styling changes |
| `refactor:` | Code restructuring |
| `docs:` | Documentation updates |
| `chore:` | Build/config changes |

---

## 📋 Word List Sources

`src/data/words.js` is generated, not hand-written. Regenerate it with:

```bash
npm run build:words   # downloads its sources into /tmp/wl on first run
npm test              # word-list and solver checks
```

| Length | Words | Common tier | Rare tier |
|--------|-------|-------------|-----------|
| 4 letters | 2,042 | 1,202 | 840 |
| 5 letters | 3,234 | 2,423 | 811 |
| 6 letters | 3,940 | 1,583 | 2,357 |

Sources cross-checked by `scripts/build-words.mjs`:

| Source | Used for |
|--------|----------|
| [words_alpha](https://github.com/dwyl/english-words) | dictionary validity |
| [WordNet 3](https://wordnet.princeton.edu/) | lemmas, part of speech, proper-noun detection |
| [OpenSubtitles en_50k](https://github.com/hermitdave/FrequencyWords) | spoken familiarity |
| [Wikipedia word frequency](https://github.com/IlyaSemenov/wikipedia-word-frequency) | written familiarity |
| [google-10000-english](https://github.com/first20hours/google-10000-english) | top common web words |
| [Official Wordle answers](https://github.com/Kinkelin/WordleCompetition) | curated "typical puzzle answer" list (2,315 words) |
| [LDNOOBW list](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) | profanity filter |

Words are removed when they are not a real dictionary lemma (`FRIV`), a proper
noun or abbreviation (`PARIS`, `CHRIST`), a plural or 3rd-person form (`CATS`),
a regular past tense (`USED`), a gerund (`RUNNING`), a comparative or
superlative (`LARGER`, `LARGEST`), an `-LY` adverb (`REALLY`), a British-only
spelling (`COLOUR`), profanity, a roman numeral, or too rare in both frequency
corpora. Informal clippings the games reject (`TEEN`) sit in an explicit
blacklist.

The 2,315 official Wordle answers bypass every heuristic — they are ground
truth for what counts as an acceptable answer, which is why `PHOTO`, `EMAIL`,
`BEING` and `ODDLY` stay in the list.

**Ranking:** each list is stored best-first, so a word's rank is its position.
The score blends spoken frequency, written frequency, a top-10k bonus and a
strong bonus for official answers, minus a penalty for words whose corpus
counts come mostly from being a name (`JOHN`, `BERLIN`).

## 🛠️ Tech Stack

- **[Vite](https://vite.dev/)** — Lightning-fast build tool
- **[React 19](https://react.dev/)** — UI framework
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[Iconify (Tabler)](https://iconify.design/)** — SVG icons
- **[Goey Toast](https://github.com/anl331/goey-toast)** — Morphing toast notifications
- **Web Audio API** — Per-key sample playback from a single MP3 sprite, with a runtime synth fallback

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Fauzi Ferdiansyah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- Word list sourced from [Wordle Competition](https://github.com/Kinkelin/WordleCompetition) and [SOWPODS](https://github.com/jesstess/Scrabble)
- Frequency data from [Google 10,000 English](https://github.com/first20hours/google-10000-english)
- Icons by [Tabler Icons](https://tabler.io/icons) via Iconify
- Toast by [Goey Toast](https://github.com/anl331/goey-toast)
- Key sounds: Cherry MX Blue samples from [Mechvibes](https://github.com/hainguyents13/mechvibes)
  (MIT © 2021 Hai Nguyen), trimmed to the 26 letters by `scripts/build-key-sounds.mjs`
