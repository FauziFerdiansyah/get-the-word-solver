import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
import { parseChangelog, CHANGELOG } from './data/changelog';
import { THEMES } from './data/themes';
import App from './App';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

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
const resultItems = () =>
  within(screen.getByTestId('results-panel')).queryAllByRole('listitem');

describe('changelog data', () => {
  it('is read from CHANGELOG.md, so the file and the popup cannot disagree', () => {
    const file = readFileSync('CHANGELOG.md', 'utf8');
    const headings = [...file.matchAll(/^##\s+(?!#)(\d[^\s—]*)/gm)].map((m) => m[1]);
    expect(CHANGELOG.map((e) => e.version)).toEqual(headings);
  });

  it('has an entry for the version that is shipping', () => {
    expect(CHANGELOG.map((e) => e.version)).toContain(pkg.version);
    expect(CHANGELOG[0].version).toBe(pkg.version);
  });

  it('reaches back to the first release', () => {
    const versions = CHANGELOG.map((e) => e.version);
    expect(versions).toContain('1.0.0');
    expect(versions.length).toBeGreaterThan(10);
  });

  it('keeps every entry dated and non-empty', () => {
    for (const entry of CHANGELOG) {
      expect(entry.date, `${entry.version} has no date`).toMatch(/\d{4}-\d{2}-\d{2}/);
      const items = entry.sections.flatMap((s) => s.items);
      expect(items.length, `${entry.version} has no notes`).toBeGreaterThan(0);
    }
  });

  it('strips markdown rather than showing the syntax', () => {
    const parsed = parseChangelog([
      '## 9.9.9 — 2026-01-01',
      '### Added',
      '- **Bold** and `code` and [a link](https://example.com)',
      '  continued on the next line',
    ].join('\n'));

    expect(parsed[0].sections[0].items[0])
      .toBe('Bold and code and a link continued on the next line');
  });
});

describe('changelog popup', () => {
  it('opens from under the version line in Settings', async () => {
    const user = renderApp();
    await user.click(screen.getByLabelText('Settings'));
    expect(screen.getByText(new RegExp(`v${pkg.version}`))).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Riwayat Versi/ }));
    const dialog = screen.getByRole('dialog', { name: 'Riwayat Versi' });

    // Every version, newest first, with the running one marked.
    const shown = within(dialog).getAllByText(/^v\d+\.\d+\.\d+$/).map((el) => el.textContent);
    expect(shown[0]).toBe(`v${pkg.version}`);
    expect(shown).toHaveLength(CHANGELOG.length);
    expect(within(dialog).getByText('Versi ini')).toBeTruthy();
  });
});

describe('install button', () => {
  it('is full width, primary coloured and capitalised', async () => {
    const handlers = {};
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'beforeinstallprompt') handlers[type] = fn;
      else original(type, fn, opts);
    });
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });

    renderApp();
    act(() => handlers.beforeinstallprompt({ preventDefault: vi.fn() }));

    const install = screen.getByRole('button', { name: /Install Aplikasi/ });
    const reset = screen.getByRole('button', { name: /Reset/ });

    // Same height as the buttons around it — it used to be py-2.5 next to py-3.
    expect(install.className).toContain('py-3');
    expect(reset.className).toContain('py-3');
    expect(install.className).toContain('w-full');

    // And filled with the theme's primary, not the muted accent it had before.
    const rgb = (hex) => {
      const [, r, g, b] = hex.match(/^#(\w{2})(\w{2})(\w{2})$/);
      return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
    };
    expect(install.style.backgroundColor).toBe(rgb(THEMES.mint.btnPrimary));
    expect(install.textContent).toContain('Install Aplikasi');
    vi.restoreAllMocks();
  });
});

describe('empty results', () => {
  it('centres an icon and a heading, not just a line of text', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'Q');
    await user.type(greenBox(2), 'Q');

    const panel = screen.getByTestId('results-panel');
    expect(within(panel).getByText('Belum ada yang cocok')).toBeTruthy();
    const box = within(panel).getByText('Belum ada yang cocok').parentElement;
    expect(box.className).toContain('items-center');
    expect(box.className).toContain('text-center');
    // The icon sits in its own framed square above the text.
    expect(box.firstElementChild.className).toContain('rounded-2xl');
  });
});

describe('switching tier', () => {
  it('reuses the rows instead of replacing the whole list', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    const before = resultItems();
    expect(before.length).toBeGreaterThan(0);

    const panel = screen.getByTestId('results-panel');
    await user.click(within(panel).getByRole('tab', { name: /^Umum/ }));

    // The same <li> elements are still on screen — keying rows by word used to
    // unmount every one of them on a tier switch, which is what flickered.
    const after = resultItems();
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it('still shows the right word in each reused row', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    const panel = screen.getByTestId('results-panel');
    const wordsOf = () => resultItems().map((li) => within(li).getByText(/^[A-Z]+$/).textContent);
    const all = wordsOf();

    await user.click(within(panel).getByRole('tab', { name: /^Jarang/ }));
    const rare = wordsOf();
    expect(rare).not.toEqual(all);
    for (const word of rare) expect(word[0]).toBe('S');
  });
});
