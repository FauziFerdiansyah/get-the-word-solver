import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import { getDefinition } from '../utils/dictionary';

const PAGE_SIZE = 5;

function WordItem({ word, showDefinition, lang, category }) {
  const { theme, t } = useTheme();
  const [def, setDef] = useState(null);

  useEffect(() => {
    if (!showDefinition) return;
    let cancelled = false;
    const fetchDef = async () => {
      const result = await getDefinition(word, lang);
      if (!cancelled) {
        setDef(result);
      }
    };
    fetchDef();
    return () => { cancelled = true; };
  }, [word, showDefinition, lang]);

  const displayDef = showDefinition ? def : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(word).then(() => {
      gooeyToast(`"${word}" ${t.copied}`, { duration: 1000 });
    });
  };

  // Determine indicator color based on category
  const getIndicatorStyle = () => {
    if (category === 'common') {
      return { backgroundColor: theme.btnPrimary, opacity: 0.3 };
    } else if (category === 'rare') {
      return { backgroundColor: theme.btnSecondary, opacity: 0.3 };
    }
    return { backgroundColor: 'transparent' };
  };

  return (
    <li
      className="rounded-xl border-2 px-4 py-3 flex flex-col gap-1 relative"
      style={{
        backgroundColor: theme.accent,
        borderColor: theme.border,
        boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
      }}
    >
      {/* Category indicator (subtle dot on top-right) */}
      {category !== 'all' && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={getIndicatorStyle()}
          title={category === 'common' ? 'Umum' : 'Jarang'}
        />
      )}
      
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

export default function ResultsList({ results, visibleCount, onShowMore, hasSearched, showDefinition, category, onCategoryChange }) {
  const { theme, t, lang } = useTheme();
  
  // Get current category results
  let currentResults = [];
  if (category === 'all') {
    currentResults = [...(results.common || []), ...(results.rare || [])];
  } else {
    currentResults = results[category] || [];
  }
  
  const totalResults = (results.common?.length || 0) + (results.rare?.length || 0);
  const visibleResults = currentResults.slice(0, visibleCount);
  const hasMore = visibleCount < currentResults.length;

  if (!hasSearched) {
    return null;
  }

  if (totalResults === 0) {
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
    const wordsToCopy = currentResults.slice(0, max);
    const text = wordsToCopy.map(w => `- ${w}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      if (currentResults.length > max) {
        gooeyToast(`${t.copiedMax} ${currentResults.length} ${t.words}.`, { duration: 2000 });
      } else {
        gooeyToast(`${t.copiedAll}`, { duration: 1500 });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {t.found} <span className="font-extrabold text-base" style={{ color: theme.text }}>{totalResults}</span> {t.matchWords}
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
      
      {/* Category Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onCategoryChange('common')}
          className="flex-1 rounded-lg border-2 py-2 text-sm font-bold transition-all active:scale-95"
          style={{
            backgroundColor: category === 'common' ? theme.btnPrimary : theme.card,
            borderColor: theme.border,
            color: category === 'common' ? '#1e293b' : theme.text,
            boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
          }}
        >
          {lang === 'id' ? 'Umum' : 'Common'} ({results.common?.length || 0})
        </button>
        <button
          onClick={() => onCategoryChange('rare')}
          className="flex-1 rounded-lg border-2 py-2 text-sm font-bold transition-all active:scale-95"
          style={{
            backgroundColor: category === 'rare' ? theme.btnSecondary : theme.card,
            borderColor: theme.border,
            color: category === 'rare' ? '#1e293b' : theme.text,
            boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
          }}
        >
          {lang === 'id' ? 'Jarang' : 'Rare'} ({results.rare?.length || 0})
        </button>
      </div>
      
      <ul className="flex flex-col gap-2">
        {visibleResults.map((word) => {
          // Determine if word is common or rare
          const wordCategory = (results.common || []).includes(word) ? 'common' : 'rare';
          return (
            <WordItem 
              key={word} 
              word={word} 
              showDefinition={showDefinition} 
              lang={lang}
              category={wordCategory}
            />
          );
        })}
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
