import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './contexts/ThemeContext';
import { createMockAudioContext, emptyAudioLog } from './test-audio-mock';
import App from './App';

// End-to-end check that the sound engine is actually wired to the UI. The unit
// tests prove the synth builds a voice; these prove something calls it.
//
// The engine caches its AudioContext at module scope, so the log has to be a
// single shared object that gets emptied between tests — handing out a fresh log
// per test would leave the cached context reporting into the old one.
const log = emptyAudioLog();
window.AudioContext = createMockAudioContext(log);

const setup = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  return user;
};

const soundsPlayed = () => log.nodes.filter((n) => n.kind === 'bufferSource').length;
const voicesPlayed = () => log.nodes.filter((n) => n.kind === 'oscillator');
const clearLog = () => {
  log.nodes.length = 0;
  log.automation.length = 0;
};

describe('sound wiring', () => {
  beforeEach(clearLog);

  it('plays a key sound when a keyboard letter is tapped', async () => {
    const user = setup();
    expect(soundsPlayed()).toBe(0);

    await user.click(screen.getByRole('button', { name: 'T' }));

    expect(soundsPlayed()).toBeGreaterThan(0);
  });

  it('plays a key sound when typing a clue letter', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Huruf hijau posisi 1'), 'S');

    expect(soundsPlayed()).toBeGreaterThan(0);
  });

  it('plays a key sound when typing on the 6-row board', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    clearLog();

    await user.type(screen.getByLabelText('Baris 1, kotak 1'), 'A');

    expect(soundsPlayed()).toBeGreaterThan(0);
  });

  it('uses a different voice per letter', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Q' }));
    const first = voicesPlayed()[0].params.frequency;
    clearLog();
    await user.click(screen.getByRole('button', { name: 'M' }));
    const second = voicesPlayed()[0].params.frequency;

    expect(first).not.toBeCloseTo(second, 1);
  });

  it('goes quiet when the sound setting is switched off', async () => {
    const user = setup();
    await user.click(screen.getByLabelText('Settings'));
    await user.click(screen.getByText('Sound Effect').closest('div').querySelector('button[class*="rounded-full"]'));
    await user.click(screen.getByLabelText('Settings'));
    clearLog();

    await user.click(screen.getByRole('button', { name: 'T' }));

    expect(soundsPlayed()).toBe(0);
  });
});
