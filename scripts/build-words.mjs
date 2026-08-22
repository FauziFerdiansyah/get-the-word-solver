#!/usr/bin/env node
/**
 * Regenerates src/data/words.js
 *
 * Goal: only keep words that a Wordle-style game ("Get the Word", Wordle, Lingo)
 * would actually accept as an ANSWER, and rank every word by how likely it is
 * to be that answer.
 *
 * Sources (downloaded into CACHE dir on first run):
 *  - words_alpha.txt ............ broad English dictionary (validity gate)
 *  - WordNet 3.x ................ lemma + part-of-speech + proper-noun detection
 *  - en_50k.txt ................. OpenSubtitles frequency (spoken familiarity)
 *  - enwiki word frequency ...... Wikipedia frequency (written familiarity)
 *  - google-10000-english ....... top-10k common web words
 *  - shuffled_real_wordles.txt .. 2,315 official Wordle answers (curated
 *                                 "typical puzzle answer" prior, 5 letters)
 *
 * Removal rules (a word is DROPPED when):
 *  1. not in words_alpha, or contains non A-Z characters
 *  2. not a WordNet lemma (kills SOWPODS junk such as FRIV, ZORI, OBIA).
 *     Irregular verb forms (CAME, WROTE, BUILT) are allowed back in because
 *     curated answer lists do use them.
 *  3. proper noun / abbreviation (PARIS, BERLIN, CHRIST, NASA)
 *  4. regular inflection: plural or 3rd person -S, past -ED, gerund -ING,
 *     comparative -ER, superlative -EST, adverb -LY
 *     (USED -> USE, CATS -> CAT, RUNNING -> RUN, LARGER -> LARGE, REALLY -> REAL)
 *  5. too rare in both corpora (obscure dictionary-only words)
 *  6. profanity / slurs, and informal clippings the games reject (TEEN)
 *  7. British-only spelling when the US spelling is the dominant form
 *     (COLOUR -> COLOR, FIBRE -> FIBER)
 *
 * The 2,315 official Wordle answers bypass every rule: they are ground truth
 * for "this is an acceptable puzzle answer" (it is why BEING, PHOTO, EMAIL and
 * THERE stay in, even though generic heuristics would drop them).
 *
 * Ranking: blended Zipf frequency (OpenSubtitles + Wikipedia) + google-10k
 * bonus + a strong bonus for official Wordle answers, minus a penalty for
 * words whose corpus frequency is inflated by their use as a personal name
 * (JOHN, MARC). Output arrays are sorted best-first, so rank === index + 1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const CACHE = process.env.WORD_CACHE || '/tmp/wl';
const OUT = path.resolve(import.meta.dirname, '../src/data/words.js');
const LENGTHS = [4, 5, 6];

const SOURCES = [
  ['words_alpha.txt', 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'],
  ['en_50k.txt', 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt'],
  ['wiki_freq.txt', 'https://raw.githubusercontent.com/IlyaSemenov/wikipedia-word-frequency/master/results/enwiki-2023-04-13.txt'],
  ['g10k.txt', 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt'],
  ['wordle_answers.txt', 'https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/shuffled_real_wordles.txt'],
  ['wordnet.zip', 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip'],
  ['profanity.txt', 'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en'],
  ['firstnames.txt', 'https://raw.githubusercontent.com/dominictarr/random-name/master/first-names.txt'],
];

// Clippings, contractions and slang that pass a dictionary check but are not
// used as answers by these games. Kept deliberately small: PHOTO, VIDEO, EMAIL,
// AUDIO, METRO and LATTE all turned out to be official Wordle answers, so the
// "it looks like a modern clipping" instinct is not reliable.
const BLACKLIST = new Set([
  'teen', 'aint', 'gonna', 'gotta', 'wanna', 'dunno', 'kinda', 'sorta',
  'yall', 'hiya', 'lotsa', 'howdy', 'yeps', 'nope', 'yeah', 'yup',
  'christ', 'jesus', 'allah', 'yahweh', 'satan',
]);

function download() {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const [file, url] of SOURCES) {
    const dest = path.join(CACHE, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) continue;
    process.stderr.write(`downloading ${file}...\n`);
    execSync(`curl -sL --max-time 300 -o ${JSON.stringify(dest)} ${JSON.stringify(url)}`);
  }
  const wnDir = path.join(CACHE, 'wordnet');
  if (!fs.existsSync(path.join(wnDir, 'index.noun'))) {
    execSync(`unzip -oq ${JSON.stringify(path.join(CACHE, 'wordnet.zip'))} -d ${JSON.stringify(CACHE)}`);
  }
}

const readLines = (file) =>
  fs.readFileSync(path.join(CACHE, file), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

// ---------------------------------------------------------------- WordNet ---

function loadWordNet() {
  const wn = (f) => readLines(path.join('wordnet', f));

  const lemmaSet = (file) => {
    const set = new Set();
    for (const line of wn(file)) {
      if (line.startsWith('  ')) continue;
      const lemma = line.split(' ')[0];
      if (!lemma || lemma.includes('_') || !/^[a-z]+$/.test(lemma)) continue;
      set.add(lemma);
    }
    return set;
  };

  const noun = lemmaSet('index.noun');
  const verb = lemmaSet('index.verb');
  const adj = lemmaSet('index.adj');
  const adv = lemmaSet('index.adv');

  // Proper nouns / abbreviations: WordNet preserves capitalisation in its data
  // files, so a lemma that is never observed in lowercase is a proper noun
  // (PARIS, NASA) while "china" the material survives via its lowercase sense.
  //
  // `capitalised` is kept as a separate, weaker signal: BERLIN and PETER do
  // have obscure lowercase senses (a carriage, to peter out) but their corpus
  // frequency comes almost entirely from the proper noun, so they get a
  // ranking penalty instead of being deleted.
  const seenLower = new Set();
  const seenUpper = new Set();
  for (const f of ['data.noun', 'data.verb', 'data.adj', 'data.adv']) {
    for (const line of wn(f)) {
      if (line.startsWith('  ')) continue;
      const head = line.split(' | ')[0];
      const parts = head.split(' ');
      const wCount = parseInt(parts[3], 16);
      if (Number.isNaN(wCount)) continue;
      for (let i = 0; i < wCount; i += 1) {
        const form = parts[4 + i * 2];
        if (!form || !/^[A-Za-z]+$/.test(form)) continue;
        (/^[A-Z]/.test(form) ? seenUpper : seenLower).add(form.toLowerCase());
      }
    }
  }
  const isProperNoun = (w) => !seenLower.has(w);

  // Irregular inflections. Noun ones (MICE, FEET) stay banned because these
  // games do not use plurals; irregular verb forms (CAME, DREW, WROTE, BUILT)
  // are re-allowed since curated answer lists contain them.
  const irregularNoun = new Set();
  const irregularVerb = new Set();
  for (const [f, target] of [['noun.exc', irregularNoun], ['verb.exc', irregularVerb]]) {
    for (const line of wn(f)) {
      const [inflected, base] = line.split(' ');
      if (inflected && base && inflected !== base) target.add(inflected);
    }
  }
  // Only lexicalised irregulars — not regular forms that happen to be listed.
  const irregularVerbForms = new Set(
    [...irregularVerb].filter((w) => !/(ed|ing|s)$/.test(w))
  );

  return {
    noun, verb, adj, adv, isProperNoun, capitalised: seenUpper,
    irregular: new Set([...irregularNoun, ...irregularVerb]),
    irregularVerbForms,
  };
}

// ------------------------------------------------------------- Frequencies ---

function loadFreq(file) {
  const map = new Map();
  let total = 0;
  for (const line of readLines(file)) {
    const [w, c] = line.split(/\s+/);
    if (!w || !/^[a-z]+$/.test(w)) continue;
    const n = Number(c);
    if (!Number.isFinite(n)) continue;
    if (!map.has(w)) map.set(w, n);
    total += n;
  }
  return { map, total };
}

const zipf = (count, total) => (count > 0 ? Math.log10((count / total) * 1e9) : 0);

// ------------------------------------------------------- Inflection filters ---

function makeFilters(wn) {
  const { noun, verb, adj, adv } = wn;
  const isVerb = (w) => w.length >= 2 && verb.has(w);
  const isNoun = (w) => w.length >= 2 && noun.has(w);
  const isAdj = (w) => w.length >= 2 && adj.has(w);
  const deDouble = (stem) =>
    stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] ? stem.slice(0, -1) : null;

  const isPlural = (w) => {
    if (!w.endsWith('s')) return false;
    if (/(ss|us|is|as|os)$/.test(w)) return false; // GLASS, FOCUS, BASIS, ATLAS, ETHOS
    if (wn.irregular.has(w)) return true; // MICE, TEETH, GEESE
    const bases = [w.slice(0, -1)];
    if (w.endsWith('es')) bases.push(w.slice(0, -2));
    if (w.endsWith('ies')) bases.push(`${w.slice(0, -3)}y`);
    if (w.endsWith('ves')) bases.push(`${w.slice(0, -3)}f`, `${w.slice(0, -3)}fe`);
    return bases.some((b) => isNoun(b) || isVerb(b));
  };

  const isPast = (w) => {
    if (!w.endsWith('ed')) return false;
    const bases = [w.slice(0, -2), w.slice(0, -1)];
    const dd = deDouble(w.slice(0, -2));
    if (dd) bases.push(dd);
    if (w.endsWith('ied')) bases.push(`${w.slice(0, -3)}y`);
    return bases.some(isVerb);
  };

  const isGerund = (w) => {
    if (!w.endsWith('ing')) return false;
    const stem = w.slice(0, -3);
    const bases = [stem, `${stem}e`];
    const dd = deDouble(stem);
    if (dd) bases.push(dd);
    if (w.endsWith('ying')) bases.push(`${w.slice(0, -4)}ie`);
    return bases.some(isVerb);
  };

  // A real base word keeps a noun sense in WordNet (WATER, FOREST, SILVER,
  // TEACHER, RUNNER, UPPER); a pure comparative/superlative/adverb does not.
  // Adjective membership cannot be used here because WordNet does list some
  // comparatives (LARGER) as adjective lemmas.
  const lexicalised = (w) => isNoun(w);
  // WordNet never lists true superlatives (LARGEST, FINEST) or -LY adverbs
  // (REALLY) as adjectives, so adjective membership is a safe exemption there
  // and rescues MODEST / HONEST / EARLY.
  const lexicalisedAdj = (w) => isNoun(w) || isAdj(w);

  const isComparative = (w) => {
    if (!w.endsWith('er') || lexicalised(w)) return false;
    const bases = [w.slice(0, -2), w.slice(0, -1)];
    const dd = deDouble(w.slice(0, -2));
    if (dd) bases.push(dd);
    if (w.endsWith('ier')) bases.push(`${w.slice(0, -3)}y`);
    return bases.some(isAdj) || bases.some(isVerb); // LARGER, RUNNER, TEACHER
  };

  const isSuperlative = (w) => {
    if (!w.endsWith('est') || lexicalisedAdj(w)) return false;
    const bases = [w.slice(0, -3), w.slice(0, -2)];
    const dd = deDouble(w.slice(0, -3));
    if (dd) bases.push(dd);
    if (w.endsWith('iest')) bases.push(`${w.slice(0, -4)}y`);
    return bases.some(isAdj);
  };

  // BADLY / NEWLY / HOTLY are listed as adverbs and sit on an adjective base;
  // LONELY and LOVELY are not adverbs at all, and EARLY's base ("ear") is not
  // an adjective, so both survive.
  const isAdverb = (w) => {
    if (!w.endsWith('ly') || isNoun(w) || !adv.has(w)) return false;
    const bases = [w.slice(0, -2)];
    if (w.endsWith('ily')) bases.push(`${w.slice(0, -3)}y`);
    return bases.some(isAdj);
  };

  return { isPlural, isPast, isGerund, isComparative, isSuperlative, isAdverb };
}

// -------------------------------------------------------------------- main ---

download();

const wn = loadWordNet();
const filters = makeFilters(wn);
const subs = loadFreq('en_50k.txt');
const wiki = loadFreq('wiki_freq.txt');
const g10k = new Map(readLines('g10k.txt').map((w, i) => [w, i + 1]));
const answers = new Set(
  readLines('wordle_answers.txt').filter((l) => !l.startsWith('#')).map((w) => w.toLowerCase())
);
const profanity = new Set(readLines('profanity.txt').map((w) => w.toLowerCase()));
const firstNames = new Set(readLines('firstnames.txt').map((w) => w.toLowerCase()));

const dictionary = new Set(
  readLines('words_alpha.txt').filter((w) => w.length >= 4 && w.length <= 6 && /^[a-z]+$/.test(w))
);

const freqOf = (w) => (subs.map.get(w) || 0) / subs.total + (wiki.map.get(w) || 0) / wiki.total;

// British-only spelling when the US form clearly dominates the corpora
// (COLOUR -> COLOR, FIBRE -> FIBER) while TOUR/ACRE are left alone.
const usVariant = (w) => {
  if (w.endsWith('our')) return `${w.slice(0, -3)}or`;
  if (w.endsWith('re')) return `${w.slice(0, -2)}er`;
  if (w.endsWith('ce')) return `${w.slice(0, -2)}se`;
  if (w.endsWith('ise')) return `${w.slice(0, -3)}ize`;
  return null;
};
const isBritishSpelling = (w) => {
  const us = usVariant(w);
  if (!us || !dictionary.has(us)) return false;
  if (!(wn.noun.has(us) || wn.verb.has(us) || wn.adj.has(us) || wn.adv.has(us))) return false;
  return freqOf(us) > freqOf(w) * 2;
};

const MIN_ZIPF = 2.0; // ~ 100 occurrences per billion words
const COMMON_ZIPF = 3.4;
const report = {};

const build = (length) => {
  const rejected = new Map();
  const reject = (w, why) => rejected.set(w, why);

  const accepted = [];
  for (const w of dictionary) {
    if (w.length !== length) continue;

    const isAnswer = answers.has(w);
    const isIrregular = wn.irregularVerbForms.has(w);
    const zSubs = zipf(subs.map.get(w) || 0, subs.total);
    const zWiki = zipf(wiki.map.get(w) || 0, wiki.total);

    // Official curated answers are ground truth and skip every heuristic.
    if (!isAnswer) {
      if (/^[ivxlcdm]+$/.test(w)) { reject(w, 'roman-numeral'); continue; }
      if (profanity.has(w)) { reject(w, 'profanity'); continue; }
      if (BLACKLIST.has(w)) { reject(w, 'blacklist'); continue; }
      // DREW only exists in WordNet as the name "Drew", but it is still the
      // past tense of DRAW, so irregular verb forms skip this gate.
      if (wn.isProperNoun(w) && !isIrregular) { reject(w, 'proper-noun'); continue; }

      const isLemma =
        wn.noun.has(w) || wn.verb.has(w) || wn.adj.has(w) || wn.adv.has(w) || isIrregular;
      if (!isLemma) { reject(w, 'not-a-lemma'); continue; }

      if (filters.isPlural(w)) { reject(w, 'plural/3rd-person'); continue; }
      if (filters.isPast(w) && !isIrregular) { reject(w, 'past-tense'); continue; }
      if (filters.isGerund(w)) { reject(w, 'gerund'); continue; }
      if (filters.isComparative(w)) { reject(w, 'comparative'); continue; }
      if (filters.isSuperlative(w)) { reject(w, 'superlative'); continue; }
      if (filters.isAdverb(w)) { reject(w, 'adverb'); continue; }
      if (isBritishSpelling(w)) { reject(w, 'british-spelling'); continue; }
      if (Math.max(zSubs, zWiki) < MIN_ZIPF) { reject(w, 'too-rare'); continue; }
    }

    // Blend spoken + written familiarity, reward curated answers and top-10k
    // web words, and discount words whose counts are inflated by name usage
    // (JOHN, PETER, BERLIN, JAPAN).
    const freqScore = 0.5 * zSubs + 0.5 * zWiki;
    const g10kBonus = g10k.has(w) ? 1.2 * (1 - g10k.get(w) / 10000) : 0;
    const answerBonus = isAnswer ? 3.5 : 0;
    let namePenalty = 0;
    if (!isAnswer) {
      if (wn.capitalised.has(w)) namePenalty += 1.5;
      if (firstNames.has(w)) namePenalty += 0.8;
    }

    accepted.push({
      word: w.toUpperCase(),
      score: freqScore + g10kBonus + answerBonus - Math.min(namePenalty, 2.0),
      common: isAnswer || g10k.has(w) || Math.max(zSubs, zWiki) >= COMMON_ZIPF,
    });
  }

  accepted.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

  // Keep the tier split aligned with the ranking: everything in the common
  // tier is ranked before the rest.
  const common = accepted.filter((e) => e.common).map((e) => e.word);
  const rare = accepted.filter((e) => !e.common).map((e) => e.word);

  report[length] = { rejected, total: accepted.length, common: common.length, rare: rare.length };
  return { common, rare };
};

const lists = {};
for (const len of LENGTHS) lists[len] = build(len);

// --------------------------------------------------------------- serialise ---

const chunk = (arr, per = 10) => {
  const out = [];
  for (let i = 0; i < arr.length; i += per) out.push(arr.slice(i, i + per));
  return out;
};

const serialise = (name, words) =>
  `const ${name} = [\n${chunk(words)
    .map((row) => `  ${row.map((w) => `"${w}"`).join(',')},`)
    .join('\n')}\n];`;

const header = `// AUTO-GENERATED by scripts/build-words.mjs — do not edit by hand.
// Run \`npm run build:words\` to regenerate.
//
// Every list is sorted BEST FIRST: index 0 is the most likely answer, so a
// word's rank is simply its index + 1 within the concatenated
// [...common, ...rare] list for that length.
//
// Ranking = OpenSubtitles frequency + Wikipedia frequency + google-10k bonus
// + a strong bonus for words from the official curated Wordle answer list.
//
// Words rejected on purpose: proper nouns, abbreviations, non-dictionary junk
// (FRIV), plurals and 3rd-person forms (CATS), past tenses (USED), gerunds
// (RUNNING), comparatives/superlatives (LARGER, LARGEST), -LY adverbs
// (REALLY) and informal clippings (TEEN).
//
// Counts: ${LENGTHS.map((l) => `${l}L ${report[l].total} (${report[l].common} common / ${report[l].rare} rare)`).join(', ')}
`;

const body = LENGTHS.map(
  (len) => `${serialise(`COMMON_${len}`, lists[len].common)}\n\n${serialise(`RARE_${len}`, lists[len].rare)}`
).join('\n\n');

const footer = `
// Word lists per length, each ordered by rank (most likely answer first).
export const WORD_LISTS = {
${LENGTHS.map((l) => `  ${l}: { common: COMMON_${l}, rare: RARE_${l} },`).join('\n')}
};

// Full ranked list for a length: common words first, then rare ones.
const rankedCache = new Map();
export function getRankedWords(length) {
  if (rankedCache.has(length)) return rankedCache.get(length);
  const list = WORD_LISTS[length];
  const ranked = list ? [...list.common, ...list.rare] : [];
  rankedCache.set(length, ranked);
  return ranked;
}

// Rank lookup (1 = most likely). Returns Infinity for unknown words.
const rankMaps = new Map();
export function getWordRank(word) {
  const length = word.length;
  if (!rankMaps.has(length)) {
    rankMaps.set(length, new Map(getRankedWords(length).map((w, i) => [w, i + 1])));
  }
  const rank = rankMaps.get(length).get(word);
  return rank === undefined ? Infinity : rank;
}

export function getAllWords(length) {
  return getRankedWords(length);
}

// The best-ranked slice of a length: everyday words that realistically show up
// as puzzle answers. Used by the random word picker so it never lands on an
// obscure entry from the tail of the list.
export function getTopWords(length, limit = 400) {
  return getRankedWords(length).slice(0, limit);
}

// category: 'all' | 'common' | 'rare'
export function getUniqueWords(length, category = 'all') {
  const list = WORD_LISTS[length];
  if (!list) return [];
  if (category === 'common') return [...list.common];
  if (category === 'rare') return [...list.rare];
  return getRankedWords(length);
}
`;

fs.writeFileSync(OUT, `${header}\n${body}\n\n${footer}`);

// ------------------------------------------------------------------ report ---

process.stderr.write(`\nwrote ${OUT}\n`);
for (const len of LENGTHS) {
  const r = report[len];
  process.stderr.write(`  ${len} letters: ${r.total} words (${r.common} common / ${r.rare} rare)\n`);
}

if (process.argv.includes('--report')) {
  const prev = process.env.PREV_WORDS;
  const dump = {};
  for (const len of LENGTHS) {
    const counts = {};
    for (const why of report[len].rejected.values()) counts[why] = (counts[why] || 0) + 1;
    dump[len] = counts;
  }
  process.stderr.write(`\nrejection reasons:\n${JSON.stringify(dump, null, 2)}\n`);
  if (prev) process.stderr.write(`\n(compare with ${prev})\n`);
}
