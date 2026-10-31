// mobile/src/context/ThemeContext.js
import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens } from '../theme/tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkTokens : lightTokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);