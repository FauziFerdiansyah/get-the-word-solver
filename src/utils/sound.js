// Keyboard sound engine.
//
// Key presses are synthesised rather than sampled, so every letter gets its own
// voice the way a Mechvibes pack does — without shipping a sound pack of
// uncertain licensing, and without any download at all.
//
// A mechanical switch is four things layered together:
//   1. click   — a short filtered noise burst (the switch leaf)
//   2. knock   — a mid-band burst that gives the press its body
//   3. tone    — a fast decaying pitch (the plate and case resonating)
//   4. bottom  — a faint high tick as the key bottoms out
//
// Frequencies are deliberately kept above ~240 Hz: phone speakers roll off hard
// below that, and an earlier version voiced the body at 110–250 Hz, which made
// the whole press nearly inaudible on a handset.

const ERROR_SOUND = './error.wav';
const BELL_SOUND = './bell.wav';

let audioCtx = null;
let noiseBuffer = null;
let errorBuffer = null;
let bellBuffer = null;

function getCtx() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  const Ctor =
    typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctor) return null; // no Web Audio (SSR, tests, very old browsers)
  audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// A browser will not start an AudioContext outside a user gesture, and
// `resume()` is asynchronous. Chaining off its promise is the only reliable way
// to play the very first sound: an earlier version retried inside
// `setTimeout(..., 60)`, which both guessed at the timing and ran outside the
// gesture, so the first press — and every note of the test sound — was dropped.
let resuming = null;

function ensureRunning(ctx) {
  if (ctx.state === 'running') return Promise.resolve(ctx);
  if (!resuming) {
    let attempt;
    try {
      attempt = ctx.resume();
    } catch {
      attempt = undefined;
    }
    resuming = Promise.resolve(attempt)
      .catch(() => undefined)
      .then(() => {
        resuming = null;
        return ctx;
      });
  }
  return resuming;
}

function withContext(play) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'running') {
    play(ctx);
    return;
  }
  ensureRunning(ctx).then((running) => {
    if (running.state === 'running') play(running);
  });
}

// Reported by the Test button in Settings so a silent device can be diagnosed.
export function getAudioState() {
  if (typeof window === 'undefined') return 'unsupported';
  if (!(window.AudioContext || window.webkitAudioContext)) return 'unsupported';
  return audioCtx ? audioCtx.state : 'idle';
}

// A hair in the future: scheduling exactly at currentTime is routinely dropped.
const startTime = (ctx) => ctx.currentTime + 0.005;

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.2);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

async function loadBuffer(ctx, url) {
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  return ctx.decodeAudioData(arrayBuf);
}

// Called on the first user gesture: unlocks the context and pre-builds
// everything so the first keypress is not delayed.
let loaded = false;
export async function warmUp() {
  if (loaded) return;
  const ctx = getCtx();
  if (!ctx) return;
  loaded = true;
  getNoise(ctx);
  // Safari keeps a context asleep until something has actually been played, so
  // push one silent sample through it while we still hold the user gesture.
  try {
    const silent = ctx.createBufferSource();
    silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    silent.connect(ctx.destination);
    silent.start(0);
  } catch {
    // Not fatal — the synthesised sounds are scheduled independently.
  }
  try {
    const [e, b] = await Promise.all([
      loadBuffer(ctx, ERROR_SOUND),
      loadBuffer(ctx, BELL_SOUND),
    ]);
    errorBuffer = e;
    bellBuffer = b;
  } catch {
    // Silently fail — the synthesised key sounds still work.
  }
}

// Per-letter voices, spread across the keyboard so neighbouring letters differ
// audibly. Keys on the left are voiced deeper than keys on the right, like a
// real board whose case resonates differently along its width. Pitches climb
// geometrically (about 5% per key) so the per-press jitter can never blur two
// letters together.
const LAYOUT = 'QWERTYUIOPASDFGHJKLZXCVBNM';
const BODY_JITTER = 0.015;
const VOICES = {};
LAYOUT.split('').forEach((letter, i) => {
  const t = i / (LAYOUT.length - 1); // 0 → 1 across the board
  VOICES[letter] = {
    click: 2200 + t * 2000, // 2.2 kHz → 4.2 kHz leaf click
    knock: 780 + t * 620, // 780 Hz → 1.4 kHz body of the press
    tone: 240 * 2 ** (i / 15), // 240 Hz → ~760 Hz case resonance
    toneDecay: 0.11 - t * 0.03,
    tick: 5200 + t * 2400,
  };
});
const DEFAULT_VOICE = { click: 3200, knock: 1050, tone: 420, toneDecay: 0.09, tick: 6200 };

const jitter = (value, amount) => value * (1 + (Math.random() * 2 - 1) * amount);

function noiseBurst(ctx, destination, { at, frequency, q, gain, decay }) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  source.playbackRate.value = jitter(1, 0.06);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.0015);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  source.connect(filter);
  filter.connect(env);
  env.connect(destination);
  source.start(at);
  source.stop(at + decay + 0.02);
}

function bodyTone(ctx, destination, { at, frequency, gain, decay }) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, at);
  // A quick downward slide is what gives the "thock" its weight.
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, at + decay);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = frequency * 5;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  osc.connect(lowpass);
  lowpass.connect(env);
  env.connect(destination);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

function press(ctx, letter, level, offset = 0) {
  const voice = VOICES[letter.toUpperCase()] || DEFAULT_VOICE;
  const at = startTime(ctx) + offset;

  const master = ctx.createGain();
  master.gain.value = level * (0.92 + Math.random() * 0.16);
  master.connect(ctx.destination);

  // 1. leaf click
  noiseBurst(ctx, master, {
    at,
    frequency: jitter(voice.click, 0.05),
    q: 1.1,
    gain: 0.5,
    decay: 0.045,
  });
  // 2. mid-band knock — the part a phone speaker can actually reproduce
  noiseBurst(ctx, master, {
    at,
    frequency: jitter(voice.knock, 0.04),
    q: 0.9,
    gain: 0.6,
    decay: 0.07,
  });
  // 3. case resonance
  bodyTone(ctx, master, {
    at,
    frequency: jitter(voice.tone, BODY_JITTER),
    gain: 0.5,
    decay: jitter(voice.toneDecay, 0.1),
  });
  // 4. bottom-out tick, a hair later
  noiseBurst(ctx, master, {
    at: at + 0.007,
    frequency: jitter(voice.tick, 0.08),
    q: 2.2,
    gain: 0.18,
    decay: 0.014,
  });
}

// Key down: the full press, distinct per letter.
export function playKeySound(letter = '') {
  withContext((ctx) => press(ctx, letter, 0.9));
}

// Key up: quieter, brighter and shorter than the press.
export function playKeyUpSound(letter = '') {
  withContext((ctx) => {
    const voice = VOICES[letter.toUpperCase()] || DEFAULT_VOICE;
    const at = startTime(ctx);

    const master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);

    noiseBurst(ctx, master, {
      at,
      frequency: jitter(voice.click * 1.2, 0.06),
      q: 1.8,
      gain: 0.35,
      decay: 0.02,
    });
  });
}

// Used by the sound toggle in Settings so the effect can be heard on demand.
// The notes are spaced on the audio clock rather than with setTimeout, so they
// all get scheduled inside the same user gesture.
export function playTestSound() {
  withContext((ctx) => {
    'KEYS'.split('').forEach((letter, i) => press(ctx, letter, 0.9, i * 0.13));
  });
}

function playBuffer(buffer, rate = 1.0, volume = 0.6) {
  if (!buffer) return;
  withContext((ctx) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  });
}

export function playErrorSound() {
  playBuffer(errorBuffer, 1.0, 0.5);
}

export function playSuccessSound() {
  playBuffer(bellBuffer, 1.0, 0.4);
}
