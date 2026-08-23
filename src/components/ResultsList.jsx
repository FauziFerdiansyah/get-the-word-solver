import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';
import { getDefinition, getCachedDefinition } from '../utils/dictionary';

const PAGE_SIZE = 10;
const COPY_LIMIT = 20;

function WordItem({ word, order, showDefinition, lang, tier }) {
  const { theme, t } = useTheme();
  // Seeded from the cache so a word that already has a definition renders it on
  // the first paint. Without this, remounting a word (which is what switching
  // result tabs does) painted it with no definition and then grew once the
  // promise resolved — read as flicker.
  const [def, setDef] = useState(() => getCachedDefinition(word, lang) ?? null);

  useEffect(() => {
    if (!showDefinition) return undefined;
    let cancelled = false;
    getDefinition(word, lang).then((result) => {
      if (!cancelled) setDef(result);
    });
    return () => { cancelled = true; };
  }, [word, showDefinition, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(word).then(() => {
      gooeyToast(`"${word}" ${t.copied}`, { duration: 1000 });
    });
  };

  return (
    <li
      className="rounded-xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-1"
      style={{
        backgroundColor: theme.accent,
        borderColor: theme.border,
        boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: theme.keyboard, color: theme.textMuted }}
          title={t.rankHint}
        >
          #{order}
        </span>
        <span className="text-lg font-bold tracking-widest truncate" style={{ color: theme.text }}>
          {word}
        </span>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: tier === 'common' ? theme.green : theme.yellow,
            color: tier === 'common' ? theme.textOnColor : '#1e293b',
          }}
        >
          {tier === 'common' ? t.tierCommon : t.tierRare}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 -mr-1 rounded-lg active:scale-90 transition-transform shrink-0 touch-manipulation"
          aria-label={`${t.copyWord} ${word}`}
        >
          <Icon icon="tabler:copy" width={16} style={{ color: theme.textMuted }} />
        </button>
      </div>
      {showDefinition && def && (
        <div>
          {def.phonetic && (
            <span className="text-xs italic mr-2" style={{ color: theme.textMuted }}>
              {def.phonetic}
            </span>
          )}
          {def.partOfSpeech && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.keyboard, color: theme.text }}>
              {def.partOfSpeech}
            </span>
          )}
          {def.definition && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
              {def.definition}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function ResultsList({
  results,
  visibleCount,
  onShowMore,
  hasSearched,
  showDefinition,
  category,
  conflicts = [],
  onCategoryChange,
}) {
  const { theme, t, lang, showHints } = useTheme();

  const common = results.common || [];
  const rare = results.rare || [];
  // Set lookup keeps tier tagging O(1) per row instead of scanning the whole
  // common list for every visible word.
  const commonSet = useMemo(() => new Set(results.common || []), [results.common]);

  const currentResults = category === 'common' ? common : category === 'rare' ? rare : [...common, ...rare];
  const totalResults = common.length + rare.length;
  const visibleResults = currentResults.slice(0, visibleCount);
  const hasMore = visibleCount < currentResults.length;

  if (!hasSearched) return null;

  if (totalResults === 0) {
    return (
      <div
        className="rounded-xl border-2 p-4 flex items-center gap-3 text-sm font-semibold"
        style={{
          backgroundColor: theme.accent2,
          borderColor: theme.red,
          color: theme.text,
          boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
        }}
      >
        <Icon icon="tabler:mood-empty" width={22} style={{ color: theme.red }} className="shrink-0" />
        <span>
          {conflicts.length > 0
            ? `${conflicts.join(', ')} ${t.conflictLetters}`
            : t.noMatch}
        </span>
      </div>
    );
  }

  const handleCopyAll = () => {
    const wordsToCopy = currentResults.slice(0, COPY_LIMIT);
    const text = wordsToCopy.map((w) => `- ${w}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      if (currentResults.length > COPY_LIMIT) {
        gooeyToast(`${t.copiedMax} ${currentResults.length} ${t.words}.`, { duration: 2000 });
      } else {
        gooeyToast(`${t.copiedAll}`, { duration: 1500 });
      }
    });
  };

  const TABS = [
    { id: 'all', label: t.tierAll, count: totalResults, color: theme.card },
    { id: 'common', label: t.tierCommon, count: common.length, color: theme.btnPrimary },
    { id: 'rare', label: t.tierRare, count: rare.length, color: theme.btnSecondary },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {t.found}{' '}
          <span className="font-extrabold text-base" style={{ color: theme.text }}>{totalResults}</span>{' '}
          {t.matchWords}
          {showHints && <span className="block text-[11px] leading-snug">{t.rankHint}</span>}
        </p>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 text-xs font-bold active:scale-95 transition-transform shrink-0 touch-manipulation"
          style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.card, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
        >
          <Icon icon="tabler:clipboard-list" width={14} />
          {t.copyAll}
        </button>
      </div>

      {/* Tier tabs — 'all' is the default, so it needs to be selectable too */}
      <div className="flex gap-1.5" role="tablist">
        {TABS.map(({ id, label, count, color }) => {
          const active = category === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onCategoryChange(id)}
              className="flex-1 rounded-lg border-2 py-2 px-1 text-xs sm:text-sm font-bold transition-colors touch-manipulation"
              style={{
                backgroundColor: active ? color : theme.card,
                borderColor: theme.border,
                color: active && id !== 'all' ? '#1e293b' : theme.text,
                boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
                opacity: active ? 1 : 0.6,
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-2">
        {visibleResults.map((word, index) => (
          <WordItem
            key={word}
            word={word}
            order={index + 1}
            showDefinition={showDefinition}
            lang={lang}
            tier={commonSet.has(word) ? 'common' : 'rare'}
          />
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
          style={{
            backgroundColor: theme.btnPrimary,
            borderColor: theme.border,
            color: '#1e293b',
            boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
          }}
        >
          <Icon icon="tabler:chevrons-down" width={18} />
          {t.showMore} ({currentResults.length - visibleCount})
        </button>
      )}
    </div>
  );
}

export { PAGE_SIZE };
