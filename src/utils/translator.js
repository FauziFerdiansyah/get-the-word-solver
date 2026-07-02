// Translation service for word definitions
// Uses Google Translate API through a free service

const translationCache = new Map();

// Indonesian translations for common parts of speech
const partOfSpeechTranslations = {
  id: {
    'noun': 'Nomina',
    'verb': 'Verba',
    'adjective': 'Adjektiva',
    'adverb': 'Adverbia',
    'pronoun': 'Pronomina',
    'preposition': 'Preposisi',
    'conjunction': 'Konjungsi',
    'interjection': 'Interjeksi',
    'article': 'Artikel',
  },
  en: {
    'noun': 'noun',
    'verb': 'verb',
    'adjective': 'adjective',
    'adverb': 'adverb',
    'pronoun': 'pronoun',
    'preposition': 'preposition',
    'conjunction': 'conjunction',
    'interjection': 'interjection',
    'article': 'article',
  }
};

export function translatePartOfSpeech(pos, lang = 'en') {
  if (!pos) return '';
  const lower = pos.toLowerCase();
  const translations = partOfSpeechTranslations[lang] || partOfSpeechTranslations.en;
  return translations[lower] || pos;
}

// Simple translation using MyMemory API (free)
export async function translateText(text, targetLang = 'id', sourceLang = 'en') {
  if (!text || targetLang === sourceLang) return text;
  
  const cacheKey = `${text}|${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });

    const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
    if (!res.ok) return text;

    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (error) {
    console.error('Translation error:', error);
  }

  return text;
}

// Batch translate definitions
export async function translateDefinitions(definitions, targetLang = 'id') {
  if (targetLang === 'en' || !definitions || definitions.length === 0) {
    return definitions;
  }

  try {
    const translated = await Promise.all(
      definitions.map(def => translateText(def, targetLang, 'en'))
    );
    return translated;
  } catch {
    return definitions;
  }
}
