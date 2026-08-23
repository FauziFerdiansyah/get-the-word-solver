import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
import { SWITCHES, FEELS, DEFAULT_SWITCH } from './data/switches';
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

const openSound = async (user) => {
  await user.click(screen.getByLabelText('Settings'));
  await user.click(screen.getByRole('button', { name: /Atur Suara Ketik/ }));
  return screen.getByRole('dialog', { name: 'Atur Suara Ketik' });
};

describe('toast layout', () => {
  it('stacks the description under the title, never beside it', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const block = css.slice(css.indexOf('.gooey-content {'), css.indexOf('.gooey-header'));

    // The library positions the description as a block below the header and
    // spaces it with margin-top. A row direction put it alongside the title.
    expect(block).toContain('flex-direction: column');
    expect(block).not.toMatch(/flex-direction:\s*row/);
    // Centring still has to hold.
    expect(block).toContain('align-items: center');
    expect(block).toContain('justify-content: center');
  });

  it('leaves the library free to space the description itself', () => {
    const ours = readFileSync('src/index.css', 'utf8');
    const theirs = readFileSync('node_modules/goey-toast/dist/index.css', 'utf8');
    expect(theirs).toMatch(/\.gooey-description \{[^}]*margin-top: 16px/);
    // We only centre its text; overriding the margin would fight the animation.
    const block = ours.slice(ours.indexOf('.gooey-description {'));
    expect(block.slice(0, block.indexOf('}'))).not.toContain('margin');
  });
});

describe('switch packs', () => {
  it('offers all three characteristics, with the switches asked for', () => {
    expect(new Set(SWITCHES.map((s) => s.feel))).toEqual(new Set(FEELS));
    const names = SWITCHES.map((s) => s.name);
    expect(names).toContain('Cherry MX Blue');
    expect(names).toContain('Cherry MX Brown');
    expect(names).toContain('Cherry MX Black');
  });

  it('states in the generated file why Gateron is absent', () => {
    // The Mechvibes repository ships no Gateron pack, and the only other packs
    // with per-key samples use a format this pipeline cannot read.
    const data = readFileSync('src/data/switches.js', 'utf8');
    expect(data).toMatch(/Gateron/);
    expect(SWITCHES.some((s) => /gateron/i.test(s.name))).toBe(false);
  });

  it('points every switch at a file that exists', () => {
    for (const entry of SWITCHES) {
      const file = `public/${entry.file.replace('./', '')}`;
      expect(() => readFileSync(file), `${file} missing`).not.toThrow();
    }
  });
});

describe('sound settings popup', () => {
  beforeEach(() => localStorage.clear());

  it('opens from the sound row in Settings', async () => {
    const user = renderApp();
    const dialog = await openSound(user);

    expect(within(dialog).getByLabelText('Volume')).toBeTruthy();
    for (const entry of SWITCHES) {
      expect(within(dialog).getByRole('button', { name: new RegExp(entry.name) })).toBeTruthy();
    }
  });

  it('groups the switches by how they feel', async () => {
    const user = renderApp();
    const dialog = await openSound(user);

    expect(within(dialog).getByText(/^Linear$/)).toBeTruthy();
    expect(within(dialog).getByText(/^Tactile$/)).toBeTruthy();
    expect(within(dialog).getByText(/^Clicky$/)).toBeTruthy();
    // Each heading explains what the characteristic means.
    expect(within(dialog).getByText(/halus, tanpa terasa nyangkut/)).toBeTruthy();
  });

  it('marks the current switch and remembers a new one', async () => {
    const user = renderApp();
    let dialog = await openSound(user);

    const current = SWITCHES.find((s) => s.id === DEFAULT_SWITCH);
    expect(
      within(dialog).getByRole('button', { name: new RegExp(current.name) }).getAttribute('aria-pressed')
    ).toBe('true');

    const other = SWITCHES.find((s) => s.id !== DEFAULT_SWITCH);
    await user.click(within(dialog).getByRole('button', { name: new RegExp(other.name) }));

    await waitFor(() => expect(localStorage.getItem('ws-switch')).toBe(other.id));
    expect(
      within(dialog).getByRole('button', { name: new RegExp(other.name) }).getAttribute('aria-pressed')
    ).toBe('true');
  });

  it('changes the volume with a slider and stores it', async () => {
    const user = renderApp();
    const dialog = await openSound(user);
    const slider = within(dialog).getByLabelText('Volume');

    expect(slider.getAttribute('type')).toBe('range');
    expect(Number(slider.value)).toBeGreaterThan(0);

    // jsdom does not implement keyboard stepping on a range input, so the change
    // is dispatched directly.
    fireEvent.change(slider, { target: { value: '40' } });

    await waitFor(() => expect(Number(localStorage.getItem('ws-volume'))).toBeCloseTo(0.4, 2));
    expect(within(dialog).getByText('40%')).toBeTruthy();

    // Zero is reachable, and silences the samples rather than muting the app.
    fireEvent.change(slider, { target: { value: '0' } });
    await waitFor(() => expect(within(dialog).getByText('0%')).toBeTruthy());
  });

  it('plays a preview when a switch is picked, so the choice is audible', async () => {
    const user = renderApp();
    const dialog = await openSound(user);
    log.nodes.length = 0;

    const other = SWITCHES.find((s) => s.id !== DEFAULT_SWITCH);
    await user.click(within(dialog).getByRole('button', { name: new RegExp(other.name) }));

    await waitFor(() => expect(log.nodes.filter((n) => n.kind === 'bufferSource').length).toBeGreaterThan(0));
  });

  it('says where the samples come from', async () => {
    const user = renderApp();
    const dialog = await openSound(user);
    expect(within(dialog).getByText(/Mechvibes/)).toBeTruthy();
    expect(within(dialog).getByText(/MIT/)).toBeTruthy();
  });
});
