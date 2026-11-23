import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { AppState, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/state/session';
import { CartProvider } from '../src/state/cart';
import { BrowseLocationProvider } from '../src/state/browse-location';
import { AppearanceProvider, useAppearance } from '../src/appearance';
import {
  useFonts,
  NotoSansArabic_400Regular,
  NotoSansArabic_700Bold,
} from '@expo-google-fonts/noto-sans-arabic';

// Keep the native launch screen until fonts and the stored appearance are ready.
void SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const { mode, reduceMotion, colors } = useAppearance();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: reduceMotion ? ('none' as const) : ('default' as const),
      // The app surface owns its palette. Keep native screen props stable when
      // appearance changes, including screens detached by the navigator.
      contentStyle: { backgroundColor: 'transparent' },
    }),
    [reduceMotion],
  );
  const { fontScale } = useWindowDimensions();
  useEffect(() => {
    // Android can recreate its activity when display/font settings change without
    // another root layout event. Also release a restored native launch screen.
    const frame = requestAnimationFrame(() => SplashScreen.hide());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') SplashScreen.hide();
    });
    return () => {
      cancelAnimationFrame(frame);
      subscription.remove();
    };
  }, [fontScale]);
  return (
    <View
      collapsable={false}
      style={{ flex: 1, backgroundColor: colors.cream }}
      onLayout={() => SplashScreen.hide()}
    >
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions} />
    </View>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts({ NotoSansArabic_400Regular, NotoSansArabic_700Bold });
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <SessionProvider>
          <CartProvider>
            <BrowseLocationProvider>
              <ThemedStack />
            </BrowseLocationProvider>
          </CartProvider>
        </SessionProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
