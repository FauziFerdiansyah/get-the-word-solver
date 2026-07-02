// Typewriter sound using user-provided type.wav file.
// Uses Web Audio API AudioBuffer for zero-latency playback with per-letter variation.

const KEY_SOUND = './type.wav';
const ERROR_SOUND = './error.wav';
const BELL_SOUND = './bell.wav';

let audioCtx = null;
let keyBuffer = null;
let errorBuffer = null;
let bellBuffer = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

async function loadBuffer(url) {
  const ctx = getCtx();
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  return ctx.decodeAudioData(arrayBuf);
}

// Pre-load all sounds on first user interaction
let loaded = false;
export async function warmUp() {
  if (loaded) return;
  loaded = true;
  try {
    const [k, e, b] = await Promise.all([
      loadBuffer(KEY_SOUND),
      loadBuffer(ERROR_SOUND),
      loadBuffer(BELL_SOUND),
    ]);
    keyBuffer = k;
    errorBuffer = e;
    bellBuffer = b;
  } catch {
    // Silently fail — sounds just won't play
  }
}

// Per-letter pitch mapping: each letter gets a distinct playback rate
// Simulates different key positions on a typewriter
const LETTER_RATE = {};
'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').forEach((ch, i) => {
  // Spread from 0.88 to 1.12 — noticeable difference between letters
  LETTER_RATE[ch] = 0.88 + (i / 25) * 0.24;
});

function playBuffer(buffer, rate = 1.0, volume = 0.6) {
  if (!buffer) return;
  const ctx = getCtx();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

// Play typing sound — each letter sounds distinctly different
export function playKeySound(letter = '') {
  const ch = letter.toUpperCase();
  const baseRate = LETTER_RATE[ch] || 1.0;
  // Add tiny random jitter so repeated same letter isn't identical
  const rate = baseRate + (Math.random() * 0.03 - 0.015);
  const volume = 0.45 + Math.random() * 0.15;
  playBuffer(keyBuffer, rate, volume);
}

// Error sound
export function playErrorSound() {
  playBuffer(errorBuffer, 1.0, 0.5);
}

// Success bell
export function playSuccessSound() {
  playBuffer(bellBuffer, 1.0, 0.4);
}
