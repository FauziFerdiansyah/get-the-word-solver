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
