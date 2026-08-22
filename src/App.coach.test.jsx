import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import { LANG } from './data/i18n';
import App from './App';

const setup = async () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  await user.click(screen.getByLabelText('Panduan'));
  return user;
};

const dialog = () => screen.getByRole('dialog', { name: 'Panduan' });
const stepTitle = () => within(dialog()).getByRole('heading', { level: 3 }).textContent;
const counter = () => within(dialog()).getByText(/^\d+\/\d+$/).textContent;

describe('coach mark content', () => {
  it('gives every step its own icon in both languages', () => {
    // The icons used to live in a separate array in the component, which ran out
    // when steps were added and left the last ones on a generic fallback.
    for (const lang of ['id', 'en']) {
      const steps = LANG[lang].coach;
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.icon, `${lang}: ${step.title}`).toMatch(/^tabler:/);
        expect(step.title).toBeTruthy();
        expect(step.desc).toBeTruthy();
      }
    }
  });

  it('keeps both languages in step', () => {
    expect(LANG.en.coach.length).toBe(LANG.id.coach.length);
    expect(LANG.en.coach.map((s) => s.icon)).toEqual(LANG.id.coach.map((s) => s.icon));
  });

  it('describes the app as it works now', () => {
    const text = LANG.id.coach.map((s) => `${s.title} ${s.desc}`).join(' ');
    // Anything mentioned here has to exist; anything removed must be gone.
    expect(text).toMatch(/6 Baris/);
    expect(text).toMatch(/#1/);
    expect(text).toMatch(/Isi Clue.*Jawaban|Jawaban/);
    expect(text).toMatch(/Install aplikasi/);
    expect(text).not.toMatch(/Cari Jawaban/); // the search button is gone
    expect(text).not.toMatch(/"AA"/); // so is the duplicate-letter encoding
  });
});

describe('coach mark navigation', () => {
  it('starts at the first step and walks forward', async () => {
    const user = await setup();
    expect(counter()).toBe(`1/${LANG.id.coach.length}`);
    expect(stepTitle()).toBe(LANG.id.coach[0].title);

    await user.click(within(dialog()).getByRole('button', { name: /Lanjut/ }));
    expect(counter()).toBe(`2/${LANG.id.coach.length}`);
    expect(stepTitle()).toBe(LANG.id.coach[1].title);
  });

  it('keeps the back button in place but disabled on the first step', async () => {
    const user = await setup();
    const back = () => within(dialog()).getByRole('button', { name: /Kembali/ });

    // Present from the start: hiding it used to shift the next button sideways.
    expect(back().disabled).toBe(true);

    await user.click(within(dialog()).getByRole('button', { name: /Lanjut/ }));
    expect(back().disabled).toBe(false);
    await user.click(back());
    expect(counter()).toBe(`1/${LANG.id.coach.length}`);
  });

  it('jumps straight to a step from the progress bar', async () => {
    const user = await setup();
    const target = LANG.id.coach.length - 1;
    await user.click(within(dialog()).getByRole('tab', { name: new RegExp(`^${target + 1}\\.`) }));

    expect(counter()).toBe(`${target + 1}/${LANG.id.coach.length}`);
    expect(stepTitle()).toBe(LANG.id.coach[target].title);
  });

  it('walks with the arrow keys and closes on Escape', async () => {
    const user = await setup();
    await user.keyboard('{ArrowRight}');
    expect(counter()).toBe(`2/${LANG.id.coach.length}`);
    await user.keyboard('{ArrowLeft}');
    expect(counter()).toBe(`1/${LANG.id.coach.length}`);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Panduan' })).toBeNull();
  });

  it('finishes on the last step and reopens from the beginning', async () => {
    const user = await setup();
    const last = LANG.id.coach.length;
    await user.click(within(dialog()).getByRole('tab', { name: new RegExp(`^${last}\\.`) }));

    await user.click(within(dialog()).getByRole('button', { name: /Mengerti/ }));
    expect(screen.queryByRole('dialog', { name: 'Panduan' })).toBeNull();

    await user.click(screen.getByLabelText('Panduan'));
    expect(counter()).toBe(`1/${last}`);
  });
});
