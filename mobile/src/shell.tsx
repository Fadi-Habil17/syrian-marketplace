import type { ReactNode } from 'react';
import { router, usePathname } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from './state/session';
import { colors, design, readingStyle } from './theme';

const browseRoutes = new Set(['/catalog', '/listing', '/store', '/booking', '/cart']);
const orderRoutes = new Set(['/orders', '/order', '/chat', '/review', '/delivery']);

export function MobileShell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  const { user, locale, setLocale } = useSession();
  const ar = locale === 'ar';
  const path = usePathname();
  const activeTab =
    path === '/' || path === '/location'
      ? 'home'
      : browseRoutes.has(path)
        ? 'explore'
        : orderRoutes.has(path)
          ? 'orders'
          : 'account';
  const tabs = [
    { key: 'home', title: ar ? 'الرئيسية' : 'Home', path: '/' },
    { key: 'explore', title: ar ? 'استكشاف' : 'Explore', path: '/catalog' },
    { key: 'orders', title: ar ? 'طلباتي' : 'Requests', path: '/orders' },
    { key: 'account', title: ar ? 'حسابي' : 'Account', path: user ? '/account' : '/auth' },
  ] as const;
  const direction = ar ? ('rtl' as const) : ('ltr' as const);
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={[s.headerRow, { direction }]}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={ar ? 'العودة للسوق' : 'Marketplace home'}
            onPress={() => router.navigate('/')}
            style={s.brand}
          >
            <Image source={design.brand} style={s.brandIcon} />
            <Text style={[s.wordmark, readingStyle(locale, true)]}>
              {ar ? 'دكّان و حارة' : 'Dukkan & Hara'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ar ? 'Switch to English' : 'التبديل للعربية'}
            onPress={() => setLocale(ar ? 'en' : 'ar')}
            style={s.language}
          >
            <Image source={design.globe} style={s.globe} />
            <Text style={[s.languageText, readingStyle(locale, true)]}>
              {ar ? 'العربية / English' : 'English / العربية'}
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={s.body}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}
        testID="marketplace-content"
      >
        <View style={[s.frame, home && s.home, { direction }]}>{children}</View>
      </ScrollView>
      <SafeAreaView style={s.bottom} edges={['bottom']}>
        <View accessibilityRole="tablist" style={[s.tabs, { direction }]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
              accessibilityLabel={tab.title}
              onPress={() => {
                if (path !== tab.path) router.navigate(tab.path);
              }}
              style={s.tab}
            >
              <View style={[s.tabIcon, activeTab === tab.key && s.selected]}>
                <Image source={design[tab.key]} style={s.icon} />
              </View>
              <Text style={[readingStyle(locale, activeTab === tab.key), s.tabText]}>
                {tab.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, direction: 'ltr' },
  header: { borderBottomWidth: 1, borderColor: colors.line },
  headerRow: {
    minHeight: 61,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: { minHeight: 48, flexShrink: 1, gap: 9, flexDirection: 'row', alignItems: 'center' },
  brandIcon: { width: 38, height: 38 },
  wordmark: { fontSize: 17, color: colors.ink, flexShrink: 1 },
  language: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.mint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  globe: { width: 17, height: 17 },
  languageText: { fontSize: 11, color: colors.green },
  body: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  frame: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingVertical: 14, gap: 12 },
  home: { gap: 8 },
  bottom: { borderTopWidth: 1, borderColor: colors.line },
  tabs: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  tab: { minHeight: 52, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.mint },
  icon: { width: 19, height: 19 },
  tabText: { textAlign: 'center', fontSize: 11, lineHeight: 16, color: colors.green },
});
