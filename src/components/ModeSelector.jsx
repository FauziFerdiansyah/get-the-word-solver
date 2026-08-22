import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

const MODES = [
  { id: 'single', icon: 'tabler:layout-columns', labelKey: 'modeSingle' },
  { id: 'board', icon: 'tabler:layout-grid', labelKey: 'modeBoard' },
];

export default function ModeSelector({ mode, onSelect }) {
  const { theme, t } = useTheme();

  return (
    <div className="flex gap-2 justify-center select-none">
      {MODES.map(({ id, icon, labelKey }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
            style={{
              backgroundColor: active ? theme.btnSecondary : theme.card,
              color: active ? '#1e293b' : theme.text,
              borderColor: theme.border,
              boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
            }}
          >
            <Icon icon={icon} width={16} />
            {t[labelKey]}
          </button>
        );
      })}
    </div>
  );
}
