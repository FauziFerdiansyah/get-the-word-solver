import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import { playTestSound, getAudioState } from '../utils/sound';
import { THEMES } from '../data/themes';
import { gooeyToast } from 'goey-toast';

const themeKeys = Object.keys(THEMES);

export default function SettingsModal({ open, onClose }) {
  const {
    theme, themeName, setThemeName, darkMode, setDarkMode,
    soundEnabled, setSoundEnabled, showDefinition, setShowDefinition,
    showKeyboardExtras, setShowKeyboardExtras,
    multiExcluded, setMultiExcluded, lang, setLang, t,
  } = useTheme();

  if (!open) return null;

  const handleThemeChange = (key) => {
    setThemeName(key);
    gooeyToast(`${THEMES[key].name} ✓`, { duration: 1500 });
  };

  const handleDarkToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    gooeyToast(next ? 'Dark mode ✓' : 'Light mode ✓', { duration: 1500 });
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    gooeyToast(next ? '🔊 ON' : '🔇 OFF', { duration: 1500 });
  };

  const handleDefToggle = () => {
    const next = !showDefinition;
    setShowDefinition(next);
    gooeyToast(next ? '📖 ON' : '📖 OFF', { duration: 1500 });
  };

  // Reports what the audio engine is actually doing, so "no sound" can be told
  // apart from "browser never started the audio context".
  const handleTestSound = () => {
    playTestSound();
    setTimeout(() => {
      const state = getAudioState();
      gooeyToast(state === 'running' ? '🔊 ✓' : `🔇 audio: ${state}`, { duration: 2000 });
    }, 300);
  };

  const handleMultiExcludedToggle = () => {
    const next = !multiExcluded;
    setMultiExcluded(next);
    gooeyToast(next ? `✓ ${t.multiExcluded}` : `✕ ${t.multiExcluded}`, { duration: 1500 });
  };

  const handleKeyboardExtrasToggle = () => {
    const next = !showKeyboardExtras;
    setShowKeyboardExtras(next);
    gooeyToast(next ? '⌨️ ON' : '⌨️ OFF', { duration: 1500 });
  };

  const handleLangSelect = (newLang) => {
    if (lang !== newLang) {
      setLang(newLang);
      gooeyToast(newLang === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English', { duration: 1500 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 sm:items-center sm:justify-center sm:px-4" onClick={onClose}>
      {/* Full screen on a phone: a settings sheet squeezed into a small centred
          card meant constant scrolling inside a scrolling page. */}
      <div
        className="w-full h-full overflow-y-auto p-4 sm:h-auto sm:max-h-[88vh] sm:max-w-sm sm:rounded-xl sm:border-2 sm:p-5"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky so the close button stays reachable in the full screen sheet */}
        <div
          className="flex items-center justify-between mb-4 sticky -top-4 sm:-top-5 z-10 py-3 -my-1"
          style={{ backgroundColor: theme.card }}
        >
          <h2 className="text-lg font-extrabold" style={{ color: theme.text }}>
            {t.settings}
          </h2>
          <button onClick={onClose} aria-label={t.close} className="p-2 -mr-1 rounded-lg active:scale-90 transition-transform touch-manipulation">
            <Icon icon="tabler:x" width={22} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Icon icon="tabler:language" width={18} />
            {t.language}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleLangSelect('id')}
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all active:scale-95 overflow-hidden"
              style={{
                borderColor: lang === 'id' ? theme.border : theme.border + '40',
                backgroundColor: lang === 'id' ? theme.btnPrimary : theme.keyboard,
                opacity: lang === 'id' ? 1 : 0.6,
              }}
              title="Bahasa Indonesia"
            >
              <img src="./id.png" alt="Indonesian" className="w-full h-full object-cover" />
            </button>
            <button
              onClick={() => handleLangSelect('en')}
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all active:scale-95 overflow-hidden"
              style={{
                borderColor: lang === 'en' ? theme.border : theme.border + '40',
                backgroundColor: lang === 'en' ? theme.btnSecondary : theme.keyboard,
                opacity: lang === 'en' ? 1 : 0.6,
              }}
              title="English"
            >
              <img src="./en.png" alt="English" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold" style={{ color: theme.text }}>{t.darkMode}</span>
          <button
            onClick={handleDarkToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{ borderColor: theme.border, backgroundColor: darkMode ? theme.green : theme.keyboard }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}`, left: darkMode ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Icon icon={soundEnabled ? 'tabler:volume' : 'tabler:volume-off'} width={18} />
            {t.soundEffect}
          </span>
          <div className="flex items-center gap-2">
            {soundEnabled && (
              <button
                onClick={handleTestSound}
                className="px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold active:scale-95 transition-transform touch-manipulation"
                style={{ borderColor: theme.border, backgroundColor: theme.keyboard, color: theme.text }}
              >
                {t.testSound}
              </button>
            )}
          <button
            onClick={handleSoundToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{ borderColor: theme.border, backgroundColor: soundEnabled ? theme.green : theme.keyboard }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}`, left: soundEnabled ? '22px' : '2px' }}
            />
          </button>
          </div>
        </div>

        {/* Definition Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Icon icon="tabler:book" width={18} />
            {t.showDef}
          </span>
          <button
            onClick={handleDefToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{ borderColor: theme.border, backgroundColor: showDefinition ? theme.green : theme.keyboard }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}`, left: showDefinition ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Keyboard Extras Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Icon icon="tabler:keyboard" width={18} />
            {t.showKeyboardExtras}
          </span>
          <button
            onClick={handleKeyboardExtrasToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{ borderColor: theme.border, backgroundColor: showKeyboardExtras ? theme.green : theme.keyboard }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}`, left: showKeyboardExtras ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Multi-letter yellow boxes */}
        <div className="flex items-start justify-between gap-3 py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex flex-col gap-0.5" style={{ color: theme.text }}>
            <span className="flex items-center gap-2">
              <Icon icon="tabler:layout-list" width={18} />
              {t.multiExcluded}
            </span>
            <span className="text-[11px] font-normal" style={{ color: theme.textMuted }}>
              {t.multiExcludedNote}
            </span>
          </span>
          <button
            onClick={handleMultiExcludedToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95 shrink-0"
            style={{ borderColor: theme.border, backgroundColor: multiExcluded ? theme.green : theme.keyboard }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}`, left: multiExcluded ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: theme.text }}>{t.chooseTheme}</h3>
          <div className="flex flex-col gap-2">
            {themeKeys.map((key) => {
              const themeOption = THEMES[key];
              const isActive = key === themeName;
              return (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-[0.98]"
                  style={{
                    borderColor: isActive ? theme.border : theme.border + '40',
                    backgroundColor: isActive ? theme.accent : 'transparent',
                  }}
                >
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: themeOption.green, borderColor: theme.border + '60' }} />
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: themeOption.yellow, borderColor: theme.border + '60' }} />
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: themeOption.disabled, borderColor: theme.border + '60' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: theme.text }}>
                    {themeOption.name}
                  </span>
                  {key === 'colorblind' && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: themeOption.green, color: '#fff' }}>
                      A11Y
                    </span>
                  )}
                  {isActive && (
                    <Icon icon="tabler:check" width={18} className="ml-auto" style={{ color: theme.green }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {themeName === 'colorblind' && (
          <p className="mt-3 text-xs p-2 rounded-lg" style={{ color: theme.textMuted, backgroundColor: theme.accent }}>
            {t.colorblindNote}
          </p>
        )}

        {/* Version Display */}
        <div className="mt-6 pt-3 border-t text-center" style={{ borderColor: theme.border + '40' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>
            Wordle Solver v{__APP_VERSION__}
          </p>
        </div>
      </div>
    </div>
  );
}
