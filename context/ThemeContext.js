import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';

const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('focustimer:theme');
      if (saved) setMode(saved);
    } catch {}
  };

  const setTheme = async (newMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem('focustimer:theme', newMode);
    } catch {}
  };

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { colors: lightColors, isDark: false, mode: 'system', setTheme: () => {} };
  }
  return context;
};