#!/usr/bin/env node
/**
 * Builds public/keys/<pack>.mp3 — one real mechanical-switch recording per key,
 * for each switch the app offers — and writes src/data/switches.js to match.
 *
 * Source: the sound packs bundled inside Mechvibes,
 * https://github.com/hainguyents13/mechvibes (MIT). Each pack there is a ~2 MB
 * sprite covering a whole keyboard; this keeps the 26 letters plus Backspace and
 * re-encodes them as one small mono MP3 per switch.
 *
 * Which packs are usable is not a matter of taste. A pack must have
 * `key_define_type: "single"` — one sprite with [offset, duration] per key — and
 * carry all 27 keys. Packs marked "multi" (nk-cream) ship a separate .wav per key
 * and would need 27 requests; packs like holy-pandas only define a handful of
 * codes. Both are rejected below rather than shipped half-working.
 *
 * There are no Gateron packs in the repository, so Gateron switches cannot be
 * offered from this source.
 *
 * Layout of each output: fixed-width slots in LAYOUT order, each SLOT_MS long
 * with the sample at the start and silence after it, so
 *
 *   slot(key) = LAYOUT.indexOf(key) * SLOT_MS
 *
 * The padding also absorbs the uniform decoder delay MP3 adds at the start of a
 * buffer: the sample simply begins a few ms later inside its own slot.
 *
 * MP3 rather than the original Ogg Vorbis because Safari's support for Vorbis in
 * decodeAudioData is unreliable, and this has to work on iOS.
 *
 * Requires ffmpeg and curl on PATH. Run: npm run build:sounds
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CACHE = process.env.SOUND_CACHE || '/tmp/mv';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/keys');
const DATA_FILE = path.join(ROOT, 'src/data/switches.js');
const BASE = 'https://raw.githubusercontent.com/hainguyents13/mechvibes/master/src/audio';

export const LAYOUT = [...'QWERTYUIOPASDFGHJKLZXCVBNM', 'BACKSPACE'];
export const SLOT_MS = 300;

// Raw key codes used by the packs' configs (classic set-1 scancodes).
const KEY_CODES = {
  Q: 16, W: 17, E: 18, R: 19, T: 20, Y: 21, U: 22, I: 23, O: 24, P: 25,
  A: 30, S: 31, D: 32, F: 33, G: 34, H: 35, J: 36, K: 37, L: 38,
  Z: 44, X: 45, C: 46, V: 47, B: 48, N: 49, M: 50,
  BACKSPACE: 14,
};

// The switches on offer. `feel` is the switch's own characteristic, not a guess:
// MX Red and Black are linear, Brown is tactile, Blue is clicky.
const SWITCHES = [
  { id: 'cherrymx-blue', pack: 'cherrymx-blue-abs', name: 'Cherry MX Blue', feel: 'clicky' },
  { id: 'cherrymx-brown', pack: 'cherrymx-brown-abs', name: 'Cherry MX Brown', feel: 'tactile' },
  { id: 'cherrymx-red', pack: 'cherrymx-red-abs', name: 'Cherry MX Red', feel: 'linear' },
  { id: 'cherrymx-black', pack: 'cherrymx-black-abs', name: 'Cherry MX Black', feel: 'linear' },
];

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

function download(file, url) {
  const dest = path.join(CACHE, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  fs.mkdirSync(CACHE, { recursive: true });
  process.stderr.write(`downloading ${file}...\n`);
  run('curl', ['-sL', '--max-time', '300', '-o', dest, url]);
  return dest;
}

function buildPack({ id, pack }) {
  const configPath = download(`${pack}-config.json`, `${BASE}/${pack}/config.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (config.key_define_type !== 'single') {
    throw new Error(`${pack}: key_define_type is "${config.key_define_type}", not "single"`);
  }
  const missing = LAYOUT.filter((key) => !config.defines[String(KEY_CODES[key])]);
  if (missing.length > 0) {
    throw new Error(`${pack}: no sample for ${missing.join(', ')}`);
  }

  const spritePath = download(`${pack}.ogg`, `${BASE}/${pack}/sound.ogg`);
  const work = fs.mkdtempSync('/tmp/keysnd-');
  const slots = [];

  for (const key of LAYOUT) {
    const [startMs, durationMs] = config.defines[String(KEY_CODES[key])];
    const slot = path.join(work, `${key}.wav`);
    // Trim to the sample, then pad the slot out with silence so every slot is
    // the same width. `apad` needs the total length, not the amount of padding.
    run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', String(startMs / 1000),
      '-t', String(durationMs / 1000),
      '-i', spritePath,
      '-ac', '1', '-ar', '32000',
      '-af', `apad=whole_dur=${SLOT_MS / 1000}`,
      slot,
    ]);
    slots.push(slot);
  }

  const listFile = path.join(work, 'list.txt');
  fs.writeFileSync(listFile, slots.map((s) => `file '${s}'`).join('\n'));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${id}.mp3`);
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-ac', '1', '-ar', '32000', '-b:a', '64k',
    out,
  ]);

  fs.rmSync(work, { recursive: true, force: true });
  return fs.statSync(out).size;
}

const built = [];
for (const entry of SWITCHES) {
  const size = buildPack(entry);
  built.push({ ...entry, size });
  process.stderr.write(`  ${entry.id.padEnd(16)} ${Math.round(size / 1024)} kB\n`);
}

fs.writeFileSync(
  DATA_FILE,
  `// AUTO-GENERATED by scripts/build-key-sounds.mjs — do not edit by hand.
// Run \`npm run build:sounds\` to regenerate.
//
// Every entry has a matching sprite at public/keys/<id>.mp3: ${LAYOUT.length}
// fixed slots of ${SLOT_MS}ms, in the order given by SWITCH_LAYOUT.
//
// Samples come from the packs bundled with Mechvibes (MIT).
// https://github.com/hainguyents13/mechvibes
//
// Gateron switches are not here because that repository has no Gateron packs;
// nothing else in it ships per-key samples in the format this needs.

export const SWITCH_LAYOUT = ${JSON.stringify(LAYOUT)};
export const SWITCH_SLOT_MS = ${SLOT_MS};

// 'linear' | 'tactile' | 'clicky' — the switch's own characteristic.
export const SWITCHES = [
${built
  .map(
    (s) =>
      `  { id: '${s.id}', name: '${s.name}', feel: '${s.feel}', file: './keys/${s.id}.mp3' },`
  )
  .join('\n')}
];

export const DEFAULT_SWITCH = '${built[0].id}';

export const FEELS = ['linear', 'tactile', 'clicky'];

export function getSwitch(id) {
  return SWITCHES.find((entry) => entry.id === id) || SWITCHES[0];
}
`
);

process.stderr.write(`wrote ${DATA_FILE} with ${built.length} switches\n`);
