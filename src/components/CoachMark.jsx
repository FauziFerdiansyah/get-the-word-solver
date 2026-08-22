import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

// Each step carries its own icon in src/data/i18n.js. It used to come from a
// separate ICONS array here, which silently ran out when steps were added — the
// last three steps all fell back to a generic info icon.
export default function CoachMark({ open, onClose }) {
  const [step, setStep] = useState(0);
  const { theme, t } = useTheme();

  const steps = t.coach;
  const isLast = step === steps.length - 1;

  const close = () => {
    setStep(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, steps.length]);

  if (!open) return null;

  const current = steps[step];

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t.help}
    >
      <div
        className="w-full h-full flex flex-col overflow-y-auto p-4 sm:h-auto sm:max-h-[88vh] sm:max-w-sm sm:rounded-xl sm:border-2 sm:p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar, same shape as the settings sheet */}
        <div
          className="flex items-center justify-between gap-3 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-3 mb-4 border-b-2"
          style={{ borderColor: theme.border }}
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: theme.text }}>
            <span
              className="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent, borderColor: theme.border }}
            >
              <Icon icon="tabler:help" width={18} style={{ color: theme.text }} />
            </span>
            {t.help}
          </h2>
          <span
            className="ml-auto text-[11px] font-bold px-2 py-1 rounded-lg shrink-0"
            style={{ backgroundColor: theme.keyboard, color: theme.textMuted }}
          >
            {step + 1}/{steps.length}
          </span>
          <button
            onClick={close}
            aria-label={t.close}
            className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
            style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `2px 2px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon="tabler:x" width={18} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Step */}
        <div className="flex-1 flex flex-col gap-3">
          <span
            className="w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0"
            style={{ backgroundColor: theme.accent, borderColor: theme.border, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon={current.icon} width={28} style={{ color: theme.text }} />
          </span>
          <h3 className="text-lg font-extrabold leading-snug" style={{ color: theme.text }}>
            {current.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            {current.desc}
          </p>
        </div>

        {/* Progress — tappable, so a step can be revisited without cycling */}
        <div className="flex items-center gap-1.5 mt-5" role="tablist" aria-label={t.coachProgress}>
          {steps.map((s, i) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={i === step}
              aria-label={`${i + 1}. ${s.title}`}
              onClick={() => setStep(i)}
              className="h-2 rounded-full transition-all touch-manipulation"
              style={{
                flex: i === step ? '2 1 0%' : '1 1 0%',
                backgroundColor: i === step ? theme.green : theme.border + '33',
              }}
            />
          ))}
        </div>

        {/* Buttons keep their places: hiding "back" on step 1 shifted "next". */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] disabled:opacity-40 touch-manipulation"
            style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text, boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            <Icon icon="tabler:chevron-left" width={16} />
            {t.coachBack}
          </button>
          <button
            onClick={() => (isLast ? close() : setStep((s) => s + 1))}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
            style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
          >
            {isLast ? t.coachDone : t.coachNext}
            <Icon icon={isLast ? 'tabler:check' : 'tabler:chevron-right'} width={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
