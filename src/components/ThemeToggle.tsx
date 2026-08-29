import React, { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES, Theme } from '../contexts/ThemeContext';

const ICONS: Record<Theme, React.ReactNode> = {
  dark: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  ),
  light: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  ),
  atelier: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a6 6 0 016 6c0 2.5-1.5 4-3 5.5V17H9v-2.5C7.5 13 6 11.5 6 9a6 6 0 016-6zM9 20h6" />
  ),
};

const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = THEMES.find(t => t.value === theme) ?? THEMES[0];

  return (
    <div ref={wrapRef} className={`relative inline-block theme-toggle ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        type="button"
        className="theme-toggle-trigger inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-content-secondary/20 focus:outline-none focus:ring-2 focus:ring-content-secondary"
        aria-label={`Theme: ${current.label}. Change theme`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Theme: ${current.label}`}
      >
        <svg className="w-5 h-5 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {ICONS[theme]}
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select theme"
          className="theme-menu absolute right-0 mt-2 w-40 rounded-xl border border-edge bg-surface shadow-elev-1 py-1 z-[80]"
        >
          {THEMES.map(t => {
            const active = t.value === theme;
            return (
              <button
                key={t.value}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => { setTheme(t.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  active ? 'bg-[var(--state-selected)]' : 'hover:bg-[var(--state-hover)]'
                }`}
              >
                <svg
                  className={`theme-menu-icon w-4 h-4 flex-shrink-0 ${active ? 'text-accent-600' : 'text-content-secondary'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {ICONS[t.value]}
                </svg>
                <span className={`theme-menu-label text-sm font-medium ${active ? 'text-content-emphasis' : 'text-content'}`}>
                  {t.label}
                </span>
                {active && (
                  <svg className="theme-menu-check w-4 h-4 ml-auto flex-shrink-0 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
