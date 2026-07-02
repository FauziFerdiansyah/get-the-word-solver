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

    // 2. Green clues: letters that must be at exact positions
    const greenPositions = new Map(); // letter -> array of positions
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'green') {
        if (word[i] !== clue) {
          return false;
        }
        if (!greenPositions.has(clue)) {
          greenPositions.set(clue, []);
        }
        greenPositions.get(clue).push(i);
      }
    }

    // 3. Yellow clues: letters that must exist but NOT at marked positions
    const yellowConstraints = new Map(); // letter -> forbidden positions
    for (let i = 0; i < clues.length; i += 1) {
      const clue = clues[i];
      if (!clue) continue;
      const state = colorStates[i] || 'green';
      if (state === 'yellow') {
        if (word[i] === clue) {
          return false; // Can't be at this exact spot
        }
        if (!yellowConstraints.has(clue)) {
          yellowConstraints.set(clue, []);
        }
        yellowConstraints.get(clue).push(i);
      }
    }

    // 4. Verify all yellow letters exist in the word
    for (const [letter, forbiddenPositions] of yellowConstraints) {
      // Count occurrences of this letter in the word
      const wordOccurrences = word.split('').filter(c => c === letter).length;
      
      // Count green occurrences of this letter
      const greenOccurrences = greenPositions.get(letter)?.length || 0;
      
      // Must have at least (greenOccurrences + 1) instances to satisfy yellow
      if (wordOccurrences < greenOccurrences + 1) {
        return false;
      }
      
      // Check that the yellow occurrences are not at forbidden positions
      // (this is already checked above with word[i] === clue check)
    }

    return true;
  });

  return shuffle(matches);
}
