import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync, statSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
import { SWITCHES } from './data/switches';
import App from './App';

const setup = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  return user;
};

// Every setting is a toggle in a row that also carries its label.
const toggle = async (user, label) => {
  await user.click(screen.getByLabelText('Settings'));
  const row = screen.getByText(label).closest('div');
  await user.click(row.querySelector('button'));
  await user.click(screen.getByLabelText('Tutup'));
};

describe('settings rows', () => {
  it('gives every setting an icon, dark mode included', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));

    // Iconify fetches its icon data over the network, so in jsdom it renders an
    // empty placeholder element rather than an <svg>. The placeholder is still
    // proof that an <Icon> is there: a row without one starts with a text node.
    for (const label of [
      'Mode Malam', 'Efek Suara Ketik', 'Kontras tinggi', 'Petunjuk & penjelasan',
      'Kotak kuning multi-huruf', 'Tombol Enter & Backspace',
    ]) {
      const row = screen.getByText(label).closest('span');
      const first = row.firstElementChild;
      expect(first, `${label} has no icon`).toBeTruthy();
      expect(first.textContent, `${label} starts with text, not an icon`).toBe('');
    }
  });
});

describe('high contrast', () => {
  it('drops the surfaces to pure black with dark mode on', async () => {
    const user = setup();
    await toggle(user, 'Mode Malam');
    await toggle(user, 'Kontras tinggi');

    expect(document.documentElement.classList.contains('contrast-mode')).toBe(true);
    // The page background is what makes an AMOLED screen switch pixels off.
    const page = screen.getByRole('main').parentElement;
    expect(page.style.backgroundColor).toBe('rgb(0, 0, 0)');
  });

  it('goes pure white in light mode instead', async () => {
    const user = setup();
    await toggle(user, 'Kontras tinggi');

    const page = screen.getByRole('main').parentElement;
    expect(page.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('leaves the tile colours alone', async () => {
    const user = setup();
    await toggle(user, 'Kontras tinggi');
    await user.type(screen.getByLabelText('Huruf hijau posisi 1'), 'S');

    // Green still reads as green: it mirrors the game's own tiles.
    const box = screen.getByLabelText('Huruf hijau posisi 1');
    expect(box.style.backgroundColor).not.toBe('rgb(0, 0, 0)');
    expect(box.style.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});

describe('hints', () => {
  it('shows the explanations by default and hides them all on request', async () => {
    const user = setup();
    expect(screen.getByText(/Kotak atas/)).toBeTruthy();
    expect(screen.getByText(/Contoh: A kuning/)).toBeTruthy();

    await toggle(user, 'Petunjuk & penjelasan');

    expect(screen.queryByText(/Kotak atas/)).toBeNull();
    expect(screen.queryByText(/Kotak bawah/)).toBeNull();
    expect(screen.queryByText(/Contoh: A kuning/)).toBeNull();
    expect(screen.queryByText(/Butuh dua huruf yang sama/)).toBeNull();
  });

  it('hides the board hint too', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    expect(screen.getByText(/Ketik tebakanmu per baris/)).toBeTruthy();

    await toggle(user, 'Petunjuk & penjelasan');
    expect(screen.queryByText(/Ketik tebakanmu per baris/)).toBeNull();
  });
});

describe('keyboard section', () => {
  it('has no heading above the keys', () => {
    setup();
    expect(screen.queryByText('Coret Huruf yang Tidak Ada')).toBeNull();
    // The keys themselves are still there.
    expect(screen.getByRole('button', { name: 'Q' })).toBeTruthy();
  });
});

describe('key sound samples', () => {
  it('ships one sprite per switch, each light enough for the web', () => {
    for (const entry of SWITCHES) {
      const file = `public/${entry.file.replace('./', '')}`;
      const size = statSync(file).size;
      expect(size).toBeGreaterThan(10_000);
      expect(size).toBeLessThan(150_000);
    }
    // Only the chosen switch is fetched, so the total is not a download cost.
    expect(SWITCHES.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps the slot layout identical on both sides of the pipeline', () => {
    const builder = readFileSync('scripts/build-key-sounds.mjs', 'utf8');
    const data = readFileSync('src/data/switches.js', 'utf8');
    expect(builder).toMatch(/SLOT_MS = 300/);
    expect(data).toMatch(/SWITCH_SLOT_MS = 300/);
    // The generated data file is what the engine reads, so they cannot drift.
    expect(readFileSync('src/utils/sound.js', 'utf8')).toContain("from '../data/switches'");
    expect(data).toContain('"BACKSPACE"');
  });

  it('covers all three switch characteristics', () => {
    const feels = new Set(SWITCHES.map((s) => s.feel));
    expect([...feels].sort()).toEqual(['clicky', 'linear', 'tactile']);
  });

  it('credits the sample source', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toMatch(/Mechvibes/);
  });
});

describe('random word modal', () => {
  it('is as wide as a section so six tiles are not squeezed', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '6 Huruf' }));
    await user.click(screen.getByRole('button', { name: /Acak Kata/ }));

    const heading = screen.getByRole('heading', { level: 3 });
    const panel = heading.parentElement;
    expect(panel.className).toContain('max-w-sm');
    expect(panel.className).not.toContain('max-w-xs');

    const tiles = within(panel).getAllByText(/^[A-Z]$/);
    expect(tiles).toHaveLength(6);
    for (const tile of tiles) expect(tile.className).toContain('aspect-square');
  });
});
