import { useCallback, useState } from 'react';

export type FoiTheme = 'light' | 'dark';

function getStoredTheme(): FoiTheme {
  try {
    const value = localStorage.getItem('foi-theme');
    if (value === 'dark') return 'dark';
  } catch {
    // Ignore storage access errors and keep the default light theme.
  }
  return 'light';
}

function storeTheme(theme: FoiTheme) {
  try {
    localStorage.setItem('foi-theme', theme);
  } catch {
    // Ignore storage access errors; the in-memory theme still updates.
  }
}

export function useFoiTheme() {
  const [theme, setTheme] = useState<FoiTheme>(getStoredTheme);

  const setFoiTheme = useCallback((nextTheme: FoiTheme) => {
    setTheme(nextTheme);
    storeTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      storeTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme: setFoiTheme,
    toggleTheme,
  };
}
