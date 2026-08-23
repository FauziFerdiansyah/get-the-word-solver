import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { execSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { ThemeProvider } from './contexts/ThemeContext';
import { SWITCHES, SWITCH_SLOT_MS } from './data/switches';
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

const clearLog = () => { log.nodes.length = 0; log.automation.length = 0; };
const sounds = () => log.nodes.filter((n) => n.kind === 'bufferSource').length;
const greenBox = (n) => screen.getByLabelText(`Huruf hijau posisi ${n}`);
const boardCell = (row, col) => screen.getByLabelText(`Baris ${row}, kotak ${col}`);

describe('key sound latency', () => {
  beforeEach(clearLog);

  it('plays once per keystroke, not twice', async () => {
    const user = renderApp();
    // keydown plays it and the change handler must not play it again.
    await user.type(greenBox(1), 'S');
    const afterOne = sounds();
    expect(afterOne).toBeGreaterThan(0);

    clearLog();
    await user.type(greenBox(2), 'T');
    // The same amount of work for the second letter as for the first.
    expect(sounds()).toBe(afterOne);
  });

  it('plays on keydown, before the value has changed', async () => {
    const user = renderApp();
    const box = greenBox(1);
    box.focus();

    clearLog();
    await user.keyboard('{keydown}');
    // A bare modifier makes no sound.
    expect(sounds()).toBe(0);

    await user.keyboard('S');
    expect(sounds()).toBeGreaterThan(0);
  });

  it('plays once when deleting, too', async () => {
    const user = renderApp();
    await user.type(greenBox(1), 'S');
    clearLog();

    await user.type(greenBox(1), '{Backspace}');
    expect(sounds()).toBeGreaterThan(0);
    const once = sounds();

    await user.type(greenBox(2), 'A');
    clearLog();
    await user.type(greenBox(2), '{Backspace}');
    expect(sounds()).toBe(once);
  });

  it('stays silent for a letter that is crossed out', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: 'T' })); // cross T out
    clearLog();

    await user.type(greenBox(1), 'T');
    // The conflict cue plays instead, and it is not a sample from the sprite.
    expect(sounds()).toBe(0);
  });

  it('applies on the 6-row board as well', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: /6 Baris/ }));
    clearLog();

    await user.type(boardCell(1, 1), 'C');
    const once = sounds();
    expect(once).toBeGreaterThan(0);

    clearLog();
    await user.type(boardCell(1, 2), 'R');
    expect(sounds()).toBe(once);
  });
});

describe('sample onset', () => {
  it('starts each sample at its slot boundary, not after room tone', () => {
    // Every millisecond of silence in front of a sample is latency the player
    // cannot recover, because playback starts at the slot boundary. The generator
    // strips it; this measures the result.
    const dir = mkdtempSync('/tmp/onset-');
    const wav = `${dir}/decoded.wav`;
    const file = `public/${SWITCHES[0].file.replace('./', '')}`;
    execSync(`ffmpeg -hide_banner -loglevel error -y -i ${file} -ac 1 -ar 32000 -f wav ${wav}`);

    const buffer = readFileSync(wav);
    const rate = 32000;
    const slot = Math.round((SWITCH_SLOT_MS / 1000) * rate);
    const samples = new Int16Array(
      buffer.buffer.slice(buffer.byteOffset + 44, buffer.byteOffset + buffer.length)
    );

    const onsets = [];
    for (let i = 0; i < SWITCHES.length && i < 27; i += 1) {
      const start = i * slot;
      let onset = null;
      for (let j = 0; j < slot; j += 1) {
        if (Math.abs(samples[start + j]) > 900) { onset = (j / rate) * 1000; break; }
      }
      if (onset !== null) onsets.push(onset);
    }

    const mean = onsets.reduce((a, b) => a + b, 0) / onsets.length;
    // Was 6.4ms on average before trimming, with slots as bad as 17ms.
    expect(mean).toBeLessThan(5);
    expect(Math.max(...onsets)).toBeLessThan(16);
  });

  it('trims the silence in the generator, not at playback', () => {
    const builder = readFileSync('scripts/build-key-sounds.mjs', 'utf8');
    expect(builder).toContain('silenceremove');
    // Fixed slots stay the contract, so the player needs no offset table.
    expect(readFileSync('src/utils/sound.js', 'utf8')).toContain('SPRITE_SLOT');
  });
});
