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

export function findMatches(words, clues, colorStates, disabledLetters) {
  const matches = words.filter((word) => {
    // 1. Disabled letters must not appear anywhere in the word.
    for (let i = 0; i < word.length; i += 1) {
      if (disabledLetters.has(word[i])) {
        return false;
      }
    }

    // 2. Process each clue slot
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue; // Empty slot, skip

      const state = colorStates[i] || 'green';

      if (state === 'green') {
        // Exact placement: letter must be at this position
        if (word[i] !== clue) {
          return false;
        }
      } else if (state === 'yellow') {
        // Letter must exist in the word but NOT at this position
        if (word[i] === clue) {
          return false; // Can't be at this exact spot
        }
        if (!word.includes(clue)) {
          return false; // Must exist somewhere in the word
        }
      }
    }

    return true;
  });

  return shuffle(matches);
}
