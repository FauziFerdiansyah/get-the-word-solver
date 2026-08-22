import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import InstallGuideModal from './InstallGuideModal';

// Android/Chrome fires `beforeinstallprompt` when the app qualifies for
// installation; holding on to that event lets us offer a real install button
// instead of hoping the user finds the browser menu. iOS never fires it, so
// there the button falls back to a short instruction.
// Already running as an installed app? Then there is nothing to offer.
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches === true ||
  window.navigator.standalone === true;

export default function InstallButton() {
  const { theme, t } = useTheme();
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showGuide, setShowGuide] = useState(false);

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

  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports itself as a Mac, so touch support is the giveaway.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== 'undefined' && navigator.maxTouchPoints > 1);
  // Every iOS browser is WebKit; only the real Safari UA lacks these markers.
  const isIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  if (installed) return null;
  // Nothing to offer on a desktop browser that never signalled installability.
  if (!promptEvent && !isIOS) return null;

  const handleClick = async () => {
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setPromptEvent(null);
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

      {showGuide && (
        <InstallGuideModal
          variant={isIOSSafari ? 'ios-safari' : isIOS ? 'ios-other' : 'desktop'}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  );
}
