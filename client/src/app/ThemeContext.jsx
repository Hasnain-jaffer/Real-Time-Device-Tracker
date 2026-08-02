// client/src/app/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Follow system preference changes if the user hasn't explicitly chosen yet
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e) {
      if (!localStorage.getItem('theme-explicit')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  function toggleTheme() {
    localStorage.setItem('theme-explicit', 'true');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function setExplicitTheme(value) {
    localStorage.setItem('theme-explicit', 'true');
    setTheme(value);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setExplicitTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}