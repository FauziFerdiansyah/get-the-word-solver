import { useTheme } from '../contexts/ThemeContext';

export default function ConfirmModal({ open, message, onConfirm, onCancel }) {
  const { theme, t } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-xs rounded-xl border-2 p-5"
        style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `4px 4px 0px 0px ${theme.shadow}` }}
      >
        <p className="mb-4 text-center text-sm font-semibold" style={{ color: theme.text }}>
          {message}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px]"
            style={{ backgroundColor: theme.red, borderColor: theme.border, color: '#ffffff', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            {t.yesReset}
          </button>
        </div>
      </div>
    </div>
  );
}
