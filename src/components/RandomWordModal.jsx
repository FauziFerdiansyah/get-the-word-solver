import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { gooeyToast } from 'goey-toast';

const SHUFFLE_STEPS = 15;
const SHUFFLE_INTERVAL = 80;
const AUTO_CLOSE_MS = 8000;

// Mounted only while open, so every appearance starts a fresh draw.
// `words` is expected to be the top-ranked slice for the level, which keeps the
// draw on words that actually turn up in the game.
export default function RandomWordModal({ onClose, words, wordLength, fromResults = false }) {
  const { theme, t } = useTheme();
  const pool = useMemo(
    () => (words || []).filter((w) => w.length === wordLength),
    [words, wordLength]
  );
  const [displayWord, setDisplayWord] = useState(() => pool[0] || '');
  const [shuffling, setShuffling] = useState(pool.length > 0);

  useEffect(() => {
    if (pool.length === 0) return undefined;
    const pick = () => pool[Math.floor(Math.random() * pool.length)];

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setDisplayWord(pick());
      if (step >= SHUFFLE_STEPS) {
        clearInterval(interval);
        setShuffling(false);
      }
    }, SHUFFLE_INTERVAL);

    const timeout = setTimeout(() => onClose(), AUTO_CLOSE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // onClose is stable enough here: the modal unmounts as soon as it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const handleCopy = useCallback(() => {
    if (!displayWord || shuffling) return;
    navigator.clipboard
      .writeText(displayWord)
      .then(() => {
        gooeyToast.success(`"${displayWord}" ${t.copied}`, { duration: 2500 });
      })
      .catch(() => {
        gooeyToast.error(t.copyFailed, { duration: 3000 });
      });
  }, [displayWord, shuffling, t.copied, t.copyFailed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      {/* As wide as the input section: at max-w-xs a 6-letter word left the
          tiles squeezed against the padding. */}
      <div
        className="w-full max-w-sm rounded-xl border-2 p-4 sm:p-6 flex flex-col items-center gap-4"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold" style={{ color: theme.textMuted }}>
          🎲 {t.randomTitle}
        </h3>

        <div className="flex w-full justify-center gap-2" style={{ minHeight: '64px' }}>
          {displayWord.split('').map((letter, i) => (
            <span
              key={i}
              className="flex-1 max-w-12 aspect-square rounded-xl border-2 flex items-center justify-center text-xl sm:text-2xl font-extrabold transition-all"
              style={{
                backgroundColor: shuffling ? theme.keyboard : theme.green,
                color: shuffling ? theme.text : theme.textOnColor,
                borderColor: theme.border,
                boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
                animation: shuffling ? `shuffle-bounce 0.15s ease-in-out ${i * 30}ms infinite alternate` : 'none',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {!shuffling && displayWord && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs font-bold transition-all active:scale-95"
            style={{
              backgroundColor: theme.keyboard,
              borderColor: theme.border,
              color: theme.text,
              boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
            }}
          >
            📋 {t.copyWord}
          </button>
        )}

        {/* Countdown bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.keyboard }}>
          <div
            className="h-full rounded-full"
            style={{ backgroundColor: theme.green, animation: 'shrink 8s linear forwards' }}
          />
        </div>

        <p className="text-[10px] text-center" style={{ color: theme.textMuted }}>
          {shuffling ? '🎲 ...' : fromResults ? t.randomFromResults : t.randomHint}
        </p>
      </div>
    </div>
  );
}
