#!/usr/bin/env node
/**
 * Builds public/keys.mp3 — one real mechanical-switch recording per letter.
 *
 * Source: the Cherry MX Blue (ABS keycaps) pack bundled inside Mechvibes,
 * https://github.com/hainguyents13/mechvibes (MIT). Its `sound.ogg` is a 2 MB
 * sprite covering a whole keyboard; that is far too heavy for a static web app,
 * so this script keeps only the 26 letter samples and re-encodes them as one
 * small mono MP3.
 *
 * Layout of the output: 26 fixed-width slots, one per letter of the QWERTY rows,
 * each SLOT_MS long with the sample at the start and silence after it.
 *
 *   slot(letter) = LAYOUT.indexOf(letter) * SLOT_MS
 *
 * Fixed slots mean the player needs no per-letter table, and the generous
 * padding absorbs the uniform decoder delay MP3 adds at the start of a buffer:
 * the sample simply begins a few ms later inside its own slot.
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
const PACK = 'cherrymx-blue-abs';
const BASE = `https://raw.githubusercontent.com/hainguyents13/mechvibes/master/src/audio/${PACK}`;
const OUT = path.resolve(import.meta.dirname, '../public/keys.mp3');

// Keys are listed in QWERTY row order, which is also the order the app's
// keyboard renders them in.
export const LAYOUT = 'QWERTYUIOPASDFGHJKLZXCVBNM';
export const SLOT_MS = 300;

// Raw key codes used by the pack's config (classic set-1 scancodes).
const KEY_CODES = {
  Q: 16, W: 17, E: 18, R: 19, T: 20, Y: 21, U: 22, I: 23, O: 24, P: 25,
  A: 30, S: 31, D: 32, F: 33, G: 34, H: 35, J: 36, K: 37, L: 38,
  Z: 44, X: 45, C: 46, V: 47, B: 48, N: 49, M: 50,
};

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

function download(file, url) {
  const dest = path.join(CACHE, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  fs.mkdirSync(CACHE, { recursive: true });
  process.stderr.write(`downloading ${file}...\n`);
  run('curl', ['-sL', '--max-time', '300', '-o', dest, url]);
  return dest;
}

const configPath = download(`${PACK}-config.json`, `${BASE}/config.json`);
const spritePath = download(`${PACK}.ogg`, `${BASE}/sound.ogg`);
const defines = JSON.parse(fs.readFileSync(configPath, 'utf8')).defines;

const work = fs.mkdtempSync('/tmp/keysnd-');
const slots = [];

for (const letter of LAYOUT) {
  const define = defines[String(KEY_CODES[letter])];
  if (!define) throw new Error(`${letter}: no sample in ${PACK}`);
  const [startMs, durationMs] = define;
  const slot = path.join(work, `${letter}.wav`);

  // Trim to the sample, then pad the slot out with silence so every slot is the
  // same width. `apad` needs the total length, not the amount of padding.
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

run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'concat', '-safe', '0', '-i', listFile,
  '-ac', '1', '-ar', '32000', '-b:a', '64k',
  OUT,
]);

fs.rmSync(work, { recursive: true, force: true });

const size = fs.statSync(OUT).size;
process.stderr.write(
  `wrote ${OUT} — ${LAYOUT.length} slots × ${SLOT_MS}ms, ${Math.round(size / 1024)} kB\n`
);
