// mobile/src/theme/ThemeManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens } from './tokens';

const THEME_KEY = 'routepulse_theme_mode'; // 'light' | 'dark' | 'system'

const ThemeManagerContext = createContext(null);

export function ThemeManagerProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system'); // default follows phone
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setMode(saved);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setThemeMode = useCallback(async (newMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode);
    } catch {}
  }, []);

  // Resolve actual theme
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkTokens : lightTokens;

  return (
    <ThemeManagerContext.Provider value={{ mode, setThemeMode, isDark, colors, loaded }}>
      {children}
    </ThemeManagerContext.Provider>
  );
}

export const useThemeManager = () => useContext(ThemeManagerContext);