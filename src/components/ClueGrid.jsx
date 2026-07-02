import { useRef, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { playKeySound, playErrorSound } from '../utils/sound';

export default function ClueGrid({ clues, colorStates, onChange, onColorToggle, disabledLetters }) {
  const { theme, soundEnabled, t } = useTheme();
  const inputRefs = useRef([]);
  const [blinkIndex, setBlinkIndex] = useState(null);

  useEffect(() => {
    if (blinkIndex !== null) {
      const timer = setTimeout(() => setBlinkIndex(null), 600);
      return () => clearTimeout(timer);
    }
  }, [blinkIndex]);

  const handleInput = (index, rawValue) => {
    const value = rawValue.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    onChange(index, value);
    if (value && disabledLetters.has(value)) {
      setBlinkIndex(index);
      if (soundEnabled) playErrorSound();
    } else if (value) {
      if (soundEnabled) playKeySound(value);
    }
    if (value && index < clues.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !clues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBoxTap = (index) => {
    const letter = clues[index];
    if (!letter || disabledLetters.has(letter)) return;
    onColorToggle(index);
  };

  const getBoxStyle = (letter, index) => {
    if (!letter) {
      return { backgroundColor: theme.card, color: theme.text, borderColor: theme.border };
    }
    if (disabledLetters.has(letter)) {
      return { backgroundColor: '#fde2e2', color: theme.red, borderColor: theme.red };
    }
    const state = colorStates[index] || 'green';
    if (state === 'yellow') {
      return { backgroundColor: theme.yellow, color: '#1e293b', borderColor: theme.border };
    }
    return { backgroundColor: theme.green, color: theme.textOnColor, borderColor: theme.border };
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Color legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] font-semibold" style={{ color: theme.textMuted }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-md border" style={{ backgroundColor: theme.green, borderColor: theme.border + '60' }} />
          {t.legendCorrect}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-md border" style={{ backgroundColor: theme.yellow, borderColor: theme.border + '60' }} />
          {t.legendWrong}
        </span>
      </div>

      {/* Input boxes */}
      <div className="flex justify-center gap-2">
        {clues.map((letter, index) => {
          const isBlink = blinkIndex === index;
          const boxStyle = getBoxStyle(letter, index);
          return (
            <div key={index} className="relative">
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                value={letter}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputMode="text"
                autoCapitalize="characters"
                maxLength={1}
                aria-label={`Huruf ke-${index + 1}`}
                className={[
                  'aspect-square w-11 sm:w-12 rounded-xl border-2',
                  'text-center text-xl font-extrabold uppercase',
                  'focus:outline-none focus:ring-2 transition-all',
                  isBlink ? 'animate-blink-red' : '',
                ].join(' ')}
                style={{ ...boxStyle, boxShadow: `3px 3px 0px 0px ${theme.shadow}`, '--tw-ring-color': theme.border }}
              />
              {letter && !disabledLetters.has(letter) && (
                <button
                  type="button"
                  onClick={() => handleBoxTap(index)}
                  aria-label={`Ubah warna huruf ke-${index + 1}`}
                  className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 active:scale-90 transition-transform"
                  style={{
                    backgroundColor: (colorStates[index] || 'green') === 'yellow' ? theme.yellow : theme.green,
                    borderColor: theme.border,
                    boxShadow: `1px 1px 0px 0px ${theme.shadow}`,
                    transform: 'translate(25%, 25%)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-center" style={{ color: theme.textMuted }}>
        {t.legendHint}
      </p>
    </div>
  );
}
