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

    // 2. Check green constraints (exact position matches)
    const greenLetters = new Map(); // letter -> array of positions
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'green') {
        if (word[i] !== clue) {
          return false;
        }
        if (!greenLetters.has(clue)) {
          greenLetters.set(clue, []);
        }
        greenLetters.get(clue).push(i);
      }
    }

    // 3. Check yellow constraints (letter exists but NOT at this position)
    const yellowLetters = new Map(); // letter -> array of forbidden positions
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'yellow') {
        // The letter at this position is yellow, meaning:
        // - The letter MUST exist somewhere in the word
        // - But NOT at this exact position
        if (word[i] === clue) {
          return false; // Reject if letter is at this position
        }
        if (!word.includes(clue)) {
          return false; // Reject if letter doesn't exist at all
        }
        if (!yellowLetters.has(clue)) {
          yellowLetters.set(clue, []);
        }
        yellowLetters.get(clue).push(i);
      }
    }

    return true;
  });

  return shuffle(matches);
}
