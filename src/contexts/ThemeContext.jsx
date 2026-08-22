import { createContext, useState, useEffect, useContext } from 'react';
import { THEMES } from '../data/themes';
import { LANG } from '../data/i18n';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('ws-theme') || 'mint');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ws-dark') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ws-sound') !== 'false');
  const [showDefinition, setShowDefinition] = useState(() => localStorage.getItem('ws-def') === 'true');
  const [showKeyboardExtras, setShowKeyboardExtras] = useState(() => localStorage.getItem('ws-keys') === 'true');
  const [multiExcluded, setMultiExcluded] = useState(() => localStorage.getItem('ws-multi') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('ws-contrast') === 'true');
  const [showHints, setShowHints] = useState(() => localStorage.getItem('ws-hints') !== 'false');
  const [lang, setLang] = useState(() => localStorage.getItem('ws-lang') || 'id');

  useEffect(() => { localStorage.setItem('ws-theme', themeName); }, [themeName]);
  useEffect(() => { localStorage.setItem('ws-dark', darkMode); }, [darkMode]);
  useEffect(() => { localStorage.setItem('ws-sound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('ws-def', showDefinition); }, [showDefinition]);
  useEffect(() => { localStorage.setItem('ws-keys', showKeyboardExtras); }, [showKeyboardExtras]);
  useEffect(() => { localStorage.setItem('ws-multi', multiExcluded); }, [multiExcluded]);
  useEffect(() => { localStorage.setItem('ws-contrast', highContrast); }, [highContrast]);
  useEffect(() => { localStorage.setItem('ws-hints', showHints); }, [showHints]);
  useEffect(() => {
    localStorage.setItem('ws-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Update HTML class for CSS override
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light-mode', 'dark-mode');
    html.classList.add(darkMode ? 'dark-mode' : 'light-mode');
    html.classList.toggle('contrast-mode', highContrast);
  }, [darkMode, highContrast]);

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

  // High contrast pushes the surfaces to pure black or pure white — true #000 for
  // AMOLED screens — and takes borders and text with them. The semantic green /
  // yellow / red stay as the theme defines them; they are the tile colours the
  // game itself uses.
  const contrastTheme = highContrast
    ? {
        ...resolvedTheme,
        bg: darkMode ? '#000000' : '#ffffff',
        card: darkMode ? '#000000' : '#ffffff',
        accent: darkMode ? '#0d0d0d' : '#f4f4f5',
        accent2: darkMode ? '#141417' : '#e8e8ea',
        text: darkMode ? '#ffffff' : '#000000',
        textMuted: darkMode ? '#d4d4d8' : '#27272a',
        textOnColor: '#ffffff',
        border: darkMode ? '#ffffff' : '#000000',
        shadow: darkMode ? '#ffffff' : '#000000',
        keyboard: darkMode ? '#1c1c1f' : '#e4e4e7',
      }
    : resolvedTheme;

  const t = LANG[lang] || LANG.id;

  return (
    <ThemeContext.Provider value={{
      theme: contrastTheme, themeName, setThemeName,
      darkMode, setDarkMode,
      soundEnabled, setSoundEnabled,
      showDefinition, setShowDefinition,
      showKeyboardExtras, setShowKeyboardExtras,
      multiExcluded, setMultiExcluded,
      highContrast, setHighContrast,
      showHints, setShowHints,
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
