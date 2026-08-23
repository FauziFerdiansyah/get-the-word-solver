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

describe('icons', () => {
  const info = (file, fmt) =>
    execSync(`magick ${JSON.stringify(`public/${file}`)} -format ${JSON.stringify(fmt)} info:`).toString().trim();
  const contentBox = (file) =>
    execSync(`magick ${JSON.stringify(`public/${file}`)} -alpha off -fuzz 5% -trim -format "%w %h" info:`)
      .toString().trim().split(/\s+/).map(Number);

  it('leaves the any-purpose icons transparent', () => {
    // The launch screen paints this over artwork. An opaque icon put a white
    // square on top of it, which is what made the square version look wrong.
    for (const file of ['icon-192.png', 'icon-512.png']) {
      expect(info(file, '%[opaque]'), `${file} is opaque`).toBe('False');
      expect(info(file, '%[pixel:p{3,3}]')).toMatch(/,0\)$/); // corner fully clear
    }
  });

  it('keeps the maskable icon opaque and inside the safe zone', () => {
    // The platform crops a maskable icon to its own shape over the centre 80%,
    // so transparency would reveal whatever sits beneath and content wider than
    // 410px of the 512 canvas gets its edges shaved.
    expect(info('icon-maskable-512.png', '%[opaque]')).toBe('True');
    expect(Math.max(...contentBox('icon-maskable-512.png'))).toBeLessThanOrEqual(410);
  });

  it('keeps the Apple touch icon opaque', () => {
    // iOS composites a transparent touch icon onto black.
    expect(info('apple-touch-icon.png', '%[opaque]')).toBe('True');
    expect(info('apple-touch-icon.png', '%[pixel:p{3,3}]')).toMatch(/255,\s*255,\s*255/);
  });

  it('shows the transparent icon on the launch screen', () => {
    const source = execSync('cat src/components/LaunchScreen.jsx').toString();
    expect(source).toContain('icon-512.png');
  });
});
