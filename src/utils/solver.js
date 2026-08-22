// Core word-solving filter logic.
//
// Single-row mode ("1 Baris") describes everything you know about the answer on
// one row:
// - `letters[i]`  → the letter that sits exactly at position i (green)
// - `excluded[i]` → letters that ARE in the word but NOT at position i (yellow)
//
// `excluded` holds a string per position, so one box can hold several different
// letters (guessing R at position 2 one turn and L the next rules out both), and
// the same letter can appear under several boxes (A under box 2 and box 3 means
// "the word contains A, just not in those two spots" — one A, not two).
//
// Asking for two copies of a letter is deliberately not expressible here: use
// the 6-row board, where a guess showing the same letter twice says it exactly.
// The one exception is a letter that is green somewhere and yellow elsewhere,
// which does mean two copies.
//
// `disabledLetters` is a Set of uppercase letters known to be absent from the
// target word anywhere (marked via the virtual keyboard).
//
// Results are returned ranked: the most likely answer first. The ranking comes
// from src/data/words.js, where each list is pre-sorted by how commonly the
// word is used and how often it shows up as a puzzle answer.

import { getWordRank } from '../data/words';

export function rankWords(words) {
  return [...words].sort((a, b) => getWordRank(a) - getWordRank(b));
}

const countOf = (word, letter) => {
  let n = 0;
  for (let i = 0; i < word.length; i += 1) if (word[i] === letter) n += 1;
  return n;
};

export function findMatches(words, letters, excluded = [], disabledLetters = new Set()) {
  // How many copies of each letter the answer must hold: the greens, plus one
  // more for a letter that also shows up as a yellow. Listing the same yellow
  // letter under several boxes still means one copy.
  const greens = new Map();
  for (const letter of letters) {
    if (letter) greens.set(letter, (greens.get(letter) || 0) + 1);
  }

  const yellows = new Set();
  for (const box of excluded) {
    for (const letter of box || '') yellows.add(letter);
  }

  const minLetterCount = new Map(greens);
  for (const letter of yellows) {
    minLetterCount.set(letter, (greens.get(letter) || 0) + 1);
  }

  const matches = words.filter((word) => {
    // 1. Disabled letters must not appear anywhere in the word.
    for (let i = 0; i < word.length; i += 1) {
      if (disabledLetters.has(word[i])) return false;
    }

    // 2. Every required letter appears often enough.
    for (const [letter, min] of minLetterCount) {
      if (countOf(word, letter) < min) return false;
    }

    // 3. Green letters sit exactly where they were placed.
    for (let i = 0; i < letters.length; i += 1) {
      if (letters[i] && word[i] !== letters[i]) return false;
    }

    // 4. Yellow letters are anywhere but the positions they were ruled out of.
    for (let i = 0; i < excluded.length; i += 1) {
      const box = excluded[i];
      if (!box) continue;
      for (const letter of box) {
        if (word[i] === letter) return false;
      }
    }

    return true;
  });

  return rankWords(matches);
}

// ---------------------------------------------------------------------------
// Board mode: the full 6-row game board.
//
// `rows` is an array of { letters: string[], states: string[] } where each
// state is 'green' (right letter, right spot), 'yellow' (right letter, wrong
// spot) or 'gray' (letter not in the word). Empty letters are ignored, so
// partially typed rows still work.
//
// Duplicate letters follow the real game's rules. Within one row the number of
// green + yellow tiles for a letter is the minimum count the answer must have,
// and a gray tile for that same letter turns that minimum into an exact count:
// guessing OTTER against TOAST shows one T as present and the other as absent,
// which means the answer holds exactly one T.
// ---------------------------------------------------------------------------

function rowConstraints(row) {
  const positions = [];
  const minCount = new Map();
  const capped = new Set();

  for (let i = 0; i < row.letters.length; i += 1) {
    const letter = row.letters[i];
    if (!letter) continue;
    const state = row.states[i] || 'gray';
    positions.push({ index: i, letter, state });
    if (state === 'green' || state === 'yellow') {
      minCount.set(letter, (minCount.get(letter) || 0) + 1);
    } else {
      capped.add(letter);
    }
  }

  return { positions, minCount, capped };
}

export function findMatchesFromBoard(words, rows, disabledLetters = new Set()) {
  const constraints = rows.map(rowConstraints).filter((c) => c.positions.length > 0);

  const matches = words.filter((word) => {
    for (let i = 0; i < word.length; i += 1) {
      if (disabledLetters.has(word[i])) return false;
    }

    for (const { positions, minCount, capped } of constraints) {
      for (const { index, letter, state } of positions) {
        if (state === 'green') {
          if (word[index] !== letter) return false;
        } else if (word[index] === letter) {
          return false; // yellow and gray both rule out this position
        }
      }
      for (const [letter, min] of minCount) {
        if (countOf(word, letter) < min) return false;
      }
      for (const letter of capped) {
        if (countOf(word, letter) !== (minCount.get(letter) || 0)) return false;
      }
    }

    return true;
  });

  return rankWords(matches);
}
