import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import { getTopWords } from './data/words';
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

const greenBox = (position) => screen.getByLabelText(`Huruf hijau posisi ${position}`);
// The yellow field wraps 3 letters per row using a display-only newline.
const yellowLetters = (position) => yellowBox(position).value.replace(/\n/g, '');
const yellowBox = (position) => screen.getByLabelText(`Huruf kuning (bukan di posisi ini) ${position}`);

// The yellow boxes take a single letter unless the multi-letter setting is on.
const enableMultiLetter = async (user) => {
  await user.click(screen.getByLabelText('Settings'));
  const row = screen.getByText('Kotak kuning multi-huruf').closest('div');
  await user.click(row.querySelector('button'));
  await user.click(screen.getByLabelText('Tutup'));
};

// Scoped to the results panel: the toast library also renders <li> elements, so
// an unscoped listitem query picks up notifications as if they were answers.
const resultItems = () => within(screen.getByTestId('results-panel')).queryAllByRole('listitem');
const resultWords = () =>
  resultItems().map((li) => within(li).getByText(/^[A-Z]+$/).textContent);

describe('single row mode', () => {
  it('suggests words as soon as a green letter is typed, without a search button', async () => {
    const user = setup();
    expect(screen.queryByRole('button', { name: /Cari Jawaban/ })).toBeNull();

    await user.type(greenBox(1), 'C');

    const words = resultWords();
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) expect(word[0]).toBe('C');
  });

  it('accepts the same yellow letter under two different boxes', async () => {
    const user = setup();

    // A is in the word, but not at box 2 and not at box 3.
    await user.type(yellowBox(2), 'A');
    await user.type(yellowBox(3), 'A');

    const words = resultWords();
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) {
      expect(word).toContain('A');
      expect(word[1]).not.toBe('A');
      expect(word[2]).not.toBe('A');
    }
    // Words with a single A still qualify.
    expect(words.some((w) => w.split('').filter((c) => c === 'A').length === 1)).toBe(true);
  });

  it('ignores a letter typed twice in the same yellow box', async () => {
    const user = setup();
    await user.type(yellowBox(2), 'AA');

    // The second A is dropped on input, so nothing hidden happens.
    expect(yellowBox(2).value).toBe('A');
    for (const word of resultWords()) {
      expect(word).toContain('A');
      expect(word[1]).not.toBe('A');
    }
  });

  it('takes a single letter per yellow box by default', async () => {
    const user = setup();
    await user.type(yellowBox(2), 'RL');

    expect(yellowLetters(2)).toBe('R');
  });

  it('accepts several different letters once the setting is on', async () => {
    const user = setup();
    await enableMultiLetter(user);
    await user.type(yellowBox(2), 'RL');

    expect(yellowLetters(2)).toBe('RL');
    for (const word of resultWords()) {
      expect(word).toContain('R');
      expect(word).toContain('L');
      expect(word[1]).not.toBe('R');
      expect(word[1]).not.toBe('L');
    }
  });

  it('holds one ruled-out letter per guess, so six of them', async () => {
    const user = setup();
    await enableMultiLetter(user);
    // Six guesses can rule out at most six letters from a single position.
    await user.type(yellowBox(2), 'RLTNMB');
    expect(yellowLetters(2)).toBe('RLTNMB');
    // Three per row, two rows: the newline is inserted for display only.
    expect(yellowBox(2).value).toBe('RLT\nNMB');
    expect(yellowBox(2).rows).toBe(2);

    await user.type(yellowBox(2), 'X');
    expect(yellowLetters(2)).toBe('RLTNMB');
  });

  it('drops only a crossed-out letter and keeps the rest of the box', async () => {
    const user = setup();
    await enableMultiLetter(user);
    await user.click(screen.getByRole('button', { name: 'T' })); // cross out T
    await user.type(yellowBox(2), 'RL');
    expect(yellowLetters(2)).toBe('RL');

    // T cannot be both absent and present, so it is refused — but RL survives
    // and the next letter still goes in. Refusing the whole value in silence
    // made this look like a two-letter limit.
    await user.type(yellowBox(2), 'T');
    expect(yellowLetters(2)).toBe('RL');

    await user.type(yellowBox(2), 'N');
    expect(yellowLetters(2)).toBe('RLN');
  });

  it('shrinks the text while typing, and wraps to a second row', async () => {
    const user = setup();
    await enableMultiLetter(user);
    const size = () => yellowBox(2).style.fontSize;
    const focused = () => document.activeElement === yellowBox(2);

    // Every extra letter drops the font a step, so the box never has to grow.
    // The field stays focused throughout: the size has to change as you type,
    // not only once you tap away.
    await user.type(yellowBox(2), 'RL');
    expect(focused()).toBe(true);
    expect(size()).toBe('16px');
    expect(yellowBox(2).rows).toBe(1);

    await user.type(yellowBox(2), 'T');
    expect(focused()).toBe(true);
    expect(size()).toBe('14px');
    expect(yellowBox(2).rows).toBe(1);

    await user.type(yellowBox(2), 'N');
    expect(focused()).toBe(true);
    expect(size()).toBe('13px');
    expect(yellowBox(2).rows).toBe(2);
    expect(yellowBox(2).value).toBe('RLT\nN');

    await user.type(yellowBox(2), 'M');
    expect(size()).toBe('12px');

    await user.type(yellowBox(2), 'B');
    expect(focused()).toBe(true);
    expect(size()).toBe('11px');

    // Nothing in the stylesheet may pin the focused size back to 16px, or the
    // shrinking would only become visible on blur.
    expect(readFileSync('src/index.css', 'utf8')).not.toMatch(/\.clue-strip:focus/);
  });

  it('flips a placed letter between green and yellow with its dot', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');
    for (const word of resultWords()) expect(word[0]).toBe('S');

    const dot = screen.getByLabelText(/Ubah warna huruf posisi 1/);
    await user.click(dot);

    // Yellow now: S is in the word, just not in the first spot.
    const words = resultWords();
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) {
      expect(word).toContain('S');
      expect(word[0]).not.toBe('S');
    }

    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 1/));
    for (const word of resultWords()) expect(word[0]).toBe('S');
  });

  it('has no dot until a letter is placed', async () => {
    const user = setup();
    expect(screen.queryByLabelText(/Ubah warna huruf posisi 1/)).toBeNull();

    await user.type(greenBox(1), 'S');
    expect(screen.getByLabelText(/Ubah warna huruf posisi 1/)).toBeTruthy();
  });

  it('drops words containing letters crossed out on the keyboard', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');
    await user.click(screen.getByRole('button', { name: 'T' }));

    for (const word of resultWords()) {
      expect(word[0]).toBe('S');
      expect(word).not.toContain('T');
    }
  });

  it('keeps a yellow letter out of a box that already has a green letter', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');
    await user.type(yellowBox(1), 'E');

    for (const word of resultWords()) {
      expect(word[0]).toBe('S');
      expect(word).toContain('E');
    }
  });
});

describe('result tiers', () => {
  it('starts on the All tab and can filter down to a single tier', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');

    const allTab = screen.getByRole('tab', { name: /^Semua/ });
    const commonTab = screen.getByRole('tab', { name: /^Umum/ });
    const rareTab = screen.getByRole('tab', { name: /^Jarang/ });

    // 'all' is the default, so its tab has to look selected from the start.
    expect(allTab.getAttribute('aria-selected')).toBe('true');
    expect(commonTab.getAttribute('aria-selected')).toBe('false');

    const allCount = resultWords().length;
    await user.click(rareTab);
    expect(rareTab.getAttribute('aria-selected')).toBe('true');
    expect(resultWords().length).toBeLessThanOrEqual(allCount);
  });

  it('switching tier does not animate or resize the tabs', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');

    const allTab = screen.getByRole('tab', { name: /^Semua/ });
    const rareTab = screen.getByRole('tab', { name: /^Jarang/ });

    // Only colours may change: a scale animation or an appearing/disappearing
    // shadow made the whole row appear to blink when a tab was tapped.
    expect(allTab.className).not.toContain('scale');
    expect(allTab.className).toContain('transition-colors');
    const shadowBefore = allTab.style.boxShadow;

    await user.click(rareTab);
    expect(allTab.style.boxShadow).toBe(shadowBefore);
    expect(rareTab.style.boxShadow).toBe(shadowBefore);
  });

  it('starts each tier at the first page so the list cannot collapse', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');

    // Page through "Semua" first.
    await user.click(screen.getByRole('button', { name: /Tampilkan Lainnya/ }));
    expect(resultItems().length).toBeGreaterThan(10);

    // Switching tier resets to one page, instead of carrying a big count into a
    // tier with fewer matches and yanking the page height around.
    await user.click(screen.getByRole('tab', { name: /^Jarang/ }));
    expect(resultItems().length).toBeLessThanOrEqual(10);
  });

  it('labels each suggestion with its tier', async () => {
    const user = setup();
    await user.type(greenBox(1), 'S');

    const first = resultItems()[0];
    expect(within(first).getByText(/^(Umum|Jarang)$/)).toBeTruthy();
  });
});

describe('keyboard', () => {
  it('hides the Enter and Backspace keys until the setting is turned on', async () => {
    const user = setup();
    expect(screen.queryByTitle(/Enter/)).toBeNull();

    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByText('Tombol Enter & Backspace').closest('div').querySelector('button'));

    expect(screen.getByTitle(/^Enter/)).toBeTruthy();
    expect(screen.getByTitle(/^Backspace/)).toBeTruthy();
  });

  it('renders the decorative keys as non-interactive elements', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByText('Tombol Enter & Backspace').closest('div').querySelector('button'));

    const enterKey = screen.getByTitle(/^Enter/);
    expect(enterKey.tagName).toBe('SPAN');
    expect(enterKey.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts backspace under K and L, with enter right of L and under P', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByText('Tombol Enter & Backspace').closest('div').querySelector('button'));

    const colStart = (el) => parseInt(el.style.gridColumn.split('/')[0].trim(), 10);
    const colSpan = (el) => parseInt(el.style.gridColumn.split('span')[1].trim(), 10);
    const colEnd = (el) => colStart(el) + colSpan(el);
    const key = (name) => screen.getByRole('button', { name });

    const backspace = screen.getByTitle(/^Backspace/);
    const enter = screen.getByTitle(/^Enter/);

    // Backspace fills exactly the two columns that K and L occupy above it.
    expect(backspace.style.gridRow).toBe('3');
    expect(colStart(backspace)).toBe(colStart(key('K')));
    expect(colEnd(backspace)).toBe(colEnd(key('L')));

    // Enter starts where L ends, sits in P's column, and is two rows tall.
    expect(colStart(enter)).toBe(colEnd(key('L')));
    expect(colStart(enter)).toBe(colStart(key('P')));
    expect(colEnd(enter)).toBe(colEnd(key('P')));
    expect(enter.style.gridRow).toBe('2 / span 2');
  });

  it('lines all three rows up on the same column grid', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByText('Tombol Enter & Backspace').closest('div').querySelector('button'));

    const colStart = (name) => parseInt(
      screen.getByRole('button', { name }).style.gridColumn.split('/')[0].trim(), 10
    );

    // Q, A and Z all start in column 1; the last row's M ends before backspace.
    expect(colStart('Q')).toBe(1);
    expect(colStart('A')).toBe(1);
    expect(colStart('Z')).toBe(1);
    expect(colStart('P')).toBe(19);
  });

  it('centres the shorter rows when the action keys are hidden', () => {
    setup();
    const colStart = (name) => parseInt(
      screen.getByRole('button', { name }).style.gridColumn.split('/')[0].trim(), 10
    );

    // Half a key of indent on row 2, one and a half on row 3.
    expect(colStart('Q')).toBe(1);
    expect(colStart('A')).toBe(2);
    expect(colStart('Z')).toBe(4);
  });
});

describe('random word', () => {
  it('only draws from the best ranked words for the level', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Acak Kata/ }));

    expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/🎲/);
    // The modal is fed the top slice, so anything it can show is a top word.
    expect(getTopWords(5)).toHaveLength(400);
    expect(getTopWords(5).every((w) => w.length === 5)).toBe(true);
  });
});
