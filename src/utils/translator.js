// Translation service for word definitions
// Uses Lingva Translate (open-source Google Translate mirror) for better accuracy

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

// Lingva Translate instances (open-source Google Translate mirrors)
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
];

// Google Translate unofficial endpoint (more reliable)
async function translateWithGoogle(text, targetLang, sourceLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
  } catch {
    // Fall through to next method
  }
  return null;
}

// Lingva Translate fallback
async function translateWithLingva(text, targetLang, sourceLang) {
  for (const instance of LINGVA_INSTANCES) {
    try {
      const url = `${instance}/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.translation) {
        return data.translation;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// MyMemory as last fallback
async function translateWithMyMemory(text, targetLang, sourceLang) {
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });
    const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      // MyMemory sometimes returns all-caps garbage, filter that
      if (translated === translated.toUpperCase() && translated.length > 3) return null;
      return translated;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function translateText(text, targetLang = 'id', sourceLang = 'en') {
  if (!text || targetLang === sourceLang) return text;
  
  const cacheKey = `${text}|${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Try Google Translate first (most accurate)
  let translated = await translateWithGoogle(text, targetLang, sourceLang);
  
  // Fallback to Lingva
  if (!translated) {
    translated = await translateWithLingva(text, targetLang, sourceLang);
  }
  
  // Last resort: MyMemory
  if (!translated) {
    translated = await translateWithMyMemory(text, targetLang, sourceLang);
  }

  if (translated) {
    translationCache.set(cacheKey, translated);
    return translated;
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
