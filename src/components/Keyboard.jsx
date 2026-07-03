import { useTheme } from '../contexts/ThemeContext';
import { playKeySound } from '../utils/sound';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export default function Keyboard({ disabledLetters, letterColors, onToggle }) {
  const { theme, soundEnabled } = useTheme();

  const handleToggle = (letter) => {
    if (soundEnabled) playKeySound(letter);
    onToggle(letter);
  };

  const getKeyStyle = (letter) => {
    if (disabledLetters.has(letter)) {
      return { backgroundColor: theme.disabled, color: theme.textOnColor };
    }
    const colorState = letterColors.get(letter);
    if (colorState === 'green') {
      return { backgroundColor: theme.green, color: theme.textOnColor };
    }
    if (colorState === 'yellow') {
      return { backgroundColor: theme.yellow, color: '#1e293b' };
    }
    return { backgroundColor: theme.keyboard, color: theme.text };
  };

  return (
    <div className="flex flex-col gap-1 md:gap-2 select-none">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 md:gap-2">
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleToggle(letter)}
              className="flex-1 max-w-9 md:max-w-14 aspect-square rounded-lg md:rounded-xl border-2 text-xs sm:text-sm md:text-lg font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
              style={{
                ...getKeyStyle(letter),
                borderColor: theme.border,
                boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
