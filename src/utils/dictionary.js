// Free Dictionary API - fetches word definitions and phonetics.
// https://dictionaryapi.dev/

const cache = new Map();

export async function getDefinition(word) {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${key}`);
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
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition || '';
    const partOfSpeech = meaning?.partOfSpeech || '';

    const result = { phonetic, definition, partOfSpeech };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
