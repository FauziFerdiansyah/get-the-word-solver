import { useRef, useState, useEffect } from 'react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import { playKeySound, playErrorSound } from '../utils/sound';

// A position can be ruled out for at most one letter per guess, and the game
// gives six guesses — so six is the ceiling when the setting is switched on.
export const MAX_EXCLUDED = 6;

// Ruled-out letters are laid out 3 per row, so 6 letters fill two rows.
const PER_ROW = 3;

// Font shrinks with every extra letter so the box does not have to grow to hold
// them — including while typing. iOS Safari would normally zoom the page in on a
// focused field under 16px, which is why the viewport meta pins maximum-scale.
const STRIP_FONT_SIZES = { 0: 16, 1: 16, 2: 16, 3: 14, 4: 13, 5: 12, 6: 11 };
const stripFontSize = (count) => STRIP_FONT_SIZES[count] ?? 11;

// Single-row clue input.
//
// Each column carries two pieces of knowledge:
//   - top box: a letter you have placed, with a dot to switch it between
//     green (this exact position) and yellow (in the word, but not here)
//   - bottom box: further letters that are in the word but NOT at that position
//
// The bottom box is what makes duplicated yellows expressible: put A under box 2
// and under box 3 and the solver keeps every word that contains a single A as
// long as it avoids both spots. A box can also list different letters (R and L
// both ruled out of position 2), but never the same letter twice.
export default function ClueGrid({
  clues,
  clueStates,
  excluded,
  maxExcluded = 1,
  onChange,
  onStateToggle,
  onExcludedChange,
  disabledLetters,
}) {
  const { theme, soundEnabled, showHints, t } = useTheme();
  const inputRefs = useRef([]);
  const [blinkIndex, setBlinkIndex] = useState(null);

  useEffect(() => {
    if (blinkIndex === null) return undefined;
    const timer = setTimeout(() => setBlinkIndex(null), 600);
    return () => clearTimeout(timer);
  }, [blinkIndex]);

  const flagConflict = (index) => {
    setBlinkIndex(index);
    if (soundEnabled) playErrorSound();
  };

  const handleInput = (index, rawValue) => {
    const value = rawValue.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    onChange(index, value);
    if (value && disabledLetters.has(value)) {
      flagConflict(index);
    } else if (value) {
      if (soundEnabled) playKeySound(value);
      if (index < clues.length - 1) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !clues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleExcludedInput = (index, rawValue) => {
    const typed = rawValue.toUpperCase().replace(/[^A-Z]/g, '');
    const current = (excluded[index] || '').slice(0, maxExcluded);

    // Every letter that gets thrown away now says why. Silently dropping them
    // made a working box look like it had a one or two letter limit.
    const seen = new Set();
    const duplicates = [];
    const blocked = [];
    const kept = [];
    for (const letter of typed) {
      if (seen.has(letter)) {
        duplicates.push(letter);
      } else if (disabledLetters.has(letter)) {
        seen.add(letter);
        blocked.push(letter);
      } else if (kept.length >= maxExcluded) {
        // Over capacity: keep the earlier letters, report the overflow.
        duplicates.push(letter);
      } else {
        seen.add(letter);
        kept.push(letter);
      }
    }

    const value = kept.join('');
    if (blocked.length > 0) {
      flagConflict(index);
      gooeyToast(`${[...new Set(blocked)].join(', ')} ${t.letterCrossedOut}`, { duration: 2200 });
    } else if (typed.length > current.length && value.length === current.length) {
      // The user typed something and the box did not grow — say what happened.
      const reason = kept.length >= maxExcluded ? t.boxFull : t.letterAlreadyThere;
      flagConflict(index);
      gooeyToast(`${[...new Set(duplicates)].join(', ')} ${reason}`, { duration: 2000 });
    }

    onExcludedChange(index, value);
    const last = value[value.length - 1];
    if (last && soundEnabled && blocked.length === 0 && value.length > current.length) {
      playKeySound(last);
    }
  };

  const getBoxStyle = (letter, state) => {
    if (!letter) {
      return { backgroundColor: theme.card, color: theme.text, borderColor: theme.border };
    }
    if (disabledLetters.has(letter)) {
      return { backgroundColor: theme.red, color: '#ffffff', borderColor: theme.border };
    }
    if (state === 'yellow') {
      return { backgroundColor: theme.yellow, color: '#1e293b', borderColor: theme.border };
    }
    return { backgroundColor: theme.green, color: theme.textOnColor, borderColor: theme.border };
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Which box means what — hidden once the user knows the app */}
      {showHints && (
      <div className="flex flex-col items-start gap-1 text-[11px] font-semibold w-full max-w-[22rem]" style={{ color: theme.textMuted }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-md border shrink-0" style={{ backgroundColor: theme.green, borderColor: theme.border + '60' }} />
          {t.clueGreenHint}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-md border shrink-0" style={{ backgroundColor: theme.yellow, borderColor: theme.border + '60' }} />
          {t.clueYellowHint}
        </span>
      </div>
      )}

      <div className="flex w-full max-w-[22rem] items-start justify-center gap-1.5 sm:gap-2">
        {clues.map((letter, index) => {
          const isBlink = blinkIndex === index;
          const strip = (excluded[index] || '').slice(0, maxExcluded);
          const state = clueStates[index] || 'green';
          const conflicting = letter && disabledLetters.has(letter);
          return (
            <div key={index} className="flex flex-1 max-w-12 flex-col items-center gap-1">
              <div className="relative w-full">
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  value={letter}
                  onChange={(e) => handleInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={1}
                  aria-label={`${t.clueGreenLabel} ${index + 1}`}
                  className={[
                    'w-full aspect-square rounded-xl border-2',
                    'text-center text-xl font-extrabold uppercase',
                    'focus:outline-none focus:ring-2 transition-all touch-manipulation',
                    isBlink ? 'animate-blink-red' : '',
                  ].join(' ')}
                  style={{ ...getBoxStyle(letter, state), boxShadow: `3px 3px 0px 0px ${theme.shadow}`, '--tw-ring-color': theme.border }}
                />
                {/* Dot switches the placed letter between green and yellow */}
                {letter && !conflicting && (
                  <button
                    type="button"
                    onClick={() => onStateToggle(index)}
                    aria-label={`${t.clueToggle} ${index + 1}: ${state === 'yellow' ? t.legendWrong : t.legendCorrect}`}
                    className="absolute bottom-0 right-0 w-[18px] h-[18px] rounded-full border-2 active:scale-90 transition-transform touch-manipulation"
                    style={{
                      backgroundColor: state === 'yellow' ? theme.yellow : theme.green,
                      borderColor: theme.border,
                      boxShadow: `1px 1px 0px 0px ${theme.shadow}`,
                      transform: 'translate(25%, 25%)',
                    }}
                  />
                )}
              </div>
              {/* Ruled-out letters wrap 3 per row, up to 2 rows. The line break
                  is inserted for display only, so the stored value stays a plain
                  string and never depends on font metrics to wrap. */}
              <textarea
                value={[strip.slice(0, PER_ROW), strip.slice(PER_ROW)].filter(Boolean).join('\n')}
                onChange={(e) => handleExcludedInput(index, e.target.value)}
                rows={strip.length > PER_ROW ? 2 : 1}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={maxExcluded + 1 /* room for the display line break */}
                placeholder="+"
                aria-label={`${t.clueYellowLabel} ${index + 1}`}
                title={`${t.clueYellowLabel} ${index + 1} — ${strip.length}/${maxExcluded}`}
                className="clue-strip w-full resize-none overflow-hidden rounded-lg border-2 py-1 text-center font-bold uppercase leading-tight tracking-tighter focus:outline-none focus:ring-2 transition-all touch-manipulation"
                style={{
                  fontSize: `${stripFontSize(strip.length)}px`,
                  backgroundColor: strip ? theme.yellow : theme.card,
                  color: strip ? '#1e293b' : theme.textMuted,
                  borderColor: theme.border,
                  boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
                  '--tw-ring-color': theme.border,
                }}
              />
            </div>
          );
        })}
      </div>

      {showHints && (
        <p className="text-[11px] text-center leading-relaxed max-w-[22rem]" style={{ color: theme.textMuted }}>
          {maxExcluded > 1 ? t.legendHintMulti : t.legendHint}
          <span className="block mt-1 font-semibold">{t.clueDuplicateHint}</span>
        </p>
      )}
    </div>
  );
}
