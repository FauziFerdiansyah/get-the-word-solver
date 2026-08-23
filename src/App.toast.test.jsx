import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
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
const settingsRowToggle = async (user, label) => {
  const row = screen.getByText(label).closest('div');
  await user.click(row.querySelector('button[class*="rounded-full"]'));
};

describe('toast types', () => {
  const sources = [
    'src/components/SettingsModal.jsx',
    'src/components/SessionManager.jsx',
    'src/components/ClueGrid.jsx',
    'src/components/ResultsList.jsx',
    'src/components/RandomWordModal.jsx',
    'src/components/InstallGuideModal.jsx',
  ].map((path) => [path, readFileSync(path, 'utf8')]);

  it('uses all five kinds the library offers', () => {
    const all = sources.map(([, code]) => code).join('\n');
    for (const kind of ['success', 'error', 'warning', 'info']) {
      expect(all, `no gooeyToast.${kind} anywhere`).toContain(`gooeyToast.${kind}(`);
    }
    // The default form stays available for anything without a category.
    expect(readFileSync('src/App.jsx', 'utf8')).toContain('GooeyToaster');
  });

  it('never falls back to an untyped toast', () => {
    for (const [path, code] of sources) {
      const untyped = [...code.matchAll(/gooeyToast\((?!\s*\))/g)];
      expect(untyped.length, `${path} still calls gooeyToast() directly`).toBe(0);
    }
  });

  it('gives every toast at least 2.5 seconds', () => {
    // A second was added on top of the old timings, which vanished too quickly.
    for (const [path, code] of sources) {
      for (const match of code.matchAll(/duration:\s*(\d+)/g)) {
        expect(Number(match[1]), `${path} has a ${match[1]}ms toast`).toBeGreaterThanOrEqual(2500);
      }
    }
    expect(readFileSync('src/App.jsx', 'utf8')).toContain('duration={2500}');
  });

  it('centres the toast content in CSS', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const block = css.slice(css.indexOf('.gooey-content'), css.indexOf('.gooey-header'));
    expect(block).toContain('align-items: center');
    expect(block).toContain('align-content: center');
    expect(block).toContain('justify-content: center');
    // The library's own title padding is lopsided (0 4px 2px 2px).
    expect(css).toMatch(/\.gooey-title \{[^}]*padding: 0 2px/);
  });
});

describe('copying a suggestion', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('confirms on the button itself instead of raising a toast', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    const panel = screen.getByTestId('results-panel');
    const copy = within(panel).getAllByLabelText(/^Salin Kata/)[0];
    await user.click(copy);

    // The icon turns into a tick and the label says so; no popup for an action
    // the user just performed. (The toaster container itself always carries
    // role="status", so the absence of the message is what to assert.)
    await waitFor(() => expect(within(panel).getByLabelText('Tersalin')).toBeTruthy());
    expect(screen.queryByText(/disalin/)).toBeNull();
  });
});

describe('settings popups', () => {
  it('does not reopen the session popup the next time Settings opens', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByLabelText('Kelola sesi tersimpan'));
    await user.click(saveButtonIn());
    await user.click(screen.getByLabelText(/^Buka sesi/)); // loads and closes everything

    expect(screen.queryByRole('dialog', { name: 'Simpan & Buka Sesi' })).toBeNull();

    // Reopening Settings must land on Settings, not back inside the popup.
    await user.click(screen.getByLabelText('Settings'));
    expect(screen.queryByRole('dialog', { name: 'Simpan & Buka Sesi' })).toBeNull();
    expect(screen.getByLabelText('Kelola sesi tersimpan')).toBeTruthy();
  });

  const saveButtonIn = () => screen.getByRole('button', { name: /^Simpan$/ });
});

describe('renamed settings labels', () => {
  it('uses the Indonesian wording asked for', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));

    expect(screen.getByText('Mode Malam')).toBeTruthy();
    expect(screen.getByText('Efek Suara Ketik')).toBeTruthy();
    // And explains what the sound actually is.
    expect(screen.getByText(/Cherry MX Blue/)).toBeTruthy();
  });

  it('gives the sound button an icon', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));

    // jsdom has no AudioContext, so the row offers "Aktifkan Suara" — the gesture
    // button shown whenever the browser has not started audio — instead of "Tes".
    const button = screen.getByRole('button', { name: /Tes|Aktifkan Suara/ });
    expect(button.firstElementChild).toBeTruthy();
    expect(button.firstElementChild.textContent).toBe('');
  });

  it('turns a toggle into a readable on/off message', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    await settingsRowToggle(user, 'Mode Malam');

    // Instead of "Dark mode ✓" it now names the setting in the user's language.
    // The label is on screen too, so the count is what distinguishes the toast.
    await waitFor(() => expect(screen.getAllByText(/Mode Malam|Mode Terang/).length).toBeGreaterThan(1));
  });
});
