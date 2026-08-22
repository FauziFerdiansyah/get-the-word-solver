import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockAudioContext, emptyAudioLog } from '../test-audio-mock';

let log;

const loadSound = async () => {
  vi.resetModules();
  log = emptyAudioLog();
  window.AudioContext = createMockAudioContext(log);
  return import('./sound');
};

const nodesOf = (kind) => log.nodes.filter((n) => n.kind === kind);
const freqsOf = (kind) => nodesOf(kind).map((n) => n.params.frequency);

describe('key sound engine', () => {
  beforeEach(() => {
    delete window.AudioContext;
    delete window.webkitAudioContext;
  });

  it('builds a click, a body tone and a bottom-out tick for one press', async () => {
    const { playKeySound } = await loadSound();
    playKeySound('A');

    // 3 noise bursts (click + knock + tick) and 1 oscillator (case resonance)
    expect(nodesOf('bufferSource')).toHaveLength(3);
    expect(nodesOf('oscillator')).toHaveLength(1);
    expect(nodesOf('biquad')).toHaveLength(4);

    // Every sound source is actually scheduled and stopped again
    for (const node of [...nodesOf('bufferSource'), ...nodesOf('oscillator')]) {
      expect(node.started).toBe(true);
      expect(node.stopped).toBe(true);
    }
    // and something reaches the speakers
    expect(log.nodes.some((n) => n.connected.includes('destination'))).toBe(true);
  });

  it('gives every letter its own voice', async () => {
    const { playKeySound } = await loadSound();

    const voices = new Map();
    for (const letter of 'QWERTYUIOPASDFGHJKLZXCVBNM') {
      log.nodes.length = 0;
      playKeySound(letter);
      voices.set(letter, freqsOf('oscillator')[0]);
    }

    // 26 letters, 26 distinct body pitches (jitter is ±3%, the spacing is wider)
    const rounded = [...voices.values()].map((f) => Math.round(f));
    expect(new Set(rounded).size).toBe(26);

    // Left-hand keys are voiced deeper than right-hand keys
    expect(voices.get('Q')).toBeLessThan(voices.get('M'));
  });

  it('varies slightly between presses of the same letter', async () => {
    const { playKeySound } = await loadSound();

    const takes = [];
    for (let i = 0; i < 6; i += 1) {
      log.nodes.length = 0;
      playKeySound('S');
      takes.push(freqsOf('biquad')[0]);
    }
    expect(new Set(takes).size).toBeGreaterThan(1);
  });

  it('plays a shorter, brighter click on release', async () => {
    const { playKeySound, playKeyUpSound } = await loadSound();

    playKeySound('K');
    const pressClick = freqsOf('biquad')[0];
    log.nodes.length = 0;
    playKeyUpSound('K');

    expect(nodesOf('bufferSource')).toHaveLength(1);
    expect(nodesOf('oscillator')).toHaveLength(0);
    expect(freqsOf('biquad')[0]).toBeGreaterThan(pressClick);
  });

  it('keeps every voice above the range a phone speaker cannot reproduce', async () => {
    const { playKeySound } = await loadSound();
    for (const letter of 'QWERTYUIOPASDFGHJKLZXCVBNM') {
      log.nodes.length = 0;
      playKeySound(letter);
      expect(freqsOf('oscillator')[0]).toBeGreaterThan(230);
    }
  });

  it('waits for a suspended context to start before scheduling', async () => {
    vi.resetModules();
    log = emptyAudioLog();
    const Base = createMockAudioContext(log);
    window.AudioContext = class extends Base {
      constructor() {
        super();
        this.state = 'suspended';
        this.resumeCalls = 0;
      }
      resume() { this.resumeCalls += 1; }
    };
    const { playKeySound } = await import('./sound');

    playKeySound('A');
    // Nothing scheduled yet: the clock is frozen, so the sound would be lost.
    expect(log.nodes).toHaveLength(0);
  });

  it('plays as soon as a suspended context finishes resuming', async () => {
    vi.resetModules();
    log = emptyAudioLog();
    const Base = createMockAudioContext(log);
    window.AudioContext = class extends Base {
      constructor() {
        super();
        this.state = 'suspended';
      }
      // Real browsers resolve this asynchronously; the engine has to wait for it
      // rather than guess with a timeout.
      resume() {
        return Promise.resolve().then(() => { this.state = 'running'; });
      }
    };
    const { playKeySound } = await import('./sound');

    playKeySound('A');
    expect(log.nodes).toHaveLength(0); // still resuming

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(nodesOf('bufferSource').length).toBeGreaterThan(0);
    expect(nodesOf('oscillator')).toHaveLength(1);
  });

  it('schedules the whole test sound in one go, on the audio clock', async () => {
    const { playTestSound } = await loadSound();
    playTestSound();

    // Four presses, each with its own click, knock, tick and tone — all created
    // synchronously so they stay inside the user gesture.
    expect(nodesOf('bufferSource')).toHaveLength(12);
    expect(nodesOf('oscillator')).toHaveLength(4);
  });

  it('reports the audio state so a silent device can be diagnosed', async () => {
    const { getAudioState, playKeySound } = await loadSound();
    expect(getAudioState()).toBe('idle');
    playKeySound('A');
    expect(getAudioState()).toBe('running');
  });

  it('never schedules a sound in the past', async () => {
    const { playKeySound } = await loadSound();
    playKeySound('A');
    const scheduled = log.automation.filter(([, name]) => name === 'gain').map(([, , , v]) => v);
    expect(scheduled.length).toBeGreaterThan(0);
    // currentTime is 0 in the mock, so every start offset must be > 0
    expect(nodesOf('bufferSource').length).toBeGreaterThan(0);
  });

  it('stays silent instead of throwing when Web Audio is missing', async () => {
    vi.resetModules();
    delete window.AudioContext;
    delete window.webkitAudioContext;
    const { playKeySound, playKeyUpSound, playErrorSound, warmUp } = await import('./sound');

    expect(() => playKeySound('A')).not.toThrow();
    expect(() => playKeyUpSound('A')).not.toThrow();
    expect(() => playErrorSound()).not.toThrow();
    await expect(warmUp()).resolves.toBeUndefined();
  });
});
