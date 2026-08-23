import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import { CHANGELOG } from '../data/changelog';

const SECTION_ICONS = {
  Added: 'tabler:plus',
  Changed: 'tabler:refresh',
  Fixed: 'tabler:bug',
  'Changed (breaking)': 'tabler:alert-triangle',
};

export default function ChangelogModal({ onClose }) {
  const { theme, t } = useTheme();
  const current = __APP_VERSION__;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.changelog}
    >
      <div
        className="w-full h-full flex flex-col overflow-y-auto p-4 sm:h-auto sm:max-h-[88vh] sm:max-w-md sm:rounded-xl sm:border-2 sm:p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-3 mb-4 border-b-2 sticky -top-4 sm:-top-5 z-10"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: theme.text }}>
            <span
              className="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent, borderColor: theme.border }}
            >
              <Icon icon="tabler:history" width={18} style={{ color: theme.text }} />
            </span>
            {t.changelog}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
            style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon="tabler:x" width={18} style={{ color: theme.text }} />
          </button>
        </div>

        <ol className="flex flex-col gap-4">
          {CHANGELOG.map((entry) => (
            <li key={entry.version} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-extrabold px-2 py-1 rounded-lg border-2"
                  style={{
                    backgroundColor: entry.version === current ? theme.btnPrimary : theme.keyboard,
                    borderColor: theme.border,
                    color: entry.version === current ? '#1e293b' : theme.text,
                  }}
                >
                  v{entry.version}
                </span>
                {entry.version === current && (
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.green }}>
                    {t.changelogCurrent}
                  </span>
                )}
                {entry.date && (
                  <span className="text-[11px] ml-auto" style={{ color: theme.textMuted }}>
                    {entry.date}
                  </span>
                )}
              </div>

              {entry.sections.map((section, i) => (
                <div key={section.title || i} className="flex flex-col gap-1">
                  {section.title && (
                    <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                      <Icon icon={SECTION_ICONS[section.title] || 'tabler:point'} width={12} />
                      {section.title}
                    </span>
                  )}
                  <ul className="flex flex-col gap-1 pl-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-xs leading-relaxed flex gap-1.5" style={{ color: theme.text }}>
                        <span style={{ color: theme.textMuted }}>·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
