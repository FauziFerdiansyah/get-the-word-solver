# 🤝 Contributing to Get the Word Solver

Terima kasih sudah tertarik untuk berkontribusi! Proyek ini open source dan kami menyambut kontribusi dari siapa saja.

Thank you for your interest in contributing! This project is open source and we welcome contributions from everyone.

---

## 🌐 Bahasa / Language

Kontribusi bisa dalam Bahasa Indonesia atau English. Commit messages sebaiknya dalam English agar konsisten.

---

## 🚀 Quick Start

```bash
# 1. Fork repo ini di GitHub

# 2. Clone fork kamu
git clone git@github.com:YOUR_USERNAME/get-the-word-solver.git
cd get-the-word-solver

# 3. Install dependencies
npm install

# 4. Jalankan development server
npm run dev

# 5. Buka http://localhost:5173
```

---

## 📋 Cara Kontribusi

### 🐛 Melaporkan Bug

1. Cek [Issues](https://github.com/FauziFerdiansyah/get-the-word-solver/issues) — mungkin sudah dilaporkan
2. Buat issue baru dengan template:
   - **Judul**: Deskripsi singkat bug
   - **Langkah reproduksi**: Step-by-step cara memunculkan bug
   - **Expected**: Apa yang seharusnya terjadi
   - **Actual**: Apa yang terjadi
   - **Screenshot/Video**: Jika memungkinkan
   - **Device/Browser**: HP/desktop, browser apa

### 💡 Mengusulkan Fitur

1. Buat issue dengan label `enhancement`
2. Jelaskan fitur yang diinginkan dan kenapa berguna
3. Sertakan mockup/wireframe jika ada

### 🔧 Submit Pull Request

1. **Fork** repo ini
2. Buat branch baru dari `main`:
   ```bash
   git checkout -b feature/nama-fitur
   ```
3. Lakukan perubahan
4. Pastikan lint pass:
   ```bash
   npm run lint
   ```
5. Pastikan build sukses:
   ```bash
   npm run build
   ```
6. Commit dengan format yang benar (lihat di bawah)
7. Push ke fork kamu:
   ```bash
   git push -u origin feature/nama-fitur
   ```
8. Buat **Pull Request** ke `main`

---

## 📝 Commit Convention

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

| Type | Digunakan untuk |
|------|-----------------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `style` | Perubahan UI/styling (tanpa perubahan logic) |
| `refactor` | Restructure code tanpa ubah behavior |
| `docs` | Update dokumentasi |
| `chore` | Build system, dependencies, config |
| `perf` | Performance improvement |
| `i18n` | Perubahan terkait translation/bahasa |

**Contoh:**
```
feat: add Spanish language support
fix: keyboard not responding on iOS Safari
style: improve dark mode contrast on ocean theme
docs: update README with deployment steps
```

---

## 🏗️ Arsitektur & Convention

### Struktur File

```
src/
├── components/    → React komponen (1 file = 1 komponen)
├── contexts/      → React context (global state)
├── data/          → Static data (themes, words, translations)
├── utils/         → Utility functions (solver, sound, dictionary)
```

### Code Style

- **React**: Functional components + hooks only
- **Styling**: Tailwind CSS utility classes + inline `style` untuk dynamic theme colors
- **State**: React Context untuk global state, `useState` untuk local
- **Naming**: camelCase untuk functions/variables, PascalCase untuk components
- **No external CSS files** — semua styling via Tailwind atau inline

### Menambah Bahasa Baru

1. Edit `src/data/i18n.js`
2. Tambah object baru dengan key language code (e.g., `es`, `ja`)
3. Copy struktur dari `id` atau `en`, terjemahkan semua string
4. Update language toggle di `SettingsModal.jsx`

### Menambah Tema Baru

1. Edit `src/data/themes.js`
2. Tambah entry baru dengan semua color keys yang diperlukan
3. Pastikan kontras teks cukup (terutama `text` vs `bg`, dan `textOnColor` vs `green`/`yellow`)

### Menambah Kata ke Dictionary

1. Edit `src/data/words.js`
2. Kata harus:
   - Valid English word (ada di kamus)
   - Bukan abbreviation, proper noun, slang
   - Bukan simple plural (noun+S) atau verb conjugation (+ED/+ING/+LY)
   - Umum dikenal (bukan kata obscure/archaic)

---

## 🧪 Testing

Saat ini belum ada automated test. Manual testing checklist:

- [ ] Semua 6 tema terlihat bagus di light mode
- [ ] Semua tema terlihat bagus di dark mode
- [ ] Keyboard responsive di layar kecil (iPhone SE / 320px)
- [ ] Sound berfungsi di mobile (Chrome, Safari)
- [ ] Copy to clipboard berfungsi
- [ ] Word definitions load (jika toggle aktif)
- [ ] PWA install prompt muncul di mobile

---

## 🎯 Area yang Butuh Bantuan

- [ ] Tambah bahasa lain (Spanyol, Jepang, dll)
- [ ] Tambah word list untuk bahasa non-English
- [ ] Automated testing (Vitest + Testing Library)
- [ ] Performance audit & optimization
- [ ] Accessibility audit (screen reader, keyboard navigation)
- [ ] Animasi/transisi yang lebih smooth

---

## 📜 Code of Conduct

- Bersikap sopan dan menghargai semua kontributor
- Berikan feedback yang konstruktif
- Tidak ada diskriminasi dalam bentuk apapun
- Fokus pada kualitas dan kegunaan

---

## 📄 Lisensi

Dengan berkontribusi, kamu setuju bahwa kontribusimu akan dilisensikan di bawah [MIT License](LICENSE) yang sama dengan proyek ini.

---

Terima kasih! 🙏
