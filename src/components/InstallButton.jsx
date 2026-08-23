import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import InstallGuideModal from './InstallGuideModal';
import { isStandalone, isIOS as detectIOS, isIOSSafari as detectIOSSafari } from '../utils/platform';
import InstallProgressModal from './InstallProgressModal';

// Android/Chrome fires `beforeinstallprompt` when the app qualifies for
// installation; holding on to that event lets us offer a real install button
// instead of hoping the user finds the browser menu. iOS never fires it, so
// there the button falls back to a short instruction.
export default function InstallButton() {
  const { theme, t } = useTheme();
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showGuide, setShowGuide] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS = detectIOS();
  const isIOSSafari = detectIOSSafari();

  // Both guards have to let the progress overlay through: accepting the prompt
  // clears promptEvent, which used to unmount this component — and the overlay
  // with it — the instant the install was approved.
  if (installed && !showProgress) return null;
  // Nothing to offer on a desktop browser that never signalled installability.
  if (!promptEvent && !isIOS && !showProgress) return null;

  const handleClick = async () => {
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setPromptEvent(null);
      if (outcome === 'accepted') {
        // The OS gives no progress for the install itself, so this shows the one
        // thing that does have a measurable size: filling the offline cache.
        setShowProgress(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold transition-all active:translate-x-[1.5px] active:translate-y-[1.5px] touch-manipulation"
        style={{
          backgroundColor: theme.accent,
          borderColor: theme.border,
          color: theme.text,
          boxShadow: `3px 3px 0px 0px ${theme.shadow}`,
        }}
      >
        <Icon icon="tabler:device-mobile-down" width={18} />
        {t.installApp}
      </button>

      {showProgress && (
        <InstallProgressModal
          onClose={() => {
            setShowProgress(false);
            setInstalled(true);
          }}
        />
      )}

      {showGuide && (
        <InstallGuideModal
          variant={isIOSSafari ? 'ios-safari' : isIOS ? 'ios-other' : 'desktop'}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  );
}
