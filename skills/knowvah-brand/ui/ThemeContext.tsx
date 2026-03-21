// ThemeContext — Warm Studio theme system.
//
// Two axes, four combinations:
//   data-color-mode = "light" | "dark"
//   data-contrast   = "standard" | "high-contrast"
//
// Anonymous users always follow OS hints (themeMode forced to 'system').
// Authenticated users can override and the preference is persisted to localStorage.
//
// ADAPT: update the useAuth import path if AuthContext lives elsewhere.

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { useAuth } from './AuthContext';

export type ThemeMode = 'system' | 'custom';
export type ResolvedColorMode = 'light' | 'dark';
export type ContrastMode = 'standard' | 'high-contrast';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorMode: ResolvedColorMode;
  contrastMode: ContrastMode;
  /** Custom preferences — only meaningful when themeMode is 'custom' */
  customColorMode: ResolvedColorMode;
  customContrastMode: ContrastMode;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomColorMode: (mode: ResolvedColorMode) => void;
  setCustomContrastMode: (mode: ContrastMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemColorMode(): ResolvedColorMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSystemContrastMode(): ContrastMode {
  return window.matchMedia('(prefers-contrast: more)').matches ? 'high-contrast' : 'standard';
}

function getInitialThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEYS.COLOR_MODE);
  if (!stored || stored === 'system') return 'system';
  return 'custom';
}

function getInitialCustomColorMode(): ResolvedColorMode {
  const stored = localStorage.getItem(STORAGE_KEYS.COLOR_MODE);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemColorMode();
}

function getInitialCustomContrastMode(): ContrastMode {
  const stored = localStorage.getItem(STORAGE_KEYS.CONTRAST_MODE);
  if (stored === 'standard' || stored === 'high-contrast') return stored;
  return 'standard';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [customColorMode, setCustomColorModeState] = useState<ResolvedColorMode>(getInitialCustomColorMode);
  const [customContrastMode, setCustomContrastModeState] = useState<ContrastMode>(getInitialCustomContrastMode);
  const [systemColorMode, setSystemColorMode] = useState<ResolvedColorMode>(getSystemColorMode);
  const [systemContrastMode, setSystemContrastMode] = useState<ContrastMode>(getSystemContrastMode);

  const { user, loading: authLoading } = useAuth();
  // Anonymous users always follow OS hints; never read stored preferences.
  const effectiveThemeMode = (!authLoading && !user) ? 'system' : themeMode;

  const colorMode = effectiveThemeMode === 'system' ? systemColorMode : customColorMode;
  const contrastMode = effectiveThemeMode === 'system' ? systemContrastMode : customContrastMode;

  // Listen for OS color scheme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemColorMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Listen for OS contrast changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-contrast: more)');
    const handler = (e: MediaQueryListEvent) => setSystemContrastMode(e.matches ? 'high-contrast' : 'standard');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply resolved values to DOM
  useEffect(() => {
    document.documentElement.dataset.colorMode = colorMode;
  }, [colorMode]);

  useEffect(() => {
    document.documentElement.dataset.contrast = contrastMode;
  }, [contrastMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (mode === 'custom') {
      setCustomColorModeState(systemColorMode);
      setCustomContrastModeState(systemContrastMode);
      localStorage.setItem(STORAGE_KEYS.COLOR_MODE, systemColorMode);
      localStorage.setItem(STORAGE_KEYS.CONTRAST_MODE, systemContrastMode);
    } else {
      localStorage.setItem(STORAGE_KEYS.COLOR_MODE, 'system');
      localStorage.setItem(STORAGE_KEYS.CONTRAST_MODE, 'system');
    }
  }, [systemColorMode, systemContrastMode]);

  const setCustomColorMode = useCallback((mode: ResolvedColorMode) => {
    setCustomColorModeState(mode);
    localStorage.setItem(STORAGE_KEYS.COLOR_MODE, mode);
  }, []);

  const setCustomContrastMode = useCallback((mode: ContrastMode) => {
    setCustomContrastModeState(mode);
    localStorage.setItem(STORAGE_KEYS.CONTRAST_MODE, mode);
  }, []);

  return (
    <ThemeContext.Provider value={{
      themeMode,
      colorMode,
      contrastMode,
      customColorMode,
      customContrastMode,
      setThemeMode,
      setCustomColorMode,
      setCustomContrastMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
