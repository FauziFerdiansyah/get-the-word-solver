import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';

// jsdom loads no stylesheet, so Tailwind's `hidden` / `lg:flex` cannot be
// observed as real visibility. These assertions check the classes instead: they
// are what decides which panel a phone shows.
const setup = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  return user;
};

const inputPanel = () => screen.getByTestId('input-panel');
const resultsPanel = () => screen.getByTestId('results-panel');

describe('mobile view switcher', () => {
  it('starts on the clue view with the answers panel hidden on phones', () => {
    setup();

    const tabs = screen.getByRole('tablist', { name: 'Pilih tampilan' });
    const [clueTab, answerTab] = [...tabs.querySelectorAll('[role="tab"]')];

    expect(clueTab.getAttribute('aria-selected')).toBe('true');
    expect(answerTab.getAttribute('aria-selected')).toBe('false');

    expect(inputPanel().className).toContain('flex');
    expect(inputPanel().className).not.toContain('hidden');
    expect(resultsPanel().className).toContain('hidden lg:block');
  });

  it('swaps which panel a phone shows without touching the desktop layout', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: /Jawaban/ }));

    // Answers visible on phones, clue panel parked behind the lg breakpoint.
    expect(resultsPanel().className).toContain('block');
    expect(resultsPanel().className).not.toContain('hidden');
    expect(inputPanel().className).toContain('hidden lg:flex');

    await user.click(screen.getByRole('tab', { name: /Isi Clue/ }));
    expect(inputPanel().className).not.toContain('hidden');
  });

  it('counts the current suggestions on the answers tab', async () => {
    const user = setup();
    const answerTab = () => screen.getByRole('tab', { name: /Jawaban/ });

    // Nothing filled in yet, so there is no badge to show.
    expect(answerTab().textContent).toBe('Jawaban');

    await user.type(screen.getByLabelText('Huruf hijau posisi 1'), 'Q');
    expect(answerTab().textContent).toMatch(/Jawaban\d+/);
  });

  it('keeps the header and switcher reachable from both views', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: /Jawaban/ }));

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByLabelText('Settings')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Isi Clue/ })).toBeTruthy();
  });

  it('sits under the header, sticks to the top, and only exists on phones', () => {
    setup();
    const bar = screen.getByRole('tablist', { name: 'Pilih tampilan' }).parentElement;

    // Sticks to the top edge once the page scrolls that far, and never shows up
    // on desktop, where both panels are visible side by side.
    expect(bar.className).toContain('sticky');
    expect(bar.className).toContain('top-0');
    expect(bar.className).toContain('lg:hidden');

    // Order: header (logo) → tabs → clue panel.
    const header = document.querySelector('header');
    const clueCard = screen.getByTestId('input-panel');
    expect(header.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar.compareDocumentPosition(clueCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens settings as a full screen sheet on phones only', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));

    const sheet = screen.getByLabelText('Tutup').closest('div[class*="overflow-y-auto"]');
    // Phone: fills the screen with no rounded card. Desktop: back to a card.
    expect(sheet.className).toContain('h-full');
    expect(sheet.className).toContain('sm:h-auto');
    expect(sheet.className).toContain('sm:max-w-sm');
    expect(sheet.className).toContain('sm:rounded-xl');
  });

  it('sticks the tier tabs directly under the Clues/Answers bar', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Huruf hijau posisi 1'), 'S');

    const tabs = screen.getByRole('tab', { name: /^Semua/ }).parentElement;
    expect(tabs.className).toContain('sticky');
    // Offset by the switcher's measured height, not a hardcoded number.
    expect(tabs.style.top).toBe('var(--view-switcher-h, 0px)');
    // Opaque, or the list would scroll through it.
    expect(tabs.style.backgroundColor).toBeTruthy();
    // Desktop shows both panels at once, so nothing needs pinning there.
    expect(tabs.className).toContain('lg:static');
  });

  it('publishes the switcher height for the tabs to sit under', () => {
    setup();
    // jsdom reports 0 for offsetHeight, but the property has to be written or
    // the tabs would stack on top of the switcher on a real device.
    expect(document.documentElement.style.getPropertyValue('--view-switcher-h')).toMatch(/px$/);
  });

  it('cannot leave the tier tabs pinned over the clue view', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Huruf hijau posisi 1'), 'S');
    await user.click(screen.getByRole('tab', { name: /Jawaban/ }));
    await user.click(screen.getByRole('tab', { name: /Isi Clue/ }));

    // The whole results panel is display:none on the clue view, so a sticky
    // child of it cannot render.
    expect(screen.getByTestId('results-panel').className).toContain('hidden');
  });

  it('gives the settings title a bordered header bar that stays put', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));

    const bar = screen.getByRole('heading', { level: 2, name: /Pengaturan/ }).parentElement;
    // The border is what separates the title from content scrolling under it.
    expect(bar.className).toContain('border-b-2');
    expect(bar.className).toContain('sticky');
    // Themed, not a hardcoded colour — dark mode has broken that way before.
    expect(bar.style.borderColor).toBeTruthy();
    expect(bar.style.backgroundColor).toBeTruthy();
    // Close button lives in the same bar, so it is reachable at any scroll depth.
    expect(bar.contains(screen.getByLabelText('Tutup'))).toBe(true);
  });

  it('credits the developer with a link to their site', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));

    const link = screen.getByRole('link', { name: /Fauzi Ferdiansyah/ });
    expect(link.getAttribute('href')).toBe('https://fauzi.is-a.dev/');
    expect(link.getAttribute('target')).toBe('_blank');
    // rel is required with target=_blank so the new tab cannot reach window.opener.
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.textContent).toContain('Dibuat oleh');
  });
});
