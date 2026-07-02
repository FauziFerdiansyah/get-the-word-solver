import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';

const ICONS = [
  'tabler:hash', 'tabler:forms', 'tabler:keyboard', 'tabler:search',
  'tabler:clipboard-list', 'tabler:book', 'tabler:device-mobile-plus', 'tabler:settings',
];

export default function CoachMark({ open, onClose }) {
  const [step, setStep] = useState(0);
  const { theme, t } = useTheme();

  if (!open) return null;

  const steps = t.coach;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) { setStep(0); onClose(); } else { setStep(step + 1); }
  };
  const handlePrev = () => { if (step > 0) setStep(step - 1); };
  const handleClose = () => { setStep(0); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-xs rounded-xl border-2 p-5"
        style={{ backgroundColor: theme.card, borderColor: theme.border, boxShadow: `4px 4px 0px 0px ${theme.shadow}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: i === step ? theme.green : theme.border + '40' }} />
            ))}
          </div>
          <span className="text-[10px] font-bold" style={{ color: theme.textMuted }}>{step + 1}/{steps.length}</span>
          <button onClick={handleClose} className="p-1 active:scale-90 transition-transform">
            <Icon icon="tabler:x" width={18} style={{ color: theme.textMuted }} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2" style={{ backgroundColor: theme.accent, borderColor: theme.border }}>
            <Icon icon={ICONS[step] || 'tabler:info-circle'} width={24} style={{ color: theme.text }} />
          </div>
          <h3 className="text-base font-extrabold" style={{ color: theme.text }}>{current.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>{current.desc}</p>
        </div>

        <div className="flex gap-2 mt-4">
          {step > 0 && (
            <button onClick={handlePrev} className="flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95" style={{ borderColor: theme.border, color: theme.text }}>
              ←
            </button>
          )}
          <button onClick={handleNext} className="flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95" style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b' }}>
            {isLast ? '✓' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
