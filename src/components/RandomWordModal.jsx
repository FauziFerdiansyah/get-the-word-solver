import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function RandomWordModal({ open, onClose, words }) {
  const { theme, t } = useTheme();
  const [displayWord, setDisplayWord] = useState('');
  const [shuffling, setShuffling] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!open || !words || words.length === 0) {
      openedRef.current = false;
      return;
    }

    // Only start shuffling once per open
    if (openedRef.current) return;
    openedRef.current = true;

    let count = 0;
    const maxShuffles = 15;
    setShuffling(true);

    intervalRef.current = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * words.length);
      setDisplayWord(words[randomIdx]);
      count++;
      if (count >= maxShuffles) {
        clearInterval(intervalRef.current);
        const finalIdx = Math.floor(Math.random() * words.length);
        setDisplayWord(words[finalIdx]);
        setShuffling(false);
      }
    }, 80);

    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [open, words, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-xl border-2 p-6 flex flex-col items-center gap-4"
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

        <div className="flex justify-center gap-1.5" style={{ minHeight: '56px' }}>
          {displayWord.split('').map((letter, i) => (
            <span
              key={i}
              className="w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-extrabold transition-all"
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

        {/* Countdown bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.keyboard }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: theme.green,
              animation: 'shrink 5s linear forwards',
            }}
          />
        </div>

        <p className="text-[10px]" style={{ color: theme.textMuted }}>
          {shuffling ? '🎲 ...' : '✨'}
        </p>
      </div>
    </div>
  );
}
