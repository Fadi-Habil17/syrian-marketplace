import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/state/session';
import { CartProvider } from '../src/state/cart';
import { BrowseLocationProvider } from '../src/state/browse-location';
import {
  useFonts,
  NotoSansArabic_400Regular,
  NotoSansArabic_700Bold,
} from '@expo-google-fonts/noto-sans-arabic';
export default function Layout() {
  const [loaded, error] = useFonts({ NotoSansArabic_400Regular, NotoSansArabic_700Bold });
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CartProvider>
          <BrowseLocationProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </BrowseLocationProvider>
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
