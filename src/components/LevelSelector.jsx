import { useTheme } from '../contexts/ThemeContext';

const LEVELS = [4, 5, 6];

export default function LevelSelector({ wordLength, onSelect }) {
  const { theme } = useTheme();

  return (
    <div className="flex gap-2 justify-center select-none">
      {LEVELS.map((len) => {
        const active = len === wordLength;
        return (
          <button
            key={len}
            type="button"
            onClick={() => onSelect(len)}
            className="flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
            style={{
              backgroundColor: active ? theme.btnPrimary : theme.card,
              color: active ? '#1e293b' : theme.text,
              borderColor: theme.border,
              boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
            }}
          >
            {len} Huruf
          </button>
        );
      })}
    </div>
  );
}
