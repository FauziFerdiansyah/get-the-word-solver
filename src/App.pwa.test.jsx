import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import { LANG } from './data/i18n';
import { createMockAudioContext, emptyAudioLog } from './test-audio-mock';
import App from './App';

const log = emptyAudioLog();
window.AudioContext = createMockAudioContext(log);

const renderApp = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  return user;
};

const clearLog = () => {
  log.nodes.length = 0;
  log.automation.length = 0;
};

describe('delete sound', () => {
  beforeEach(clearLog);

  it('plays when a clue letter is removed', async () => {
    const user = renderApp();
    const box = screen.getByLabelText('Huruf hijau posisi 1');
    await user.type(box, 'S');
    clearLog();

    await user.clear(box);
    expect(log.nodes.filter((n) => n.kind === 'bufferSource').length).toBeGreaterThan(0);
  });

  it('plays when a board letter is removed', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    const cell = screen.getByLabelText('Baris 1, kotak 1');
    await user.type(cell, 'A');
    clearLog();

    await user.clear(cell);
    expect(log.nodes.filter((n) => n.kind === 'bufferSource').length).toBeGreaterThan(0);
  });

  it('stays silent when sound is switched off', async () => {
    const user = renderApp();
    const box = screen.getByLabelText('Huruf hijau posisi 1');
    await user.type(box, 'S');

    await user.click(screen.getByLabelText('Settings'));
    const row = screen.getByText('Efek Suara Ketik').closest('div');
    await user.click(row.querySelector('button[class*="rounded-full"]'));
    await user.click(screen.getByLabelText('Tutup'));
    clearLog();

    await user.clear(box);
    expect(log.nodes.filter((n) => n.kind === 'bufferSource')).toHaveLength(0);
  });

  it('has its own Backspace slot in the sprite', () => {
    // Deleting plays the pack's real Backspace recording, not a letter's.
    const engine = readFileSync('src/utils/sound.js', 'utf8');
    expect(engine).toMatch(/sample\(ctx, 'BACKSPACE'/);
  });
});

describe('top bar colour', () => {
  const themeColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

  beforeEach(() => {
    document.head.innerHTML =
      '<meta name="theme-color" content="#16a34a">' +
      '<meta name="apple-mobile-web-app-status-bar-style" content="default">';
  });

  it('follows the page background instead of staying green', async () => {
    const user = renderApp();
    // Light mode: the near-white page background, not the manifest's green.
    expect(themeColor()).not.toBe('#16a34a');
    const light = themeColor();

    await user.click(screen.getByLabelText('Settings'));
    const row = screen.getByText('Mode Malam').closest('div');
    await user.click(row.querySelector('button[class*="rounded-full"]'));

    expect(themeColor()).not.toBe(light);
    expect(document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content')).toBe('black');
  });

  it('is exactly black with dark mode and high contrast', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    for (const label of ['Mode Malam', 'Kontras tinggi']) {
      const row = screen.getByText(label).closest('div');
      await user.click(row.querySelector('button[class*="rounded-full"]'));
    }

    expect(themeColor()).toBe('#000000');
  });

  it('is exactly white with high contrast in light mode', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    const row = screen.getByText('Kontras tinggi').closest('div');
    await user.click(row.querySelector('button[class*="rounded-full"]'));

    expect(themeColor()).toBe('#ffffff');
  });
});

describe('iOS install guide', () => {
  let handlers;
  const originalUA = navigator.userAgent;

  const setUA = (value) =>
    Object.defineProperty(navigator, 'userAgent', { value, configurable: true });

  beforeEach(() => {
    handlers = {};
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'beforeinstallprompt' || type === 'appinstalled') handlers[type] = fn;
      else original(type, fn, opts);
    });
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setUA(originalUA);
  });

  it('offers the button on iOS even though no install event ever fires', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    renderApp();

    expect(screen.getByRole('button', { name: /install aplikasi/i })).toBeTruthy();
  });

  it('spells out the Safari steps with numbers and icons', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));

    const dialog = screen.getByRole('dialog', { name: /install aplikasi/i });
    const steps = within(dialog).getAllByRole('listitem');
    expect(steps).toHaveLength(LANG.id.installGuide['ios-safari'].steps.length);

    // Numbered, and each step carries an icon element.
    expect(steps[0].textContent).toMatch(/^1/);
    expect(within(dialog).getByText(/Bagikan/)).toBeTruthy();
    expect(within(dialog).getByText(/Add to Home Screen/)).toBeTruthy();
    for (const step of steps) expect(step.querySelectorAll('span').length).toBeGreaterThan(2);
  });

  it('sends a non-Safari iOS browser to Safari first', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1');
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));

    const dialog = screen.getByRole('dialog', { name: /install aplikasi/i });
    expect(within(dialog).getByText(/Buka Safari/)).toBeTruthy();
  });

  it('prefers the one-tap prompt when the browser provides one', async () => {
    setUA('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36');
    const user = renderApp();
    const prompt = vi.fn();
    act(() => handlers.beforeinstallprompt({
      preventDefault: vi.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }));

    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));
    expect(prompt).toHaveBeenCalled();
    // No guide needed: the browser handled it.
    expect(screen.queryByRole('dialog', { name: /install aplikasi/i })).toBeNull();
  });

  it('keeps both languages of the guide in step', () => {
    for (const variant of ['ios-safari', 'ios-other', 'desktop']) {
      const id = LANG.id.installGuide[variant];
      const en = LANG.en.installGuide[variant];
      expect(en.steps.length).toBe(id.steps.length);
      expect(en.steps.map((s) => s.icon)).toEqual(id.steps.map((s) => s.icon));
      for (const step of [...id.steps, ...en.steps]) expect(step.icon).toMatch(/^tabler:/);
    }
  });
});
