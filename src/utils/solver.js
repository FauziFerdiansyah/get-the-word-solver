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

    // 2. Build constraints
    const greenLetters = new Map(); // letter -> positions where it must be
    const yellowLetters = new Map(); // letter -> positions where it must NOT be
    
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      
      const state = colorStates[i] || 'green';
      
      if (state === 'green') {
        // Must be at this exact position
        if (word[i] !== clue) {
          return false;
        }
        if (!greenLetters.has(clue)) {
          greenLetters.set(clue, []);
        }
        greenLetters.get(clue).push(i);
      } else if (state === 'yellow') {
        // Must exist in word but NOT at this position
        if (!yellowLetters.has(clue)) {
          yellowLetters.set(clue, new Set());
        }
        yellowLetters.get(clue).add(i);
      }
    }

    // 3. Verify yellow letter constraints
    for (const [letter, forbiddenPositions] of yellowLetters) {
      // Count how many times this letter appears in the word
      const wordCount = word.split('').filter(c => c === letter).length;
      
      // Count how many times it appears in green positions
      const greenCount = greenLetters.get(letter)?.length || 0;
      
      // Must have at least (greenCount + 1) occurrences
      if (wordCount < greenCount + 1) {
        return false;
      }
      
      // Check that it doesn't appear ONLY at forbidden positions
      // Find if there's at least one occurrence outside forbidden positions
      let foundValidPosition = false;
      for (let i = 0; i < word.length; i += 1) {
        if (word[i] === letter && !forbiddenPositions.has(i)) {
          foundValidPosition = true;
          break;
        }
      }
      
      if (!foundValidPosition) {
        return false;
      }
    }

    return true;
  });

  return shuffle(matches);
}
