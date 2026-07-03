// Core Wordle-solving filter logic.
//
// `clues` is an array (length === wordLength) of single uppercase letters
// or empty string "" for unfilled slots.
//
// `colorStates` is a parallel array with values:
// - 'green'  → letter MUST be at that exact position
// - 'yellow' → letter MUST exist in the word but NOT at that position
//
// `disabledLetters` is a Set of uppercase letters known to be absent from
// the target word anywhere (marked via the virtual keyboard).

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Whitelist of common words ending with these patterns that are NOT inflected forms
// These are base words that naturally end with these letters
const SUFFIX_WHITELIST = new Set([
  // Words ending in -S that are NOT plurals (they are base words)
  "ANTS","ARTS","AXIS","BASS","BIAS","BIDS","BITS","BOBS","BOSS","BUDS","BUGS","BUNS",
  "CAPS","CATS","COBS","COGS","COTS","CUBS","CUPS","CUTS","DADS","DAYS","DINS","DIPS","DOES",
  "DOGS","DOTS","DUBS","DUDS","DUES","DYES","EARS","EATS","EGGS","ELMS","ERAS",
  "EVES","EYES","FADS","FANS","FATS","FEDS","FEES","FIGS","FINS","FITS","FOES","FOGS",
  "FURS","GABS","GAGS","GALS","GAPS","GIGS","GINS","GOES","GOBS","GODS","GUMS","GUNS",
  "GUTS","GUYS","GYMS","HAMS","HATS","HENS","HIPS","HITS","HOBS","HOGS","HOPS","HUBS","HUGS",
  "HUTS","INKS","INNS","IONS","JABS","JAGS","JAMS","JARS","JAWS","JAYS","JETS","JOBS",
  "JOGS","JOTS","JOYS","JUGS","KEYS","KIDS","KITS","LABS","LADS","LAGS","LAPS","LEGS",
  "LIDS","LIES","LIPS","LOGS","LOTS","LOWS","LUGS","MARS","MATS","MOBS","MODS","MOMS",
  "MUDS","MUGS","NAPS","NETS","NEWS","NIPS","NITS","NODS","NUBS","NUNS","NUTS","OAFS","OAKS","OARS",
  "OATS","ODDS","OILS","ONES","OPTS","ORBS","ORES","OWES","OWNS","PADS","PALS","PANS",
  "PATS","PAWS","PAYS","PEAS","PEGS","PENS","PIGS","PINS","PITS","PLUS","PODS","POPS","POTS",
  "PROS","PUBS","PUGS","PUNS","PUPS","PUTS","RAGS","RAMS","RAPS","RATS","RAYS","RIBS","RIDS",
  "RIGS","RIMS","ROBS","RODS","ROWS","RUBS","RUGS","RUNS","RUTS","SACS","SAYS","SEAS","SETS",
  "SIPS","SITS","SOBS","SODS","SONS","SOPS","SOWS","SPAS","SUBS","SUDS","SUES","SUMS","TABS",
  "TADS","TAGS","TANS","TAPS","TARS","TEAS","TENS","TIES","TINS","TIPS","TOES","TONS","TOPS",
  "TOTS","TOWS","TOYS","TUBS","TUGS","TWOS","URNS","USES","VANS","VATS","VETS","VOWS","WADS",
  "WAGS","WARS","WAYS","WEBS","WEDS","WETS","WIGS","WINS","WITS","WOES","WOKS","YAKS","YAMS",
  "YAPS","YEWS","ZAPS","ZIPS",
  // 5-letter words ending in S that are standalone words
  "SALES","ATLAS","BASIS","BONUS","BRASS","CHESS","CLASS","CORPS","CROSS","DRESS","FOCUS","FLOSS",
  "FUMES","GENES","GLASS","GLOSS","GRASS","GROSS","GUESS","HERBS","IDEAS","ITEMS","JEANS","KEEPS",
  "KUDOS","LAPIS","LOTUS","MEANS","MINUS","NEXUS","OASIS","PANTS","PRESS","REBUS","SPECS",
  "TERMS","TESTS","TIMES","TOOLS","VENUS","VIRUS","WAGES","WATTS","WAVES","WOODS","WORDS",
  "WORKS","YEARS","BLISS","ABYSS","CRASS","FLOSS","GLOSS",
  "ALIAS", "PARIS", "PLUS", "STRESS", "SWISS", "TENNIS", "TEXAS", "THUS",
  "CAMPUS", "CANVAS", "CENSUS", "CIRCUS", "CORPUS", "CRISIS", "EXODUS", "FAMOUS",
  "FUNGUS", "GENIUS", "MUCOUS", "RADIUS", "STATUS", "VERSUS", "WALRUS",
  "CACTUS", "CITRUS", "COSMOS", "DEBRIS", "ETHICS", "HIATUS", "PATHOS", "PELVIS",
  "RUCKUS", "SERIES", "THESIS", "TYPHUS", "CAUCUS", "DISCUS",
  "JAZZ", "FIZZ", "BUZZ", "FUZZ", "QUIZ", "WHIZ", "BLITZ", "WALTZ", "HERTZ",
  // Words ending in -ED that are NOT past tense (adjectives/base words)
  "NAKED", "WICKED", "SACRED", "CROOKED", "RUGGED", "RAGGED", "JAGGED", "AGED",
  "FIXED", "MIXED", "SPEED", "BREED", "GREED", "BLEED", "CREED", "FREED", "TREED",
  "STEED", "TWEED",
  // Words ending in -ER that are NOT comparatives (they are base/noun forms)
  "AFTER", "ALTER", "AMBER", "ANGER", "CAPER", "CIDER", "COVER", "CYBER", "EAGER",
  "ENTER", "ETHER", "EVER", "FEVER", "FIBER", "FINGER", "GINGER", "HANGER", "INNER",
  "INTER", "LASER", "LATER", "LAYER", "LEPER", "LEVER", "LIVER", "LOWER", "MAKER",
  "MANOR", "MAJOR", "MASTER", "MATTER", "MEMBER", "METER", "MISER", "MITER",
  "MOTHER", "MURDER", "NEVER", "NUMBER", "OFFER", "ORDER", "OTHER", "OUTER", "OVER",
  "OWNER", "PAPER", "PEPPER", "PETER", "POKER", "POWER", "PROPER", "RIVER", "ROGER",
  "RUBBER", "RULER", "SAUCER", "SHELTER", "SILVER", "SISTER", "SOCCER", "SPIDER",
  "SUMMER", "SUPER", "TEACHER", "TENDER", "THUNDER", "TIGER", "TIMBER", "TOWER",
  "UNDER", "UPPER", "USER", "VIPER", "VOTER", "WAFER", "WATER", "WEATHER", "WINTER",
  "WONDER", "ZIPPER", "BANTER", "BARTER", "BATTER", "BEAVER", "BITTER", "BLISTER",
  "BLUNDER", "BORDER", "BOULDER", "BUFFER", "BUMPER", "BUNKER", "BURGER", "BUTLER",
  "BUTTER", "CANCER", "CENTER", "CHAPTER", "CHARTER", "CHATTER", "CINDER", "CLUSTER",
  "CLUTTER", "COASTER", "COPPER", "CORNER", "COUNTER", "CRACKER", "CRATER", "DAGGER",
  "DANGER", "DEALER", "DIFFER", "DINNER", "DOCKER", "DOLLAR", "DUSTER", "EASTER",
  "EITHER", "ELDER", "EMPEROR", "EQUATOR", "ERROR", "FACTOR", "FARMER", "FATHER",
  "FEATHER", "FENDER", "FIGHTER", "FILTER", "FINDER", "FISHER", "FITTER", "FLAVOR",
  "FLICKER", "FLUTTER", "FOLDER", "FOOTER", "FOUNDER", "FREEZER", "FURTHER", "GATHER",
  "GENDER", "GLACIER", "GLITTER", "GOLFER", "GRAMMAR", "GUTTER", "HAMMER", "HAMPER",
  "HARBOR", "HEADER", "HEATER", "HELPER", "HIKER", "HINDER", "HOLDER", "HOMER",
  "HONOR", "HOPPER", "HORROR", "HUNTER", "HUNGER", "JOKER", "JUNIOR", "KEEPER",
  "KILLER", "LADDER", "LANDER", "LEATHER", "LEDGER", "LETTER", "LIGHTER", "LINER",
  "LOAFER", "LOBSTER", "LOCKER", "LOGGER", "LUMBER", "MANNER", "MARKER", "MENTOR",
  "MERGER", "MILLER", "MINER", "MINOR", "MIRROR", "MIXER", "MONSTER", "MOTOR",
  "MUFFLER", "MURMUR", "NEITHER", "NIGHTMARE", "OFFICER", "OPENER", "OUTDOOR",
  "OYSTER", "PAINTER", "PARTNER", "PICKER", "PILLAR", "PIONEER", "PITCHER", "PLANNER",
  "PLANTER", "PLASTER", "PLAYER", "PLUMBER", "POLAR", "POSTER", "POTTER", "POWDER",
  "PRAYER", "PREMIER", "PRINTER", "PROSPER", "QUARTER", "QUIVER", "RACER", "RADAR",
  "READER", "REGISTER", "REMAINDER", "REMEMBER", "RENDER", "RIDER", "ROCKER", "ROLLER",
  "ROSTER", "RUDDER", "RUNNER", "SCATTER", "SECTOR", "SENDER", "SENIOR", "SERVER",
  "SHOULDER", "SHOWER", "SHUTTER", "SIMILAR", "SINGER", "SINKER", "SKATER", "SLIDER",
  "SLUMBER", "SOLDER", "SOLDIER", "SPEAKER", "SPLINTER", "SPLITTER", "SPONSOR",
  "STAPLER", "STARTER", "STEAMER", "STICKER", "STINGER", "STOPPER", "STRANGER",
  "STREAMER", "STROLLER", "STRUCTURE", "SUFFER", "SUGAR", "SUPPER", "SUPPLIER",
  "SURRENDER", "SWEATER", "SWIMMER", "THINKER", "TIMER", "TOASTER", "TOGETHER",
  "TRACTOR", "TRADER", "TRAILER", "TRAINER", "TRANSFER", "TRIGGER", "TROOPER",
  "TRUCKER", "TUMOR", "TURNER", "UTTER", "VAPOR", "VECTOR", "VENDOR", "VIEWER",
  "VIGOR", "VISITOR", "VOUCHER", "WAITER", "WALKER", "WANDER", "WARMER", "WASHER",
  "WHISPER", "WINNER", "WORKER", "WRAPPER", "WRITER", "YOUNGER",
  // Words ending in -LY that are NOT adverbs (base words)
  "ALLY", "BELLY", "BULLY", "CURLY", "DOLLY", "EARLY", "FAMILY", "FOLLY", "FULLY",
  "GOLLY", "HOLLY", "HOLY", "HOMELY", "JELLY", "JOLLY", "LONELY", "LOVELY", "LOWLY",
  "MANLY", "ONLY", "RALLY", "REPLY", "SILLY", "SULLY", "SUPPLY", "UGLY", "WOOLLY",
  "LILY", "WILY", "OILY", "DAILY", "BURLY", "SURLY", "HILLY", "BILLY", "DILLY",
  "FILLY", "WILLY", "TALLY", "GULLY", "BULLY", "FULLY", "DULLY", "MULLY", "HULLY",
  // Words ending in -EST that are NOT superlatives
  "ATTEST", "CHEST", "CREST", "DIGEST", "EARNEST", "FOREST", "HARVEST", "HONEST",
  "INCEST", "INFEST", "INGEST", "INVEST", "JEST", "MANIFEST", "MODEST", "MOLEST",
  "NEST", "PEST", "PRIEST", "PROTEST", "QUEST", "REQUEST", "REST", "SUGGEST", "TEST",
  "UNREST", "VEST", "WEST", "ZEST", "BEST", "BREAST", "CONTEST", "DETEST", "FEAST",
  "GUEST", "INTEREST", "TEMPEST", "TOAST", "YEAST",
  // Words ending in -ING that are NOT gerunds (they are nouns/base words)
  "BEING", "BRING", "CEILING", "CLING", "DING", "FLING", "KING", "RING", "SING",
  "SLING", "SPRING", "STING", "STRING", "SWING", "THING", "WING", "BLING", "ZING",
  "PING", "MING", "LING",
]);

/**
 * Check if a word has a suffix that should be filtered in Get The Word mode
 * Returns true if the word should be EXCLUDED (has problematic suffix)
 */
export function hasInflectedSuffix(word) {
  if (!word || word.length < 4) return false;
  
  // If word is in whitelist, don't filter it
  if (SUFFIX_WHITELIST.has(word)) return false;
  
  const len = word.length;
  
  // No longer filter words ending in -S since the word list now intentionally 
  // includes valid S-ending words. Only filter other inflected forms.
  
  // Check -ED ending (past tense)
  if (word.endsWith('ED')) {
    // Check if it's an inflected form (verb + ed)
    const root = word.slice(0, -2);
    // If doubling occurred (e.g., ZAPPED from ZAP), check root
    if (root.length >= 2 && root[root.length - 1] === root[root.length - 2]) {
      return true; // Likely doubled consonant (ZAPPED, MAPPED)
    }
    // Common -ED patterns that are inflections
    if (word.endsWith('IED') || word.endsWith('TED') || word.endsWith('NED') || 
        word.endsWith('RED') || word.endsWith('LED') || word.endsWith('SED') ||
        word.endsWith('KED') || word.endsWith('GED') || word.endsWith('PED') ||
        word.endsWith('VED') || word.endsWith('MED') || word.endsWith('BED') ||
        word.endsWith('XED') || word.endsWith('ZED')) {
      return true;
    }
  }
  
  // Check -ING ending (gerund)
  if (word.endsWith('ING') && len > 4) {
    return true;
  }
  
  // Check -LY ending (adverb) for 5+ letter words
  if (word.endsWith('LY') && len >= 5) {
    // Most -LY words are adverbs derived from adjectives
    return true;
  }
  
  // Check -ER ending (comparative) for 5+ letter words
  // Be careful: many nouns end in -ER (water, teacher)
  if (word.endsWith('ER') && len >= 5) {
    // Check for doubled consonant pattern (BIGGER, HOTTER)
    if (len >= 6 && word[len - 3] === word[len - 4]) {
      return true; // Doubled consonant suggests comparative
    }
    // Check -IER pattern (HAPPIER, EASIER)
    if (word.endsWith('IER')) {
      return true;
    }
  }
  
  // Check -EST ending (superlative) for 5+ letter words
  if (word.endsWith('EST') && len >= 5) {
    // Check for doubled consonant pattern (BIGGEST, HOTTEST)
    if (len >= 7 && word[len - 4] === word[len - 5]) {
      return true; // Doubled consonant suggests superlative
    }
    // Check -IEST pattern (HAPPIEST, EASIEST)
    if (word.endsWith('IEST')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter words for Get The Word mode
 * Removes words with common inflected suffixes
 */
export function filterForGetTheWord(words) {
  return words.filter(word => !hasInflectedSuffix(word));
}

export function findMatches(words, clues, colorStates, disabledLetters) {
  // Pre-calculate minimum required count for each letter
  // If a letter appears multiple times in clues (green or yellow), the word must have at least that many
  const minLetterCount = new Map();
  for (let i = 0; i < clues.length; i += 1) {
    const clue = clues[i];
    if (!clue) continue;
    minLetterCount.set(clue, (minLetterCount.get(clue) || 0) + 1);
  }

  const matches = words.filter((word) => {
    // 1. Disabled letters must not appear anywhere in the word.
    for (let i = 0; i < word.length; i += 1) {
      if (disabledLetters.has(word[i])) {
        return false;
      }
    }

    // 2. Check minimum letter count requirement
    // If user entered same letter multiple times, word must have at least that many
    for (const [letter, minCount] of minLetterCount) {
      const actualCount = (word.match(new RegExp(letter, 'g')) || []).length;
      if (actualCount < minCount) {
        return false;
      }
    }

    // 3. Check green constraints (exact position matches)
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'green') {
        if (word[i] !== clue) {
          return false;
        }
      }
    }

    // 4. Check yellow constraints (letter exists but NOT at this position)
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'yellow') {
        // The letter at this position is yellow, meaning:
        // - The letter MUST exist somewhere in the word (already checked in step 2)
        // - But NOT at this exact position
        if (word[i] === clue) {
          return false; // Reject if letter is at this position
        }
      }
    }

    return true;
  });

  return shuffle(matches);
}
