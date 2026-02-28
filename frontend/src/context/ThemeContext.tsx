import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, type ThemeColors } from '../constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  defaultPaymentMethod: string;
  setDefaultPaymentMethod: (method: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {},
  defaultPaymentMethod: 'UPI',
  setDefaultPaymentMethod: () => {},
});

const THEME_KEY = '@spendsmart_theme';
const PAYMENT_KEY = '@spendsmart_payment';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [defaultPaymentMethod, setDefaultPaymentMethodState] = useState('UPI');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedPayment] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(PAYMENT_KEY),
        ]);
        if (savedTheme) setThemeModeState(savedTheme as ThemeMode);
        if (savedPayment) setDefaultPaymentMethodState(savedPayment);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }, []);

  const setDefaultPaymentMethod = useCallback((method: string) => {
    setDefaultPaymentMethodState(method);
    AsyncStorage.setItem(PAYMENT_KEY, method).catch(() => {});
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const colors = isDark ? Colors.dark : Colors.light;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode, defaultPaymentMethod, setDefaultPaymentMethod }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
