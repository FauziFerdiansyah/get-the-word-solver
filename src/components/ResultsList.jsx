import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

const PAGE_SIZE = 5;

export default function ResultsList({ results, visibleCount, onShowMore, hasSearched }) {
  const { theme } = useTheme();
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
        Tidak ada kata yang cocok. Coba ubah clue atau huruf yang dicoret.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm" style={{ color: theme.textMuted }}>
        Ditemukan <span className="font-extrabold text-base" style={{ color: theme.text }}>{results.length}</span> kata cocok
      </p>
      <ul className="flex flex-col gap-2">
        {visibleResults.map((word) => (
          <li
            key={word}
            className="rounded-xl border-2 px-4 py-2 text-center text-lg font-bold tracking-widest"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.border,
              color: theme.text,
              boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
            }}
          >
            {word}
          </li>
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
          Tampilkan Lainnya
        </button>
      )}
    </div>
  );
}

export { PAGE_SIZE };
