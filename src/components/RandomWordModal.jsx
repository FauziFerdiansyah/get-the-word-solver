import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { gooeyToast } from 'goey-toast';

export default function RandomWordModal({ open, onClose, words, wordLength }) {
  const { theme, t } = useTheme();
  const [displayWord, setDisplayWord] = useState('');
  const [shuffling, setShuffling] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const openedRef = useRef(false);
  const wordsRef = useRef([]);
  const onCloseRef = useRef(onClose);

  // Keep refs updated
  onCloseRef.current = onClose;
  wordsRef.current = (words || []).filter(w => w.length === wordLength);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      setDisplayWord('');
      setShuffling(false);
      return;
    }

    const validWords = wordsRef.current;
    if (validWords.length === 0) return;

    // Only start shuffling once per open
    if (openedRef.current) return;
    openedRef.current = true;

    let count = 0;
    const maxShuffles = 15;
    setShuffling(true);

    intervalRef.current = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * validWords.length);
      setDisplayWord(validWords[randomIdx]);
      count++;
      if (count >= maxShuffles) {
        clearInterval(intervalRef.current);
        const finalIdx = Math.floor(Math.random() * validWords.length);
        setDisplayWord(validWords[finalIdx]);
        setShuffling(false);
      }
    }, 80);

    // Auto-close after 8 seconds
    timeoutRef.current = setTimeout(() => {
      onCloseRef.current();
    }, 8000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [open]);

  const handleCopy = useCallback(() => {
    if (!displayWord || shuffling) return;
    navigator.clipboard.writeText(displayWord).then(() => {
      gooeyToast(`📋 "${displayWord}" ${t.copied}`, { duration: 1500 });
    }).catch(() => {
      gooeyToast('❌ Failed to copy', { duration: 1500 });
    });
  }, [displayWord, shuffling, t.copied]);

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

        {/* Copy button - visible when not shuffling */}
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
            📋 Salin Kata
          </button>
        )}

        {/* Countdown bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.keyboard }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: theme.green,
              animation: 'shrink 8s linear forwards',
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
