import { useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { playKeySound, playDeleteSound } from '../utils/sound';

const NEXT_STATE = { gray: 'green', green: 'yellow', yellow: 'gray' };

// 6-row board input.
//
// Tiles are fluid so a 6-letter board still fits a 320px phone, and the colour
// control is a 20px chip rather than a 14px dot — a 14px target is below what a
// thumb can reliably hit. Arrow keys cycle the colour too, which keeps the board
// usable from a physical keyboard without hunting for the chip.
export default function BoardGrid({ rows, onLetterChange, onStateToggle }) {
  const { theme, soundEnabled, showHints, t } = useTheme();
  const inputRefs = useRef([]);
  const wordLength = rows[0]?.letters.length || 5;

  const refKey = (row, col) => row * wordLength + col;
  const focusCell = (row, col) => inputRefs.current[refKey(row, col)]?.focus();

  const handleInput = (row, col, rawValue) => {
    const value = rawValue.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const removed = !value && rows[row].letters[col];
    onLetterChange(row, col, value);
    if (!value) {
      if (removed && soundEnabled) playDeleteSound();
      return;
    }
    if (soundEnabled) playKeySound(value);
    if (col < wordLength - 1) focusCell(row, col + 1);
    else if (row < rows.length - 1) focusCell(row + 1, 0);
  };

  const handleKeyDown = (row, col, e) => {
    const state = rows[row].states[col] || 'gray';
    if (e.key === 'Backspace' && !rows[row].letters[col]) {
      if (col > 0) focusCell(row, col - 1);
      else if (row > 0) focusCell(row - 1, wordLength - 1);
      return;
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && rows[row].letters[col]) {
      e.preventDefault();
      onStateToggle(row, col, NEXT_STATE[state] || 'green');
    }
  };

  const cellStyle = (letter, state) => {
    if (!letter) return { backgroundColor: theme.card, color: theme.text, borderColor: theme.border };
    if (state === 'green') return { backgroundColor: theme.green, color: theme.textOnColor, borderColor: theme.border };
    if (state === 'yellow') return { backgroundColor: theme.yellow, color: '#1e293b', borderColor: theme.border };
    return { backgroundColor: theme.disabled, color: '#ffffff', borderColor: theme.border };
  };

  const chipColor = (state) => {
    if (state === 'green') return theme.green;
    if (state === 'yellow') return theme.yellow;
    return theme.disabled;
  };

  const stateName = (state) => {
    if (state === 'green') return t.legendCorrect;
    if (state === 'yellow') return t.legendWrong;
    return t.legendAbsent;
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold" style={{ color: theme.textMuted }}>
        {[
          [theme.green, t.legendCorrect],
          [theme.yellow, t.legendWrong],
          [theme.disabled, t.legendAbsent],
        ].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 rounded-md border shrink-0" style={{ backgroundColor: color, borderColor: theme.border + '60' }} />
            {label}
          </span>
        ))}
      </div>

      <div className="flex w-full max-w-[21rem] flex-col gap-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.letters.map((letter, col) => {
              const state = row.states[col] || 'gray';
              return (
                <div key={col} className="relative flex-1 max-w-11">
                  <input
                    ref={(el) => { inputRefs.current[refKey(rowIndex, col)] = el; }}
                    value={letter}
                    onChange={(e) => handleInput(rowIndex, col, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(rowIndex, col, e)}
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={1}
                    aria-label={`${t.boardRow} ${rowIndex + 1}, ${t.boardCell} ${col + 1}`}
                    className="w-full aspect-square rounded-lg border-2 text-center text-lg font-extrabold uppercase focus:outline-none focus:ring-2 transition-all touch-manipulation"
                    style={{ ...cellStyle(letter, state), boxShadow: `2px 2px 0px 0px ${theme.shadow}`, '--tw-ring-color': theme.border }}
                  />
                  {/* Colour dot sits at the bottom corner of the tile, a little
                      bigger than a pure 14px dot so a thumb can hit it. */}
                  {letter && (
                    <button
                      type="button"
                      onClick={() => onStateToggle(rowIndex, col, NEXT_STATE[state] || 'green')}
                      aria-label={`${t.boardToggle} ${rowIndex + 1}-${col + 1}: ${stateName(state)}`}
                      className="absolute bottom-0 right-0 w-[18px] h-[18px] rounded-full border-2 active:scale-90 transition-transform touch-manipulation"
                      style={{
                        backgroundColor: chipColor(state),
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
        ))}
      </div>

      {showHints && (
        <p className="text-[11px] text-center leading-relaxed max-w-[21rem]" style={{ color: theme.textMuted }}>
          {t.boardHint}
        </p>
      )}
    </div>
  );
}
