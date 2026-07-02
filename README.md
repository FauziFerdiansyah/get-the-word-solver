# 🟩 Get the Word Solver

A lightweight, mobile-first web app to help you solve **Wordle** and **Get the Word** (Microsoft) puzzles instantly — fully client-side, no API needed.

![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Multi-length support** — solve 4, 5, and 6-letter word puzzles
- **Smart filtering** — green (correct position), yellow (wrong position), and disabled letters
- **Curated word list** — SOWPODS dictionary filtered with common English words, no abbreviations/slang/proper nouns
- **6 color themes** — Wordle Classic, Mint Fresh, Sunset Warm, Ocean Blue, Lavender Dream, + Colorblind mode
- **Dark/Light mode** — neo-brutalism styling adapts beautifully to both
- **Typewriter sound effects** — realistic per-letter key sounds with pitch variation
- **Coach mark tutorial** — step-by-step guide for first-time users
- **Responsive layout** — mobile-first (max 450px), desktop shows 50/50 split
- **100% static** — deploys to GitHub Pages with zero backend
- **Goey toast notifications** — smooth feedback on settings changes

---

## 🖥️ Demo

Live: [https://fauziferdiansyah.github.io/get-the-word-solver/](https://fauziferdiansyah.github.io/get-the-word-solver/)

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
├── public/
│   ├── word.png          # App logo & favicon
│   ├── type.wav          # Typewriter key sound
│   ├── error.wav         # Error sound effect
│   └── bell.wav          # Success bell sound
├── src/
│   ├── components/       # React UI components
│   │   ├── ClueGrid.jsx
│   │   ├── Keyboard.jsx
│   │   ├── LevelSelector.jsx
│   │   ├── ResultsList.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── SettingsModal.jsx
│   │   └── CoachMark.jsx
│   ├── contexts/
│   │   └── ThemeContext.jsx
│   ├── data/
│   │   ├── words.js      # Curated word dictionary
│   │   └── themes.js     # Theme color definitions
│   ├── utils/
│   │   ├── solver.js     # Word matching logic
│   │   └── sound.js      # Audio playback engine
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles & Tailwind
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions auto-deploy
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

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

### 4. Commit & Push

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

| Length | Source | Count |
|--------|--------|-------|
| 5 letters | Official NYT Wordle answer list | ~2,315 |
| 4 letters | SOWPODS ∩ Google 10k common words | ~759 |
| 6 letters | SOWPODS ∩ Google 10k common words | ~851 |

All lists are filtered to remove:
- Abbreviations & acronyms
- Proper nouns & brand names
- Simple plurals (noun+S) and verb conjugations (+S, +ED, +ING, +LY)
- Slang, foreign loanwords, and technical jargon

---

## 🛠️ Tech Stack

- **[Vite](https://vite.dev/)** — Lightning-fast build tool
- **[React 19](https://react.dev/)** — UI framework
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[Iconify (Tabler)](https://iconify.design/)** — SVG icons
- **[Goey Toast](https://github.com/anl331/goey-toast)** — Morphing toast notifications
- **Web Audio API** — Zero-latency sound effects

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
