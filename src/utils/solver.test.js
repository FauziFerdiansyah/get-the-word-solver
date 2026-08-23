import { describe, it, expect } from 'vitest';
import { WORD_LISTS, getRankedWords, getWordRank, getUniqueWords, getTopWords } from '../data/words';
import { findMatches, findMatchesFromBoard } from './solver';

const LENGTHS = [4, 5, 6];

describe('word lists', () => {
  it('only contains uppercase A-Z words of the right length', () => {
    for (const length of LENGTHS) {
      for (const word of getRankedWords(length)) {
        expect(word).toMatch(/^[A-Z]+$/);
        expect(word).toHaveLength(length);
      }
    }
  });

  it('has no duplicates', () => {
    for (const length of LENGTHS) {
      const words = getRankedWords(length);
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it('drops words the game rejects', () => {
    const rejected = [
      'USED', 'TEEN', 'FRIV', // reported by users as unusable
      'CATS', 'IDEAS', 'PANTS', 'FEET', 'MICE', // plurals
      'WALKED', 'JUMPED', // regular past tense
      'RUNNING', 'TALKING', // gerunds
      'LARGER', 'LARGEST', 'FINEST', // comparatives / superlatives
      'PARIS', 'TEXAS', 'CHRIST', // proper nouns
      'COLOUR', 'HONOUR', // British-only spellings
      'XXIV', // roman numerals
    ];
    for (const word of rejected) {
      expect(getWordRank(word), `${word} should not be in the list`).toBe(Infinity);
    }
  });

  it('keeps everyday words and lexicalised irregular forms', () => {
    const kept = [
      'IDEA', 'OPEN', 'OVER', 'WATER', 'TABLE', 'HOUSE', 'MONEY', 'FRIEND', 'SCHOOL',
      'CAME', 'DREW', 'KNEW', 'GREW', 'TOOK', 'GAVE', 'WROTE', 'BOUGHT', 'BECAME',
      'FOREST', 'HONEST', 'MODEST', 'EARLY', 'SILVER', 'ORANGE', 'PURPLE',
      'NEWS', 'GLASS', 'FOCUS', 'ACRE', 'TOUR',
    ];
    for (const word of kept) {
      expect(getWordRank(word), `${word} should be in the list`).not.toBe(Infinity);
    }
  });

  it('exposes a top slice made of the best ranked words only', () => {
    for (const length of LENGTHS) {
      const top = getTopWords(length, 300);
      expect(top).toHaveLength(300);
      expect(top).toEqual(getRankedWords(length).slice(0, 300));
      // Everything in the top slice belongs to the common tier.
      const common = new Set(WORD_LISTS[length].common);
      for (const word of top) expect(common.has(word)).toBe(true);
    }
  });

  it('ranks common words ahead of rare ones', () => {
    for (const length of LENGTHS) {
      const { common, rare } = WORD_LISTS[length];
      expect(getWordRank(common[0])).toBe(1);
      expect(getWordRank(rare[0])).toBe(common.length + 1);
    }
  });
});

describe('findMatches', () => {
  const words5 = getUniqueWords(5, 'all');
  const none = ['', '', '', '', ''];

  it('returns an exact match when every letter is green', () => {
    expect(findMatches(words5, ['C', 'R', 'A', 'N', 'E'], none, new Set())).toEqual(['CRANE']);
  });

  it('honours green positions and disabled letters', () => {
    const matches = findMatches(words5, ['', 'R', '', '', ''], none, new Set(['A', 'E']));
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word[1]).toBe('R');
      expect(word).not.toMatch(/[AE]/);
    }
  });

  it('excludes the flagged position for a yellow letter but requires the letter', () => {
    const matches = findMatches(words5, none, ['A', '', '', '', ''], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word[0]).not.toBe('A');
      expect(word).toContain('A');
    }
  });

  it('accepts the same yellow letter at several positions without asking for copies', () => {
    // A is in the word but neither at box 2 nor box 3.
    const matches = findMatches(words5, none, ['', 'A', 'A', '', ''], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word).toContain('A');
      expect(word[1]).not.toBe('A');
      expect(word[2]).not.toBe('A');
    }
    // Words holding a single A must survive — this is the case a one-letter-per-box
    // grid used to get wrong by demanding two A's.
    expect(matches.some((w) => w.split('').filter((c) => c === 'A').length === 1)).toBe(true);
    expect(matches).toContain('ABOUT');
  });

  it('treats a repeated letter in one box as a single copy', () => {
    // "AA" used to secretly mean "two A's"; it now just means A is ruled out of
    // that position, exactly like typing it once.
    const once = findMatches(words5, none, ['', 'A', '', '', ''], new Set());
    const twice = findMatches(words5, none, ['', 'AA', '', '', ''], new Set());
    expect(twice).toEqual(once);
    expect(twice.some((w) => w.split('').filter((c) => c === 'A').length === 1)).toBe(true);
  });

  it('rules out every letter listed in one box', () => {
    // Guessing R at position 2 one turn and L the next rules out both there.
    const matches = findMatches(words5, none, ['', 'RL', '', '', ''], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word).toContain('R');
      expect(word).toContain('L');
      expect(word[1]).not.toBe('R');
      expect(word[1]).not.toBe('L');
    }
  });

  it('reads a green and a yellow of one letter as the same letter', () => {
    // Finding T at position 5 and having learned T is not at position 3 are two
    // facts about one T. Demanding two copies used to delete every real answer.
    const matches = findMatches(
      words5,
      ['', '', '', '', 'T'],
      ['AR', 'RA', 'TE', 'AE', ''],
      new Set()
    );
    expect(matches).toContain('HEART');
    for (const word of matches) {
      expect(word[4]).toBe('T');
      expect(word).toContain('A');
      expect(word).toContain('R');
      expect(word).toContain('E');
    }
  });

  it('still counts two greens of the same letter as two', () => {
    const matches = findMatches(words5, ['', 'O', 'O', '', ''], [], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word.split('').filter((c) => c === 'O').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns results ordered best-first', () => {
    const matches = findMatches(words5, none, none, new Set());
    const ranks = matches.map(getWordRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe('findMatchesFromBoard', () => {
  const words5 = getUniqueWords(5, 'all');
  const expand = (word, code) => ({
    letters: word.split(''),
    // code uses one char per tile: g = green, y = yellow, x = gray
    states: code.split('').map((c) => (c === 'g' ? 'green' : c === 'y' ? 'yellow' : 'gray')),
  });
  const blank = (n) => ({ letters: Array(n).fill(''), states: Array(n).fill('gray') });

  it('ignores empty rows', () => {
    const all = findMatchesFromBoard(words5, [blank(5), blank(5)], new Set());
    expect(all).toEqual(findMatches(words5, ['', '', '', '', ''], [], new Set()));
  });

  it('applies green, yellow and gray tiles from a single row', () => {
    // Guess CRANE: C is in the right spot, A is in the word but elsewhere,
    // R / N / E are not in the word at all.
    const matches = findMatchesFromBoard(words5, [expand('CRANE', 'gxyxx')], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word[0]).toBe('C');
      expect(word).not.toMatch(/[RNE]/);
      expect(word).toContain('A');
      expect(word[2]).not.toBe('A');
    }
    expect(matches).toContain('CATCH');
  });

  it('combines constraints across several rows', () => {
    const matches = findMatchesFromBoard(
      words5,
      [expand('CRANE', 'xxxxx'), expand('MOIST', 'xgxgg')],
      new Set()
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word).not.toMatch(/[CRANEMI]/);
      expect(word[1]).toBe('O');
      expect(word[3]).toBe('S');
      expect(word[4]).toBe('T');
    }
    expect(matches).toContain('BOOST');
  });

  it('treats a gray duplicate as an exact letter count', () => {
    // Guessing OTTER where the first T is present and the second is absent
    // means the answer contains exactly one T.
    const matches = findMatchesFromBoard(words5, [expand('OTTER', 'yyxxx')], new Set());
    expect(matches.length).toBeGreaterThan(0);
    for (const word of matches) {
      expect(word.split('').filter((c) => c === 'T')).toHaveLength(1);
      expect(word).toContain('O');
      expect(word).not.toMatch(/[ER]/);
    }
    expect(matches).toContain('TOADY');
  });

  it('still honours letters crossed out on the keyboard', () => {
    const matches = findMatchesFromBoard(words5, [expand('CRANE', 'gxxxx')], new Set(['S']));
    for (const word of matches) expect(word).not.toContain('S');
  });

  it('returns board results ranked best-first', () => {
    const matches = findMatchesFromBoard(words5, [expand('CRANE', 'gxxxx')], new Set());
    const ranks = matches.map(getWordRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
