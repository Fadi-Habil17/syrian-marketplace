import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../src/state/session';
import { CartProvider } from '../src/state/cart';
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
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
