import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import { getDefinition } from '../utils/dictionary';

const PAGE_SIZE = 5;

function WordItem({ word, showDefinition }) {
  const { theme } = useTheme();
  const [def, setDef] = useState(null);

  useEffect(() => {
    if (!showDefinition) return;
    let cancelled = false;
    const fetchDef = async () => {
      const result = await getDefinition(word);
      if (!cancelled) {
        setDef(result);
      }
    };
    fetchDef();
    return () => { cancelled = true; };
  }, [word, showDefinition]);

  const displayDef = showDefinition ? def : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(word).then(() => {
      gooeyToast(`"${word}" disalin`, { duration: 1000 });
    });
  };

  return (
    <li
      className="rounded-xl border-2 px-4 py-3 flex flex-col gap-1"
      style={{
        backgroundColor: theme.accent,
        borderColor: theme.border,
        boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-widest" style={{ color: theme.text }}>
          {word}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg border active:scale-90 transition-transform"
          style={{ borderColor: theme.border + '60' }}
          aria-label={`Salin ${word}`}
        >
          <Icon icon="tabler:copy" width={16} style={{ color: theme.textMuted }} />
        </button>
      </div>
      {showDefinition && displayDef && (
        <div className="mt-1">
          {displayDef.phonetic && (
            <span className="text-xs italic mr-2" style={{ color: theme.textMuted }}>
              {displayDef.phonetic}
            </span>
          )}
          {displayDef.partOfSpeech && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.keyboard, color: theme.text }}>
              {displayDef.partOfSpeech}
            </span>
          )}
          {displayDef.definition && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
              {displayDef.definition}
            </p>
          )}
        </div>
      )}
      {showDefinition && !displayDef && !def && (
        <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Loading...</p>
      )}
    </li>
  );
}

export default function ResultsList({ results, visibleCount, onShowMore, hasSearched, showDefinition }) {
  const { theme, t } = useTheme();
  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div
        className="rounded-xl border-2 p-4 text-center text-sm font-semibold"
        style={{ backgroundColor: '#fce8e8', borderColor: theme.border, color: theme.text, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
      >
        {t.noMatch}
      </div>
    );
  }

  const handleCopyAll = () => {
    const max = 20;
    const wordsToCopy = results.slice(0, max);
    const text = wordsToCopy.map(w => `- ${w}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      if (results.length > max) {
        gooeyToast(`Disalin ${max} kata (maksimal). Total ada ${results.length} kata.`, { duration: 2000 });
      } else {
        gooeyToast(`Disalin ${wordsToCopy.length} kata`, { duration: 1500 });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {t.found} <span className="font-extrabold text-base" style={{ color: theme.text }}>{results.length}</span> {t.matchWords}
        </p>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-xs font-bold active:scale-95 transition-transform"
          style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
        >
          <Icon icon="tabler:clipboard-list" width={14} />
          {t.copyAll}
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {visibleResults.map((word) => (
          <WordItem key={word} word={word} showDefinition={showDefinition} />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
          style={{
            backgroundColor: theme.btnPrimary,
            borderColor: theme.border,
            color: '#1e293b',
            boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
          }}
        >
          <Icon icon="tabler:chevrons-down" width={18} />
          {t.showMore}
        </button>
      )}
    </div>
  );
}

export { PAGE_SIZE };
