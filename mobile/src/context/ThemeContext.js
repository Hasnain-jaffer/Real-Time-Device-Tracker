// mobile/src/context/ThemeContext.js
import { createContext, useContext } from 'react';
import { useThemeManager } from '../theme/ThemeManager';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const themeManager = useThemeManager();
  return (
    <ThemeContext.Provider value={themeManager}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);