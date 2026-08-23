import { Icon } from '@iconify/react';
import { gooeyToast } from 'goey-toast';
import { useTheme } from '../contexts/ThemeContext';

// iOS never fires `beforeinstallprompt`, so there is no one-tap install to offer.
// Adding to the home screen there is a manual sequence, and telling the user
// "use the browser menu" is not enough — this spells the steps out.
//
// `variant` picks which sequence to show:
//   ios-safari  — Safari on iPhone/iPad: Share → Add to Home Screen
//   ios-other   — Chrome/Firefox on iOS: they can do it from iOS 16.4, but the
//                 Share sheet lives in a different place, so Safari is suggested
//   desktop     — a browser that never reported installability
export default function InstallGuideModal({ variant, onClose }) {
  const { theme, t } = useTheme();
  const guide = t.installGuide[variant] || t.installGuide['ios-safari'];

  const copyAddress = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => gooeyToast.success(t.installAddressCopied, { duration: 2800 }))
      .catch(() => gooeyToast.error(window.location.href, { duration: 5000 }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.installApp}
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
        <div
          className="flex items-center justify-between gap-3 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-3 mb-4 border-b-2"
          style={{ borderColor: theme.border }}
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: theme.text }}>
            <span
              className="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent, borderColor: theme.border }}
            >
              <Icon icon="tabler:device-mobile-down" width={18} style={{ color: theme.text }} />
            </span>
            {t.installApp}
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

        <p className="text-sm mb-4 leading-relaxed" style={{ color: theme.textMuted }}>
          {guide.intro}
        </p>

        <ol className="flex flex-col gap-3">
          {guide.steps.map((step, i) => (
            <li key={step.text} className="flex items-start gap-3">
              <span
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 text-xs font-extrabold"
                style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b' }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm leading-relaxed pt-0.5" style={{ color: theme.text }}>
                {step.text}
              </span>
              {/* Only the copy step is actionable; the rest are plain icons. */}
              {step.copy ? (
                <button
                  type="button"
                  onClick={copyAddress}
                  aria-label={t.installCopyAddress}
                  className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 active:scale-90 transition-transform touch-manipulation"
                  style={{
                    backgroundColor: theme.btnPrimary,
                    borderColor: theme.border,
                    boxShadow: `2px 2px 0px 0px ${theme.shadow}`,
                  }}
                >
                  <Icon icon={step.icon} width={20} style={{ color: '#1e293b' }} />
                </button>
              ) : (
                <span
                  className="w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: theme.accent, borderColor: theme.border }}
                >
                  <Icon icon={step.icon} width={20} style={{ color: theme.text }} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: theme.textMuted }}>
          {guide.note}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 py-3 rounded-xl border-2 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
          style={{ backgroundColor: theme.btnPrimary, borderColor: theme.border, color: '#1e293b', boxShadow: `3px 3px 0px 0px ${theme.shadow}` }}
        >
          {t.coachDone}
        </button>
      </div>
    </div>
  );
}
