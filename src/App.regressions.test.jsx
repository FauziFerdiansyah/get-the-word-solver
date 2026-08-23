import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
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

const resultItems = () =>
  within(screen.getByTestId('results-panel')).queryAllByRole('listitem');
const resultWords = () =>
  resultItems().map((li) => within(li).getByText(/^[A-Z]+$/).textContent);
const greenBox = (n) => screen.getByLabelText(`Huruf hijau posisi ${n}`);
const yellowBox = (n) => screen.getByLabelText(`Huruf kuning (bukan di posisi ini) ${n}`);

describe('switching input mode', () => {
  it('keeps what was already typed on both sides', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');

    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    await user.type(screen.getByLabelText('Baris 1, kotak 1'), 'C');

    // Back to the clue row: the S is still there.
    await user.click(screen.getByRole('button', { name: /1 Baris/ }));
    expect(greenBox(1).value).toBe('S');

    // And the board still holds its C.
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    expect(screen.getByLabelText('Baris 1, kotak 1').value).toBe('C');
  });

  it('still clears everything when the word length changes', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    await user.click(screen.getByRole('button', { name: '4 Huruf' }));
    await user.click(screen.getByRole('button', { name: 'Ya, Reset' }));

    expect(greenBox(1).value).toBe('');
  });
});

describe('a green letter settles its position', () => {
  it('clears that position ruled-out box, since nothing else can sit there', async () => {
    const user = renderApp();
    await user.type(yellowBox(2), 'A');
    expect(yellowBox(2).value).toBe('A');

    await user.type(greenBox(2), 'E');
    expect(yellowBox(2).value).toBe('');
  });

  it('leaves it alone while the letter is still yellow', async () => {
    const user = renderApp();
    await user.type(yellowBox(2), 'A');
    await user.type(greenBox(2), 'E');
    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 2/)); // → yellow
    await user.type(yellowBox(2), 'R');

    expect(yellowBox(2).value).toBe('R');
  });

  it('clears it when a letter is switched back to green', async () => {
    const user = renderApp();
    await user.type(greenBox(3), 'E');
    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 3/)); // → yellow
    await user.type(yellowBox(3), 'T');
    expect(yellowBox(3).value).toBe('T');

    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 3/)); // → green
    expect(yellowBox(3).value).toBe('');
  });
});

describe('empty results', () => {
  it('names the letters that were marked present and crossed out at once', async () => {
    const user = renderApp();
    await user.type(yellowBox(1), 'S');
    await user.click(screen.getByRole('button', { name: 'S' })); // cross S out

    const panel = screen.getByTestId('results-panel');
    expect(within(panel).getByText(/S .*dicoret di keyboard/)).toBeTruthy();
  });

  it('falls back to the plain message when nothing contradicts', async () => {
    const user = renderApp();
    // A real but unsatisfiable set, with no letter both present and absent.
    await user.type(greenBox(1), 'Q');
    await user.type(greenBox(2), 'Q');

    expect(resultWords()).toHaveLength(0);
    const panel = screen.getByTestId('results-panel');
    expect(within(panel).getByText(/Tidak ada kata yang cocok/)).toBeTruthy();
  });
});

describe('the HEART case from the field report', () => {
  it('suggests HEART for R/A yellow with T green', async () => {
    const user = renderApp();
    // Top row: R and A placed then flipped to yellow, T green at position 5.
    await user.type(greenBox(1), 'R');
    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 1/));
    await user.type(greenBox(2), 'A');
    await user.click(screen.getByLabelText(/Ubah warna huruf posisi 2/));
    await user.type(greenBox(5), 'T');

    // Ruled-out boxes for the remaining positions.
    await user.click(screen.getByLabelText('Settings'));
    const row = screen.getByText('Kotak kuning multi-huruf').closest('div');
    await user.click(row.querySelector('button'));
    await user.click(screen.getByLabelText('Tutup'));

    await user.type(yellowBox(3), 'TE');
    await user.type(yellowBox(4), 'AE');

    expect(resultWords()).toContain('HEART');
  });
});

describe('icons and splash art', () => {
  const realSize = (file) => {
    const out = execSync(`file -b ${JSON.stringify(`public/${file}`)}`).toString();
    const m = out.match(/(\d+)\s*x\s*(\d+)/);
    return m ? `${m[1]}x${m[2]}` : null;
  };
  const cornerIsWhite = (file) => {
    const out = execSync(
      `magick ${JSON.stringify(`public/${file}`)} -format "%[pixel:p{3,3}]" info:`
    ).toString();
    return /255,\s*255,\s*255/.test(out);
  };

  it('gives the icons that must be opaque a white background', () => {
    // Only these two: a maskable icon is cropped by the platform, and iOS
    // composites a transparent touch icon onto black. The any-purpose icons stay
    // transparent so the launch screen shows artwork, not a white square.
    for (const file of ['icon-maskable-512.png', 'apple-touch-icon.png']) {
      expect(cornerIsWhite(file), `${file} corner is not white`).toBe(true);
    }
  });

  it('keeps the maskable icon inside the safe zone', () => {
    // Android crops a maskable icon to a circle over the centre 80%: content
    // wider than 410px of the 512 canvas gets its edges shaved off.
    const out = execSync(
      'magick public/icon-maskable-512.png -alpha off -fuzz 5% -trim -format "%w %h" info:'
    ).toString().trim().split(/\s+/).map(Number);
    expect(Math.max(...out)).toBeLessThanOrEqual(410);
  });

  it('declares an OG image that really is that size', () => {
    const html = readFileSync('index.html', 'utf8');
    // The URL is templated (%VITE_SITE_URL%og-image.png), so take the file name.
    const src = html.match(/og:image" content="[^"]*?([\w.-]+\.png)"/)[1];
    const width = html.match(/og:image:width" content="(\d+)"/)[1];
    const height = html.match(/og:image:height" content="(\d+)"/)[1];
    expect(realSize(src)).toBe(`${width}x${height}`);
  });

  it('ships both launch backgrounds and keeps public small', () => {
    for (const file of ['screen-light.svg', 'screen-dark.svg']) {
      expect(statSync(`public/${file}`).size).toBeGreaterThan(500);
    }
    const total = execSync('du -sk public').toString().split(/\s+/)[0];
    // A static app should not carry megabytes of unused source art.
    expect(Number(total)).toBeLessThan(1024);
  });

  it('puts the Android splash on white', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
    expect(manifest.background_color).toBe('#ffffff');
  });
});

describe('launch screen', () => {
  afterEach(() => { window.matchMedia = undefined; });

  it('stays out of the way in a browser tab', () => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    renderApp();
    expect(document.querySelector('img[src="./icon-512.png"]')).toBeNull();
  });

  it('covers the screen when launched as an installed app, then leaves', async () => {
    vi.useFakeTimers();
    window.matchMedia = (q) => ({
      matches: q.includes('standalone'), addListener() {}, removeListener() {},
    });
    render(<ThemeProvider><App /></ThemeProvider>);

    const icon = document.querySelector('img[src="./icon-512.png"]');
    expect(icon).toBeTruthy();
    // Painted over the platform's own splash, using the provided art.
    expect(icon.parentElement.style.backgroundImage).toContain('screen-light.svg');

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(document.querySelector('img[src="./icon-512.png"]')).toBeNull();
    vi.useRealTimers();
  });
});

describe('install progress', () => {
  let handlers;

  beforeEach(() => {
    handlers = {};
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'beforeinstallprompt' || type === 'appinstalled') handlers[type] = fn;
      else original(type, fn, opts);
    });
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      clone: () => ({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(2048)) }),
    })));
    vi.stubGlobal('caches', { open: () => Promise.resolve({ put: () => Promise.resolve() }) });
  });

  afterEach(() => vi.restoreAllMocks());

  it('measures real downloads, then waits on the OS for the rest', async () => {
    const user = renderApp();
    act(() => handlers.beforeinstallprompt({
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }));

    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));

    const dialog = await screen.findByRole('dialog', { name: /Menyiapkan aplikasi|Aplikasi siap/ });
    const bar = within(dialog).getByRole('progressbar');

    // Downloading owns 90% of the bar and every step is a file really fetched.
    await waitFor(() => expect(bar.getAttribute('aria-valuenow')).toBe('90'));
    expect(window.fetch.mock.calls.length).toBeGreaterThan(5);
    // Each fetch bypasses the HTTP cache, so the bytes are genuinely moved.
    expect(window.fetch.mock.calls[0][1]).toEqual({ cache: 'reload' });
    expect(within(dialog).getByText(/Menyelesaikan pemasangan/)).toBeTruthy();

    // The last stretch closes only when the OS says the install is done.
    act(() => handlers.appinstalled());
    await waitFor(() => expect(bar.getAttribute('aria-valuenow')).toBe('100'));
    expect(within(dialog).getByText(/Aplikasi siap/)).toBeTruthy();
    // The closing button reports the outcome rather than saying "Mengerti".
    expect(within(dialog).getByRole('button', { name: 'Berhasil Diinstall' })).toBeTruthy();
  });

  it('does not appear when the user dismisses the prompt', async () => {
    const user = renderApp();
    act(() => handlers.beforeinstallprompt({
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    }));

    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('iOS guide copy button', () => {
  const originalUA = navigator.userAgent;
  const setUA = (v) => Object.defineProperty(navigator, 'userAgent', { value: v, configurable: true });

  beforeEach(() => {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile Safari/604.1');
  });
  afterEach(() => setUA(originalUA));

  it('offers exactly one button among the step icons', async () => {
    // userEvent.setup() installs its own clipboard stub, so the copied value is
    // read back from it rather than through a spy of our own.
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /install aplikasi/i }));
    const dialog = screen.getByRole('dialog', { name: /install aplikasi/i });

    const steps = within(dialog).getAllByRole('listitem');
    const buttons = steps.flatMap((li) => [...li.querySelectorAll('button')]);
    expect(buttons).toHaveLength(1);

    await user.click(within(dialog).getByLabelText('Salin alamat halaman'));
    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe(window.location.href);
    });
  });
});
