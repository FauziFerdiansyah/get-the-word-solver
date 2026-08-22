// Keyboard sound engine.
//
// Key presses play a real Cherry MX Blue recording — one sample per letter, from
// the pack bundled with Mechvibes (MIT, see scripts/build-key-sounds.mjs). The
// 26 samples live in a single MP3 sprite of fixed 300 ms slots, so the slot for a
// letter is just its index in `SPRITE_LAYOUT`.
//
// The synthesised voices below are the fallback for before the sprite has loaded
// (the first press of a session) and for when it cannot be fetched at all. They
// are built from a leaf click, a mid-band knock, a case resonance and a
// bottom-out tick, with frequencies kept above ~240 Hz because phone speakers
// roll off hard below that.

const KEY_SPRITE = './keys.mp3';
// Letters in QWERTY order, then Backspace — must match build-key-sounds.mjs.
const SPRITE_LAYOUT = [...'QWERTYUIOPASDFGHJKLZXCVBNM', 'BACKSPACE'];
const SPRITE_SLOT = 0.3; // seconds per letter, must match build-key-sounds.mjs
const ERROR_SOUND = './error.wav';
const BELL_SOUND = './bell.wav';

let audioCtx = null;
let noiseBuffer = null;
let keySprite = null;
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
  // The sprite is fetched on the first gesture rather than at page load, so a
  // muted visitor never pays for it. That means the very first press of a
  // session falls back to the synth; every press after it is the real sample.
  loadBuffer(ctx, KEY_SPRITE)
    .then((buffer) => { keySprite = buffer; })
    .catch(() => { keySprite = null; });
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

// Plays one key's slot out of the sprite.
function sample(ctx, key, level, offset = 0) {
  const index = SPRITE_LAYOUT.indexOf(key.toUpperCase());
  const source = ctx.createBufferSource();
  source.buffer = keySprite;
  // A touch of pitch variation so holding a key down is not a machine gun.
  source.playbackRate.value = jitter(1, 0.03);

  const gain = ctx.createGain();
  gain.gain.value = level;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime(ctx) + offset, Math.max(index, 0) * SPRITE_SLOT, SPRITE_SLOT);
}

// Key down: a real switch recording once the sprite is in, the synth until then.
export function playKeySound(letter = '') {
  withContext((ctx) => {
    if (keySprite) sample(ctx, letter, 0.85);
    else press(ctx, letter, 0.9);
  });
}

// Deleting a letter is a keypress too — it plays the pack's own Backspace
// recording, and a lower, shorter synth click when the sprite is not in yet.
export function playDeleteSound() {
  withContext((ctx) => {
    if (keySprite) sample(ctx, 'BACKSPACE', 0.8);
    else press(ctx, 'Z', 0.75);
  });
}

// Key up. The recorded samples already contain the whole travel of the switch,
// including its release, so there is nothing to add on top of them — this only
// fires for the synthesised fallback.
export function playKeyUpSound(letter = '') {
  if (keySprite) return;
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
    'KEYS'.split('').forEach((letter, i) => {
      if (keySprite) sample(ctx, letter, 0.85, i * 0.16);
      else press(ctx, letter, 0.9, i * 0.13);
    });
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
