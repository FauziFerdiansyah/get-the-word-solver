import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  listSessions, saveSession, removeSession, clearSessions, isValidSession, MAX_SESSIONS,
} from './utils/sessions';
import App from './App';

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
const openSettings = (user) => user.click(screen.getByLabelText('Settings'));
const saveButton = () => screen.getByRole('button', { name: 'Simpan' });

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

    await openSettings(user);
    await user.type(screen.getByLabelText('Nama sesi'), 'Round one');
    await user.click(saveButton());
    await user.click(screen.getByLabelText('Tutup'));

    // Throw the work away…
    await user.click(screen.getByRole('button', { name: /Reset/ }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    expect(greenBox(1).value).toBe('');

    // …and get it back.
    await openSettings(user);
    await user.click(screen.getByLabelText('Buka sesi Round one'));

    expect(greenBox(1).value).toBe('S');
    expect(screen.getByRole('button', { name: 'T' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('restores the word length and mode a session was saved in', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(boardCell(1, 1), 'C');

    await openSettings(user);
    await user.click(saveButton());
    await user.click(screen.getByLabelText('Tutup'));

    // Move somewhere else entirely.
    await user.click(screen.getByRole('button', { name: '6 Huruf' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));
    await user.click(screen.getByRole('button', { name: /1 Baris/ }));

    await openSettings(user);
    await user.click(screen.getAllByLabelText(/^Buka sesi/)[0]);

    expect(screen.getByRole('button', { name: '4 Huruf' }).style.backgroundColor)
      .not.toBe('rgb(255, 255, 255)');
    expect(boardCell(1, 1).value).toBe('C');
  });

  it('closes settings when a session is opened, so the board is visible', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSettings(user);
    await user.click(saveButton());
    await user.click(screen.getAllByLabelText(/^Buka sesi/)[0]);

    expect(screen.queryByLabelText('Tutup')).toBeNull();
  });

  it('lists a summary of each saved session', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await user.type(greenBox(2), 'T');
    await openSettings(user);
    await user.click(saveButton());

    const item = screen.getByLabelText(/^Buka sesi/).closest('li');
    expect(within(item).getByText(/5 Huruf/)).toBeTruthy();
    expect(within(item).getByText(/2 kotak terisi/)).toBeTruthy();
  });

  it('deletes a session from the list', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await openSettings(user);
    await user.click(saveButton());
    expect(screen.getAllByLabelText(/^Buka sesi/)).toHaveLength(1);

    await user.click(screen.getByLabelText(/^Hapus sesi/));
    expect(screen.queryByLabelText(/^Buka sesi/)).toBeNull();
    expect(screen.getByText('Belum ada sesi tersimpan.')).toBeTruthy();
  });

  it('keeps a saved session even after the other mode is reset', async () => {
    const user = renderApp();
    // Save a single-row session…
    await user.type(greenBox(1), 'S');
    await openSettings(user);
    await user.type(screen.getByLabelText('Nama sesi'), 'clues');
    await user.click(saveButton());
    await user.click(screen.getByLabelText('Tutup'));

    // …then work and reset in board mode.
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(boardCell(1, 1), 'C');
    await user.click(screen.getByRole('button', { name: /Reset/ }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));

    await openSettings(user);
    expect(screen.getByLabelText('Buka sesi clues')).toBeTruthy();
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
