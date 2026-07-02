import { createContext, useState, useEffect, useContext } from 'react';
import { THEMES } from '../data/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('ws-theme') || 'mint');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ws-dark') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ws-sound') !== 'false');
  const [showDefinition, setShowDefinition] = useState(() => localStorage.getItem('ws-def') === 'true');

  useEffect(() => {
    localStorage.setItem('ws-theme', themeName);
  }, [themeName]);

  useEffect(() => {
    localStorage.setItem('ws-dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('ws-sound', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('ws-def', showDefinition);
  }, [showDefinition]);

  const theme = THEMES[themeName] || THEMES.mint;

  // Dark mode overrides — keep the theme's accent colors (green, yellow, red)
  // but swap backgrounds/text for dark readability.
  // Neo-brutalism: borders & shadows become light/white in dark mode for contrast.
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

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeName, setThemeName, darkMode, setDarkMode, soundEnabled, setSoundEnabled, showDefinition, setShowDefinition }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
