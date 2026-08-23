import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

// Phone-only switch between the input panel and the suggestion list. On a phone
// the two panels stack, which meant scrolling past the whole keyboard to read
// the answers and scrolling back to change a clue. Above `lg` both panels are
// side by side, so this disappears.
export default function ViewSwitcher({ view, onSelect, resultCount }) {
  const { theme, t } = useTheme();
  const barRef = useRef(null);

  // The tier tabs in the results list stick directly underneath this bar, so its
  // height is published as a custom property rather than hardcoded — padding and
  // font size differ between breakpoints.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const publish = () => {
      document.documentElement.style.setProperty('--view-switcher-h', `${bar.offsetHeight}px`);
    };
    publish();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(publish) : null;
    observer?.observe(bar);
    return () => observer?.disconnect();
  }, []);

  const views = [
    { id: 'input', icon: 'tabler:forms', label: t.viewInput },
    { id: 'results', icon: 'tabler:list-search', label: t.viewResults, badge: resultCount },
  ];

  return (
    <div
      ref={barRef}
      className="lg:hidden sticky top-0 z-30 -mx-3 mb-1 px-3 py-2 sm:-mx-4 sm:px-4"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="flex gap-2" role="tablist" aria-label={t.viewSwitcher}>
        {views.map(({ id, icon, label, badge }) => {
          const active = view === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
              style={{
                backgroundColor: active ? theme.btnPrimary : theme.card,
                color: active ? '#1e293b' : theme.text,
                borderColor: theme.border,
                boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
                opacity: active ? 1 : 0.75,
              }}
            >
              <Icon icon={icon} width={16} />
              {label}
              {badge > 0 && (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? theme.card : theme.keyboard,
                    color: theme.text,
                  }}
                >
                  {badge > 999 ? '999+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
