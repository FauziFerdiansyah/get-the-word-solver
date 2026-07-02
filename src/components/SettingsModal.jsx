import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/ThemeContext';
import { THEMES } from '../data/themes';
import { gooeyToast } from 'goey-toast';

const themeKeys = Object.keys(THEMES);

export default function SettingsModal({ open, onClose }) {
  const { theme, themeName, setThemeName, darkMode, setDarkMode, soundEnabled, setSoundEnabled } = useTheme();

  if (!open) return null;

  const handleThemeChange = (key) => {
    setThemeName(key);
    gooeyToast(`Tema "${THEMES[key].name}" diterapkan`, { duration: 1500 });
  };

  const handleDarkToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    gooeyToast(next ? 'Dark mode aktif' : 'Light mode aktif', { duration: 1500 });
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    gooeyToast(next ? 'Sound effect aktif 🔊' : 'Sound effect mati 🔇', { duration: 1500 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border-2 p-5 max-h-[85vh] overflow-y-auto"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          boxShadow: `4px 4px 0px 0px ${theme.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold" style={{ color: theme.text }}>
            Pengaturan
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg active:scale-90 transition-transform">
            <Icon icon="tabler:x" width={22} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold" style={{ color: theme.text }}>Dark Mode</span>
          <button
            onClick={handleDarkToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{
              borderColor: theme.border,
              backgroundColor: darkMode ? theme.green : theme.keyboard,
            }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{
                backgroundColor: theme.card,
                border: `2px solid ${theme.border}`,
                left: darkMode ? '22px' : '2px',
              }}
            />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: theme.border + '40' }}>
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Icon icon={soundEnabled ? 'tabler:volume' : 'tabler:volume-off'} width={18} />
            Sound Effect
          </span>
          <button
            onClick={handleSoundToggle}
            className="w-12 h-7 rounded-full border-2 relative transition-all active:scale-95"
            style={{
              borderColor: theme.border,
              backgroundColor: soundEnabled ? theme.green : theme.keyboard,
            }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{
                backgroundColor: theme.card,
                border: `2px solid ${theme.border}`,
                left: soundEnabled ? '22px' : '2px',
              }}
            />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: theme.text }}>Pilih Tema</h3>
          <div className="flex flex-col gap-2">
            {themeKeys.map((key) => {
              const t = THEMES[key];
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
                  {/* Color preview dots */}
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.green, borderColor: t.border + '60' }} />
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.yellow, borderColor: t.border + '60' }} />
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.disabled, borderColor: t.border + '60' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: theme.text }}>
                    {t.name}
                  </span>
                  {key === 'colorblind' && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: t.green, color: '#fff' }}>
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
            Tema ini menggunakan biru & oranye sebagai pengganti hijau & kuning agar lebih mudah dibedakan oleh penderita buta warna.
          </p>
        )}
      </div>
    </div>
  );
}

