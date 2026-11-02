import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightTokens, darkTokens } from '../theme/tokens';

const KEY = 'routepulse_theme_mode';
const MODES = ['light', 'dark', 'system'];
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');
  const [ready, setReady] = useState(false);

  // Load the saved choice before the first screen renders, so there is no flash
  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((saved) => {
        if (MODES.includes(saved)) setModeState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback((next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    SecureStore.setItemAsync(KEY, next).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo(
    () => ({ mode, setMode, isDark, colors: isDark ? darkTokens : lightTokens }),
    [mode, setMode, isDark]
  );

  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);