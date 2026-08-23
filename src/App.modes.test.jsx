import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { execSync } from 'node:child_process';
import { ThemeProvider } from './contexts/ThemeContext';
import { findMatches } from './utils/solver';
import { getUniqueWords, WORD_LISTS } from './data/words';
import App from './App';

// The pool the dice draws from: the top 30 common matches for those clues. Read
// from the solver rather than the DOM, which only shows the first page.
const RANDOM_POOL = 30;
const commonPool = (letters) => {
  const common = new Set(WORD_LISTS[5].common);
  return findMatches(getUniqueWords(5, 'all'), letters, [], new Set())
    .filter((w) => common.has(w))
    .slice(0, RANDOM_POOL);
};

const renderApp = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  return user;
};

const greenBox = (n) => screen.getByLabelText(`Huruf hijau posisi ${n}`);
const boardCell = (row, col) => screen.getByLabelText(`Baris ${row}, kotak ${col}`);
const toBoard = (user) => user.click(screen.getByRole('button', { name: /6 Baris/ }));
const toSingle = (user) => user.click(screen.getByRole('button', { name: /1 Baris/ }));

describe('the two modes are independent', () => {
  it('resetting the board leaves the clue row untouched', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    await toBoard(user);
    await user.type(boardCell(1, 1), 'C');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    expect(boardCell(1, 1).value).toBe('');

    await toSingle(user);
    expect(greenBox(1).value).toBe('S');
  });

  it('resetting the clue row leaves the board untouched', async () => {
    const user = renderApp();
    await toBoard(user);
    await user.type(boardCell(2, 1), 'M');

    await toSingle(user);
    await user.type(greenBox(1), 'S');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    expect(greenBox(1).value).toBe('');

    await toBoard(user);
    expect(boardCell(2, 1).value).toBe('M');
  });

  it('keeps crossed-out letters per mode', async () => {
    const user = renderApp();
    // Cross T out while on the clue row.
    await user.click(screen.getByRole('button', { name: 'T' }));
    expect(screen.getByRole('button', { name: 'T' }).getAttribute('aria-pressed')).toBe('true');

    // The board starts with a clean keyboard…
    await toBoard(user);
    expect(screen.getByRole('button', { name: 'T' }).getAttribute('aria-pressed')).toBe('false');

    // …and the clue row still remembers its own.
    await toSingle(user);
    expect(screen.getByRole('button', { name: 'T' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('still clears both when the word length changes', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await toBoard(user);
    await user.type(boardCell(1, 1), 'C');

    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));

    expect(boardCell(1, 1).value).toBe('');
    await toSingle(user);
    expect(greenBox(1).value).toBe('');
  });
});

describe('reset confirmation', () => {
  it('asks before throwing work away', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    // Nothing is gone yet.
    expect(greenBox(1).value).toBe('S');
    expect(screen.getByText(/Kosongkan semua clue/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Batal' }));
    expect(greenBox(1).value).toBe('S');
  });

  it('names the mode it is about to clear', async () => {
    const user = renderApp();
    await toBoard(user);
    await user.type(boardCell(1, 1), 'C');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText(/Kosongkan papan 6 Baris/)).toBeTruthy();
  });

  it('does not ask when there is nothing to lose', () => {
    renderApp();
    // Reset is disabled while the mode is empty, so there is nothing to confirm.
    expect(screen.getByRole('button', { name: 'Reset' }).disabled).toBe(true);
  });
});

describe('random word', () => {
  it('draws from the matching answers once clues are entered', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await user.type(greenBox(2), 'T');

    await user.click(screen.getByRole('button', { name: /Acak Kata/ }));
    const dialog = screen.getByRole('heading', { level: 3 }).parentElement;
    // The tiles cycle for about a second before settling on the draw.
    await waitFor(
      () => expect(within(dialog).getByText(/cocok dengan clue-mu/)).toBeTruthy(),
      { timeout: 4000 }
    );

    const drawn = within(dialog).getAllByText(/^[A-Z]$/).map((el) => el.textContent).join('');
    expect(drawn).toHaveLength(5);
    expect(drawn.startsWith('ST')).toBe(true);
    expect(commonPool(['S', 'T', '', '', ''])).toContain(drawn);
  });

  it('falls back to the level top words when nothing is entered', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /Acak Kata/ }));

    const dialog = screen.getByRole('heading', { level: 3 }).parentElement;
    await waitFor(
      () => expect(within(dialog).getByText(/paling sering muncul di game/)).toBeTruthy(),
      { timeout: 4000 }
    );
  });

  it('prefers the common tier over the rare one', async () => {
    const user = renderApp();
    // A prefix with matches in both tiers.
    await user.type(greenBox(1), 'B');

    await user.click(screen.getByRole('button', { name: /Acak Kata/ }));
    const dialog = screen.getByRole('heading', { level: 3 }).parentElement;
    await waitFor(
      () => expect(within(dialog).getByText(/cocok dengan clue-mu/)).toBeTruthy(),
      { timeout: 4000 }
    );
    const drawn = within(dialog).getAllByText(/^[A-Z]$/).map((el) => el.textContent).join('');

    // The draw comes from the top of the common list, never the rare tail.
    const pool = commonPool(['B', '', '', '', '']);
    expect(pool).toContain(drawn);
    const rare = new Set(WORD_LISTS[5].rare);
    expect(rare.has(drawn)).toBe(false);
  });
});

describe('icons are square', () => {
  const contentBox = (file) =>
    execSync(`magick ${JSON.stringify(`public/${file}`)} -alpha off -fuzz 5% -trim -format "%w %h" info:`)
      .toString().trim().split(/\s+/).map(Number);

  it('fills its canvas rather than sitting in a circle', () => {
    for (const file of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
      const [w, h] = contentBox(file);
      expect(Math.abs(w - h), `${file} is not square`).toBeLessThanOrEqual(4);
      // A circular logo leaves white corners, so its trimmed box would be
      // noticeably smaller than the canvas. A square one reaches the edges.
      const canvas = Number(
        execSync(`magick ${JSON.stringify(`public/${file}`)} -format "%w" info:`).toString()
      );
      expect(w / canvas).toBeGreaterThan(0.97);
    }
  });

  it('keeps the maskable icon square inside the safe zone', () => {
    const [w, h] = contentBox('icon-maskable-512.png');
    expect(Math.abs(w - h)).toBeLessThanOrEqual(4);
    expect(Math.max(w, h)).toBeLessThanOrEqual(410);
  });

  it('shows a square icon on the launch screen', () => {
    const source = execSync('cat src/components/LaunchScreen.jsx').toString();
    expect(source).not.toMatch(/rounded-full/);
  });
});
