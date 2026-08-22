import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import { playKeySound, playKeyUpSound } from '../utils/sound';

// The keyboard is a 20-column grid — 10 keys wide, with half-key granularity so
// rows 2 and 3 can be centred when the action keys are hidden.
//
// Layout with the action keys on, exactly like Get the Word:
//
//   Q W E R T Y U I O P
//   A S D F G H J K L  ⏎   ← enter is one column wide and two rows tall,
//   Z X C V B N M ⌫⌫   ⏎     sitting right of L and under P
//
// so backspace fills the two columns under K and L, and enter owns the last
// column across both rows.
const COLUMNS = 20;
const KEY_SPAN = 2;

const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

// Half-key indents used to centre the shorter rows when enter/backspace are off.
const CENTRED_INDENT = [0, 1, 3];

export default function Keyboard({ disabledLetters, letterColors, onToggle }) {
  const { theme, soundEnabled, showKeyboardExtras, t } = useTheme();
  const [pressed, setPressed] = useState(null);

  const handlePress = (letter) => {
    setPressed(letter);
    if (soundEnabled) playKeySound(letter);
  };

  const handleRelease = (letter) => {
    if (pressed === null) return;
    setPressed(null);
    if (soundEnabled && letter) playKeyUpSound(letter);
  };

  const getKeyStyle = (letter) => {
    if (disabledLetters.has(letter)) {
      return { backgroundColor: theme.disabled, color: theme.textOnColor };
    }
    const colorState = letterColors.get(letter);
    if (colorState === 'green') return { backgroundColor: theme.green, color: theme.textOnColor };
    if (colorState === 'yellow') return { backgroundColor: theme.yellow, color: '#1e293b' };
    return { backgroundColor: theme.keyboard, color: theme.text };
  };

  // A pressed key sinks into its shadow, the way a physical key would.
  const pressDepth = (letter) =>
    pressed === letter
      ? { transform: 'translate(2px, 2px)', boxShadow: `0px 0px 0px 0px ${theme.shadow}` }
      : { transform: 'none', boxShadow: `2px 2px 0px 0px ${theme.shadow}` };

  const actionKeyStyle = {
    backgroundColor: theme.keyboard,
    color: theme.textMuted,
    borderColor: theme.border,
    boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
  };

  return (
    <div
      className="mx-auto grid w-full max-w-[34rem] gap-1 md:gap-1.5 select-none"
      style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
    >
      {LETTER_ROWS.map((row, rowIndex) => {
        const indent = showKeyboardExtras ? 0 : CENTRED_INDENT[rowIndex];
        return row.map((letter, keyIndex) => (
          <button
            key={letter}
            type="button"
            onClick={() => onToggle(letter)}
            onPointerDown={() => handlePress(letter)}
            onPointerUp={() => handleRelease(letter)}
            onPointerLeave={() => handleRelease(null)}
            onPointerCancel={() => handleRelease(null)}
            aria-pressed={disabledLetters.has(letter)}
            className="aspect-square rounded-lg md:rounded-xl border-2 text-sm md:text-lg font-bold transition-transform duration-75 touch-manipulation"
            style={{
              gridRow: rowIndex + 1,
              gridColumn: `${1 + indent + keyIndex * KEY_SPAN} / span ${KEY_SPAN}`,
              ...getKeyStyle(letter),
              ...pressDepth(letter),
              borderColor: theme.border,
            }}
          >
            {letter}
          </button>
        ));
      })}

      {showKeyboardExtras && (
        <>
          {/* Backspace: the two columns under K and L */}
          <span
            aria-hidden="true"
            title={t.keyBackspace}
            className="rounded-lg md:rounded-xl border-2 flex items-center justify-center overflow-hidden opacity-70"
            style={{ gridRow: 3, gridColumn: '15 / span 4', ...actionKeyStyle }}
          >
            <Icon icon="tabler:backspace" width={18} />
          </span>

          {/* Enter: right of L, under P, spanning both of the lower rows */}
          <span
            aria-hidden="true"
            title={t.keyEnter}
            className="rounded-lg md:rounded-xl border-2 flex items-center justify-center overflow-hidden opacity-70"
            style={{ gridRow: '2 / span 2', gridColumn: '19 / span 2', ...actionKeyStyle }}
          >
            <Icon icon="tabler:corner-down-left" width={18} />
          </span>
        </>
      )}
    </div>
  );
}
