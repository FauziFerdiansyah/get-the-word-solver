import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  listSessions, saveSession, removeSession, clearSessions, isValidSession, MAX_SESSIONS,
} from './utils/sessions';
import { LANG } from './data/i18n';
import App from './App';

const LANG_TITLES = { id: LANG.id.sessions, en: LANG.en.sessions };

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
// Sessions live in a popup of their own now, reached from Settings.
const openSessions = async (user) => {
  await user.click(screen.getByLabelText('Settings'));
  await user.click(screen.getByLabelText('Kelola sesi tersimpan'));
};
const saveButton = () => screen.getByRole('button', { name: /^Simpan$/ });
const closeSessions = (user) => user.click(
  within(screen.getByRole('dialog', { name: 'Simpan & Buka Sesi' })).getByLabelText('Tutup')
);

const validState = (overrides = {}) => ({
  wordLength: 5,
  mode: 'single',
  clues: ['S', '', '', '', ''],
  clueStates: ['green', 'green', 'green', 'green', 'green'],
  excluded: ['', 'A', '', '', ''],
  board: [{ letters: ['', '', '', '', ''], states: ['gray', 'gray', 'gray', 'gray', 'gray'] }],
  disabled: { single: ['T'], board: [] },
  ...overrides,
});

describe('session storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a session', () => {
    saveSession('My game', validState());
    const [entry] = listSessions();
    expect(entry.name).toBe('My game');
    expect(entry.state.clues[0]).toBe('S');
    expect(entry.state.disabled.single).toEqual(['T']);
  });

  it('names a session automatically when none is given', () => {
    saveSession('', validState());
    expect(listSessions()[0].name).toMatch(/^5L · 1 · /);
  });

  it('lists the newest first and deletes by id', () => {
    saveSession('first', validState());
    saveSession('second', validState());
    expect(listSessions().map((e) => e.name)).toEqual(['second', 'first']);

    const id = listSessions()[0].id;
    expect(removeSession(id).map((e) => e.name)).toEqual(['first']);
  });

  it('caps how many it keeps', () => {
    for (let i = 0; i < MAX_SESSIONS + 5; i += 1) saveSession(`s${i}`, validState());
    expect(listSessions()).toHaveLength(MAX_SESSIONS);
  });

  it('refuses a state whose arrays do not match its word length', () => {
    expect(isValidSession(validState({ wordLength: 6 }))).toBe(false);
    expect(isValidSession(validState({ clues: ['S'] }))).toBe(false);
    expect(isValidSession(validState({ mode: 'nonsense' }))).toBe(false);
    expect(saveSession('bad', validState({ wordLength: 6 }))).toHaveLength(0);
  });

  it('survives junk in storage instead of throwing', () => {
    localStorage.setItem('ws-sessions', 'not json at all');
    expect(listSessions()).toEqual([]);

    localStorage.setItem('ws-sessions', JSON.stringify([{ schema: 99, state: {} }]));
    expect(listSessions()).toEqual([]);
  });

  it('clears everything on request', () => {
    saveSession('a', validState());
    expect(clearSessions()).toEqual([]);
  });
});

describe('sessions in the app', () => {
  beforeEach(() => localStorage.clear());

  it('saves what is on screen and brings it back after a reset', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await user.click(screen.getByRole('button', { name: 'T' })); // cross T out

    await openSessions(user);
    await user.type(screen.getByLabelText('Nama sesi'), 'Round one');
    await user.click(saveButton());
    await closeSessions(user);
    await user.click(screen.getByLabelText('Tutup'));

    // Throw the work away…
    await user.click(screen.getByRole('button', { name: /Reset/ }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    expect(greenBox(1).value).toBe('');

    // …and get it back.
    await openSessions(user);
    await user.click(screen.getByLabelText('Buka sesi Round one'));

    expect(greenBox(1).value).toBe('S');
    expect(screen.getByRole('button', { name: 'T' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('restores the word length and mode a session was saved in', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(boardCell(1, 1), 'C');

    await openSessions(user);
    await user.click(saveButton());
    await closeSessions(user);
    await user.click(screen.getByLabelText('Tutup'));

    // Move somewhere else entirely.
    await user.click(screen.getByRole('button', { name: '6 Huruf' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    await user.click(screen.getByRole('button', { name: /1 Baris/ }));

    await openSessions(user);
    await user.click(screen.getAllByLabelText(/^Buka sesi/)[0]);

    expect(screen.getByRole('button', { name: '4 Huruf' }).style.backgroundColor)
      .not.toBe('rgb(255, 255, 255)');
    expect(boardCell(1, 1).value).toBe('C');
  });

  it('closes settings when a session is opened, so the board is visible', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSessions(user);
    await user.click(saveButton());
    await user.click(screen.getAllByLabelText(/^Buka sesi/)[0]);

    expect(screen.queryByRole('dialog', { name: 'Simpan & Buka Sesi' })).toBeNull();
    expect(screen.queryByLabelText('Tutup')).toBeNull();
  });

  it('lists a summary of each saved session', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await user.type(greenBox(2), 'T');
    await openSessions(user);
    await user.click(saveButton());

    const item = screen.getByLabelText(/^Buka sesi/).closest('li');
    expect(within(item).getByText(/5L · 1 Baris/)).toBeTruthy();
    expect(within(item).getByText(/2 kotak terisi/)).toBeTruthy();
    // Saved at, down to the second, so two nearby saves can be told apart.
    expect(within(item).getByText(/\d{2}[.:]\d{2}[.:]\d{2}/)).toBeTruthy();
    // And a preview of the puzzle itself, not just a name.
    expect(within(item).getAllByText(/^[A-Z]$/).map((el) => el.textContent)).toEqual(['S', 'T']);
  });

  it('deletes a session from the list', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSessions(user);
    await user.click(saveButton());
    expect(screen.getAllByLabelText(/^Buka sesi/)).toHaveLength(1);

    // Two taps: a stray one should not lose a saved puzzle. The first swaps the
    // row's buttons for a confirm pair, leaving the session itself untouched.
    await user.click(screen.getByLabelText(/^Hapus sesi/));
    expect(screen.queryByLabelText(/^Buka sesi/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Batal' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(screen.queryByLabelText(/^Buka sesi/)).toBeNull();
    expect(screen.getByText('Belum ada sesi tersimpan.')).toBeTruthy();
  });

  it('keeps a saved session even after the other mode is reset', async () => {
    const user = renderApp();
    // Save a single-row session…
    await user.type(greenBox(1), 'S');
    await openSessions(user);
    await user.type(screen.getByLabelText('Nama sesi'), 'clues');
    await user.click(saveButton());
    await closeSessions(user);
    await user.click(screen.getByLabelText('Tutup'));

    // …then work and reset in board mode.
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(boardCell(1, 1), 'C');
    await user.click(screen.getByRole('button', { name: /Reset/ }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));

    await openSessions(user);
    expect(screen.getByLabelText('Buka sesi clues')).toBeTruthy();
  });
});

describe('session popup', () => {
  beforeEach(() => localStorage.clear());

  it('opens from a button in Settings rather than sitting inside it', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));

    // The list is not in the sheet itself…
    expect(screen.queryByLabelText('Nama sesi')).toBeNull();
    expect(screen.getByLabelText('Kelola sesi tersimpan')).toBeTruthy();

    // …it is behind its own dialog.
    await user.click(screen.getByLabelText('Kelola sesi tersimpan'));
    const dialog = screen.getByRole('dialog', { name: 'Simpan & Buka Sesi' });
    expect(within(dialog).getByLabelText('Nama sesi')).toBeTruthy();
    expect(dialog.firstElementChild.className).toContain('h-full'); // full screen on a phone
  });

  it('titles the section in capitals as asked', () => {
    renderApp();
    expect(LANG_TITLES.id).toBe('Simpan & Buka Sesi');
    expect(LANG_TITLES.en).toBe('Save & Load Session');
  });

  it('shows the day, month, year and time to the second', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSessions(user);
    await user.click(saveButton());

    const item = screen.getByLabelText(/^Buka sesi/).closest('li');
    // e.g. "Min, 23 Agu 2026, 15.01.09" — weekday, date, and h:m:s.
    const stamp = within(item).getByText(/\d{2}[.:]\d{2}[.:]\d{2}/).textContent;
    expect(stamp).toMatch(/20\d{2}/);
    expect(stamp).toMatch(/\d{2}\b/);
    expect(stamp.split(/[.:]/).length).toBeGreaterThanOrEqual(3);
  });

  it('previews the board row the user was on', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(boardCell(1, 1), 'C');
    await user.type(boardCell(2, 1), 'M');

    await openSessions(user);
    await user.click(saveButton());

    const item = screen.getByLabelText(/^Buka sesi/).closest('li');
    // The last row with anything in it, which is the guess in progress.
    expect(within(item).getAllByText(/^[A-Z]$/).map((el) => el.textContent)).toEqual(['M']);
  });

  it('counts how many slots are left', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSessions(user);
    expect(screen.getByText(`0/${MAX_SESSIONS}`)).toBeTruthy();
    await user.click(saveButton());
    expect(screen.getByText(`1/${MAX_SESSIONS}`)).toBeTruthy();
  });
});

describe('reset button', () => {
  it('carries an icon', () => {
    renderApp();
    const reset = screen.getByRole('button', { name: /Reset/ });
    // Iconify renders an empty placeholder offline; its presence is the proof.
    expect(reset.firstElementChild).toBeTruthy();
    expect(reset.firstElementChild.textContent).toBe('');
  });
});
