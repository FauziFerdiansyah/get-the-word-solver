// Free Dictionary API - fetches word definitions and phonetics.
// https://dictionaryapi.dev/

import { translateText, translatePartOfSpeech } from './translator';

const cache = new Map();

export async function getDefinition(word, lang = 'en') {
  const key = `${word.toLowerCase()}|${lang}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      cache.set(key, null);
      return null;
    }

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
    let definition = entry.meanings?.[0]?.definitions?.[0]?.definition || '';
    let partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';

    // Translate if language is not English
    if (lang === 'id') {
      if (definition) {
        definition = await translateText(definition, 'id', 'en');
      }
      if (partOfSpeech) {
        partOfSpeech = translatePartOfSpeech(partOfSpeech, 'id');
      }
    }

    const result = { phonetic, definition, partOfSpeech };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
