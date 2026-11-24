import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AppearancePreference = 'light' | 'dark';
const light = {
  ink: '#192f2a',
  green: '#10554c',
  cream: '#faf6ed',
  paper: '#fffdf8',
  muted: '#486158',
  line: '#d8dfd4',
  mint: '#e5efe7',
  gold: '#e8b665',
  control: '#7e9186',
  error: '#9b3429',
  onAction: '#fffdf8',
  focus: '#98601e',
  overlay: '#061b13aa',
};
export type ThemeColors = typeof light;
const dark: ThemeColors = {
  ink: '#f7f3e9',
  green: '#9ad5b8',
  cream: '#101d19',
  paper: '#182b24',
  muted: '#bbcec2',
  line: '#3a5146',
  mint: '#233c30',
  gold: '#e8b665',
  control: '#789387',
  error: '#ffc2af',
  onAction: '#10291f',
  focus: '#efc879',
  overlay: '#06100cbb',
};
const storageKey = 'dukkan.appearance';
const Context = createContext<{
  preference: AppearancePreference;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  setPreference: (p: AppearancePreference) => Promise<void>;
  persistenceError: boolean;
  reduceMotion: boolean;
} | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const os = useColorScheme();
  const [preference, setValue] = useState<AppearancePreference>(os === 'dark' ? 'dark' : 'light');
  const [ready, setReady] = useState(false);
  const [persistenceError, setError] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(storageKey)
      .then((value) => {
        if (mounted && (value === 'light' || value === 'dark')) setValue(value);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const mode = preference;
  async function setPreference(p: AppearancePreference) {
    setValue(p);
    try {
      await SecureStore.setItemAsync(storageKey, p);
      setError(false);
    } catch {
      setError(true);
    }
  }
  if (!ready) return null; // First app view uses the saved palette; no light frame is rendered first.
  return (
    <Context.Provider
      value={{
        preference,
        mode,
        colors: mode === 'dark' ? dark : light,
        setPreference,
        persistenceError,
        reduceMotion,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAppearance() {
  const context = useContext(Context);
  if (!context) throw Error('Missing AppearanceProvider');
  return context;
}
export function themedStyles<T>(factory: (colors: ThemeColors) => T) {
  return function useThemeStyles() {
    const { colors } = useAppearance();
    return useMemo(() => factory(colors), [colors]);
  };
}
