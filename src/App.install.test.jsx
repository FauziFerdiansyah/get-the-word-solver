import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';

const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));

// Chrome refuses to offer installation when a manifest icon's declared size does
// not match the actual file — which is exactly why this app was not installable:
// word.png is 64x64 but was declared as both 192x192 and 512x512.
const realSize = (src) => {
  const file = `public/${src.replace('./', '')}`;
  const out = execSync(`file -b ${JSON.stringify(file)}`).toString();
  const match = out.match(/(\d+)\s*x\s*(\d+)/);
  return match ? `${match[1]}x${match[2]}` : null;
};

describe('PWA manifest', () => {
  it('carries the app name everywhere it is shown', () => {
    const html = readFileSync('index.html', 'utf8');
    const i18n = readFileSync('src/data/i18n.js', 'utf8');
    // One name, four surfaces: the in-app header, the tab title, the iOS home
    // screen label and the installed app's own name.
    expect(i18n).toMatch(/appTitle: 'Get The Word Solver'/);
    expect(html).toMatch(/<title>Get The Word Solver/);
    expect(html).toMatch(/apple-mobile-web-app-title" content="Get The Word Solver"/);
    expect(manifest.name).toBe('Get The Word Solver');
    // short_name has to survive a home screen label, so it stays short.
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    for (const source of [html, i18n, JSON.stringify(manifest)]) {
      expect(source).not.toMatch(/Wordle Solver/);
    }
  });

  it('declares what an installable app needs', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeTruthy();
  });

  it('has icons whose declared sizes match the actual files', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      expect(icon.type).toBe('image/png');
      expect(realSize(icon.src), `${icon.src} should really be ${icon.sizes}`).toBe(icon.sizes);
    }
  });

  it('ships the 192 and 512 icons Chrome looks for, plus a maskable one', () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  it('does not lock orientation, so tablets and desktops can install it', () => {
    // A portrait lock is honoured by Android tablets and iPadOS, which would pin
    // the installed app to portrait and make the two-column layout unreachable.
    expect(manifest.orientation).toBeUndefined();
    expect(manifest.display_override).toContain('minimal-ui');
  });

  it('uses relative paths so it works under a GitHub Pages subpath', () => {
    expect(manifest.start_url.startsWith('./')).toBe(true);
    expect(manifest.scope.startsWith('./')).toBe(true);
    for (const icon of manifest.icons) expect(icon.src.startsWith('./')).toBe(true);
  });

  it('keeps the iOS side of installation covered', () => {
    const html = readFileSync('index.html', 'utf8');
    // iOS never fires beforeinstallprompt; it needs these tags for Add to Home Screen.
    expect(html).toMatch(/apple-mobile-web-app-capable/);
    expect(html).toMatch(/apple-touch-icon" sizes="180x180"/);
    expect(realSize('./apple-touch-icon.png')).toBe('180x180');
  });

  it('registers a service worker with a fetch handler', () => {
    expect(readFileSync('src/main.jsx', 'utf8')).toMatch(/serviceWorker\.register/);
    expect(readFileSync('public/sw.js', 'utf8')).toMatch(/addEventListener\('fetch'/);
  });
});

describe('version', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  it('shows the version from package.json, never a hardcoded one', () => {
    expect(__APP_VERSION__).toBe(pkg.version);
    expect(readFileSync('src/components/SettingsModal.jsx', 'utf8')).toContain('__APP_VERSION__');
  });

  it('keeps the service worker cache name in step with the release', () => {
    // A stale CACHE_NAME leaves returning visitors on the previous bundle.
    expect(readFileSync('public/sw.js', 'utf8')).toContain(`wordle-solver-v${pkg.version}`);
  });
});

describe('install button', () => {
  let handlers;

  beforeEach(() => {
    handlers = {};
    const original = window.addEventListener.bind(window);
    // Capture only the install event; everything else still has to reach React.
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'beforeinstallprompt' || type === 'appinstalled') handlers[type] = fn;
      else original(type, fn, opts);
    });
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  });

  afterEach(() => vi.restoreAllMocks());

  const renderApp = () => render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );

  it('stays hidden until the browser says the app can be installed', () => {
    renderApp();
    expect(screen.queryByRole('button', { name: /install aplikasi/i })).toBeNull();
  });

  it('appears once beforeinstallprompt fires', () => {
    renderApp();
    const event = { preventDefault: vi.fn(), prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }) };
    act(() => handlers.beforeinstallprompt(event));

    // The default action has to be cancelled or Chrome shows its own mini-bar.
    expect(event.preventDefault).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /install aplikasi/i })).toBeTruthy();
  });
});
