import { createContext, useState, useEffect, useContext } from 'react';
import { THEMES } from '../data/themes';
import { LANG } from '../data/i18n';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('ws-theme') || 'mint');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ws-dark') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ws-sound') !== 'false');
  const [showDefinition, setShowDefinition] = useState(() => localStorage.getItem('ws-def') === 'true');
  const [lang, setLang] = useState(() => localStorage.getItem('ws-lang') || 'id');

  useEffect(() => { localStorage.setItem('ws-theme', themeName); }, [themeName]);
  useEffect(() => { localStorage.setItem('ws-dark', darkMode); }, [darkMode]);
  useEffect(() => { localStorage.setItem('ws-sound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('ws-def', showDefinition); }, [showDefinition]);
  useEffect(() => { localStorage.setItem('ws-lang', lang); }, [lang]);

  const theme = THEMES[themeName] || THEMES.mint;

  const resolvedTheme = darkMode && themeName !== 'colorblind'
    ? {
        ...theme,
        bg: '#121218',
        card: '#1e1e2a',
        accent: '#1e2a3a',
        accent2: '#2a1e3a',
        text: '#f1f5f9',
        textMuted: '#a1a1aa',
        textOnColor: '#ffffff',
        border: '#e2e8f0',
        shadow: '#e2e8f0',
        keyboard: '#2a2a3e',
        btnPrimary: theme.btnPrimary,
        btnSecondary: theme.btnSecondary,
      }
    : theme;

  const t = LANG[lang] || LANG.id;

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme, themeName, setThemeName,
      darkMode, setDarkMode,
      soundEnabled, setSoundEnabled,
      showDefinition, setShowDefinition,
      lang, setLang, t,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
