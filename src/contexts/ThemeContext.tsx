import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'atelier';

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'atelier', label: 'Atelier' },
];

// 'light' is retired from the switchers but kept as a valid stored value so
// legacy persisted themes still parse (mapped to 'dark' at boot).
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
  // 1. Respect an explicit user choice (Dark / Atelier). A legacy stored
  //    'light' is retired and lands on the default.
  const stored = getStoredTheme();
  if (stored === 'dark' || stored === 'atelier') return stored;

  // 2. Atelier is the brand default for visitors without a stored choice.
  return 'atelier';
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
      const visible = THEMES.map(t => t.value);
      const idx = visible.indexOf(prev); // legacy 'light' is not in the list → -1
      const next = visible[(idx + 1) % visible.length];
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
