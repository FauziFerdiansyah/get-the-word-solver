import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
import { createMockAudioContext, emptyAudioLog } from './test-audio-mock';
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
const setUA = (v) => Object.defineProperty(navigator, 'userAgent', { value: v, configurable: true });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';

describe('copying a suggestion', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });
  });

  it('names the word in a toast and ticks the button', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    const panel = screen.getByTestId('results-panel');
    const word = within(panel).getAllByText(/^[A-Z]+$/)[0].textContent;
    await user.click(within(panel).getAllByLabelText(/^Salin Kata/)[0]);

    await waitFor(() => expect(screen.getByText(`Disalin kata "${word}"`)).toBeTruthy());
    expect(within(panel).getByLabelText('Tersalin')).toBeTruthy();
  });

  it('carries no title attribute, which the browser drew as a second alert', () => {
    const source = readFileSync('src/components/ResultsList.jsx', 'utf8');
    const button = source.slice(source.indexOf('onClick={handleCopy}'), source.indexOf('tabler:check'));
    expect(button).not.toContain('title=');
  });
});

describe('sound on iOS', () => {
  const log = emptyAudioLog();
  const originalUA = navigator.userAgent;

  afterEach(() => setUA(originalUA));

  it('offers a gesture button while the browser has not started audio', async () => {
    delete window.AudioContext;
    delete window.webkitAudioContext;
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));

    // No audio permission API exists; a click is the only way in, so the row
    // offers one instead of a Test button that could not work.
    expect(screen.getByRole('button', { name: /Aktifkan Suara/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Tes$/ })).toBeNull();
  });

  it('puts the ringer-switch caveat in the toast description, on iOS only', async () => {
    window.AudioContext = createMockAudioContext(log);
    setUA(IPHONE);
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByRole('button', { name: /Tes|Aktifkan Suara/ }));

    await waitFor(() => expect(screen.getByText('Suara aktif dan berfungsi.')).toBeTruthy());
    // The description is a separate block that the library reveals after its
    // ~330ms morph, so it needs waiting for — and it must be its own element,
    // not text glued onto the title.
    await waitFor(() => expect(screen.getByText(/tombol senyap/)).toBeTruthy(), { timeout: 3000 });
    expect(screen.getByText('Suara aktif dan berfungsi.').textContent).not.toMatch(/senyap/);
  });

  it('leaves the caveat out on other platforms', async () => {
    window.AudioContext = createMockAudioContext(log);
    setUA('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36');
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByRole('button', { name: /Tes|Aktifkan Suara/ }));

    await waitFor(() => expect(screen.getByText('Suara aktif dan berfungsi.')).toBeTruthy());
    await new Promise((resolve) => setTimeout(resolve, 600)); // past the morph
    expect(screen.queryByText(/tombol senyap/)).toBeNull();
  });
});

describe('update notice', () => {
  it('stays hidden until a new build is installed', () => {
    renderApp();
    expect(screen.queryByText('Versi baru tersedia')).toBeNull();
  });

  it('offers a reload when the service worker reports one', async () => {
    renderApp();
    act(() => window.dispatchEvent(new CustomEvent('ws-update-ready')));

    expect(screen.getByText('Versi baru tersedia')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeTruthy();
  });

  it('clears the caches before reloading, or the old bundle comes back', async () => {
    const deleted = [];
    vi.stubGlobal('caches', {
      keys: () => Promise.resolve(['old-cache']),
      delete: (key) => { deleted.push(key); return Promise.resolve(true); },
    });
    const reload = vi.fn();
    const original = window.location;
    delete window.location;
    window.location = { ...original, reload };

    const user = renderApp();
    act(() => window.dispatchEvent(new CustomEvent('ws-update-ready')));
    await user.click(screen.getByRole('button', { name: 'Muat Ulang' }));

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(deleted).toEqual(['old-cache']);

    window.location = original;
    vi.restoreAllMocks();
  });

  it('is driven by the service worker, which changes every release', () => {
    const main = readFileSync('src/main.jsx', 'utf8');
    // A new CACHE_NAME makes sw.js a different file, which is what makes the
    // browser install a new worker — that is the only update signal available.
    expect(main).toContain('updatefound');
    expect(main).toContain('ws-update-ready');
    expect(main).toContain('registration.update()');
    expect(readFileSync('public/sw.js', 'utf8')).toMatch(/CACHE_NAME = 'wordle-solver-v/);
  });
});
