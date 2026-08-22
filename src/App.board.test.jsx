import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
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

// Types a guess into one board row and sets each tile's colour.
// `colors` uses one character per tile: g = green, y = yellow, x = gray.
const fillRow = async (user, rowNumber, word, colors) => {
  for (let i = 0; i < word.length; i += 1) {
    const cell = screen.getByLabelText(`Baris ${rowNumber}, kotak ${i + 1}`);
    await user.type(cell, word[i]);
  }
  for (let i = 0; i < colors.length; i += 1) {
    const dot = screen.getByLabelText(new RegExp(`Ubah warna kotak ${rowNumber}-${i + 1}:`));
    const clicks = { x: 0, g: 1, y: 2 }[colors[i]];
    for (let c = 0; c < clicks; c += 1) await user.click(dot);
  }
};

// Scoped to the results panel: the toast library also renders <li> elements, so
// an unscoped listitem query picks up notifications as if they were answers.
const resultItems = () => within(screen.getByTestId('results-panel')).queryAllByRole('listitem');
const resultWords = () =>
  resultItems().map((li) => within(li).getByText(/^[A-Z]+$/).textContent);

describe('board mode', () => {
  it('shows nothing until something is filled in', () => {
    setup();
    expect(resultItems()).toHaveLength(0);
  });

  it('switches between the single row and the 6-row board', async () => {
    const user = setup();
    expect(screen.getByText(/Clue Kata/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /6 Baris/ }));

    expect(screen.getByText(/Papan Tebakan/)).toBeTruthy();
    // 6 rows x 5 letters for the default level
    expect(screen.getAllByLabelText(/^Baris \d+, kotak \d+$/)).toHaveLength(30);
    expect(screen.getByLabelText('Baris 6, kotak 5')).toBeTruthy();
  });

  it('renders one row per guess for the 4-letter level', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));

    expect(screen.getAllByLabelText(/^Baris \d+, kotak \d+$/)).toHaveLength(24);
  });

  it('solves an IDEA / OVER board from the real game', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));

    // Guess IDEA -> only E is in the right spot, I / D / A are absent.
    await fillRow(user, 1, 'IDEA', 'xxgx');
    // Guess OVER -> O and E are in the right spot, V and R are absent.
    await fillRow(user, 2, 'OVER', 'gxgx');

    // No button press needed — suggestions follow the input.
    const words = resultWords();
    expect(words.length).toBeGreaterThan(0);
    for (const word of words) {
      expect(word[0]).toBe('O');
      expect(word[2]).toBe('E');
      expect(word).not.toMatch(/[IDAVR]/);
    }
    expect(words).toContain('OPEN');
    expect(words).toContain('OMEN');
  });

  it('numbers the suggestions so the best ranked word comes first', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await fillRow(user, 1, 'CRANE', 'gxxxx');

    const items = resultItems();
    expect(items.length).toBeGreaterThan(1);
    expect(within(items[0]).getByText('#1')).toBeTruthy();
    expect(within(items[1]).getByText('#2')).toBeTruthy();
  });

  it('resets the board and hides results', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await fillRow(user, 1, 'CRANE', 'gxxxx');
    expect(resultItems().length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(resultItems()).toHaveLength(0);
    expect(screen.getByLabelText('Baris 1, kotak 1').value).toBe('');
  });
});
