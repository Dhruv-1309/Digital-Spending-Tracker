import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext, type ThemeMode } from './themeContextDef';

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem('mt_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore storage error
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const updateResolvedTheme = () => {
      let active: 'light' | 'dark';
      if (theme === 'dark') {
        active = 'dark';
      } else if (theme === 'light') {
        active = 'light';
      } else if (mediaQuery) {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = 'light';
      }

      setResolvedTheme(active);

      // Apply to document DOM
      document.documentElement.setAttribute('data-theme', active);
      document.documentElement.classList.toggle('dark', active === 'dark');

      // Update theme-color meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', active === 'dark' ? '#141210' : '#FAF7F2');
      }
    };

    updateResolvedTheme();

    if (!mediaQuery) return;

    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('mt_theme', newTheme);
    } catch {
      // ignore storage error
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
