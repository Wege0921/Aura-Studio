import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'atelier';

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'atelier', label: 'Atelier' },
];

const VALID_THEMES: Theme[] = ['light', 'dark', 'atelier'];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'aura-theme';

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (VALID_THEMES as string[]).includes(value);
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // localStorage can throw in private mode / blocked-cookie contexts
    return null;
  }
}

function getInitialTheme(): Theme {
  // 1. Respect an explicit user choice
  const stored = getStoredTheme();
  if (stored) return stored;

  // 2. Only fall back to light if the user's system explicitly prefers light.
  //    Atelier is never auto-selected; it is an opt-in aesthetic choice.
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';

  // 3. Default to dark to match the brand
  return 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Applies the theme to the DOM. Deliberately does NOT persist — see setTheme.
  const applyTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);

    // Keep mobile browser chrome in sync with the theme.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const canvas = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-canvas')
        .trim();
      if (canvas) meta.setAttribute('content', canvas);
    }
  }, []);

  // Persist only on an explicit user choice.
  //
  // Previously applyTheme() wrote to localStorage and was also called on mount,
  // which populated the key even when the user had never chosen a theme. That
  // permanently defeated the `if (!stored)` guard in the system-preference
  // listener below, so following the OS setting silently stopped working after
  // the first page load.
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const idx = VALID_THEMES.indexOf(prev);
      const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length];
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }, [applyTheme]);

  // Apply on mount (does not persist)
  useEffect(() => {
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow system preference, but only while the user has made no explicit choice
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (getStoredTheme()) return;
      const next: Theme = e.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [applyTheme]);

  // Keep other tabs in sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (isTheme(e.newValue)) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
