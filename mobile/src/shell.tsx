import { themedStyles, useAppearance } from './appearance';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from './state/session';
import { design, readingStyle } from './theme';
import { SideMenu } from './side-menu';
import { Icon } from './icons';
import { MobileFooter } from './footer';
import { profileInitials } from './profile-initials';

const browseRoutes = new Set(['/catalog', '/listing', '/store', '/booking', '/cart']);
const orderRoutes = new Set(['/orders', '/order', '/chat', '/review', '/delivery']);

export function MobileShell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  const s = useStyles();
  const { colors } = useAppearance();
  const [keyboard, setKeyboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const { user, locale } = useSession();
  const ar = locale === 'ar';
  const path = usePathname();
  const { workspace } = useLocalSearchParams<{ workspace?: string }>();
  useEffect(() => {
    setMenuOpen(false);
  }, [path, workspace]);
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
          <View style={s.actions}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={
                user
                  ? (ar ? 'حسابي: ' : 'My account: ') + user.displayName
                  : ar
                    ? 'تسجيل الدخول'
                    : 'Sign in'
              }
              onPress={() => router.navigate(user ? '/account' : '/auth')}
              style={s.avatar}
            >
              {user ? (
                <Text style={[s.avatarText, readingStyle(locale, true)]}>
                  {profileInitials(user.displayName)}
                </Text>
              ) : (
                <Icon name="user" color={colors.green} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ar ? 'فتح القائمة' : 'Open menu'}
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => {
                Keyboard.dismiss();
                setMenuOpen(true);
              }}
              style={s.menuButton}
            >
              <Icon name="menu" color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </View>
      <View style={[s.categoryBar, { direction }]}>
        {(
          [
            ['FREELANCE', 'العمل الحر', 'Freelance', 'briefcase'],
            ['PROFESSIONAL', 'المهنيون', 'Professionals', 'tools'],
            ['STORE', 'المتاجر المنزلية', 'Home stores', 'bag'],
          ] as const
        ).map(([value, a, en, icon]) => {
          const selected = path === '/catalog' && (workspace ?? 'FREELANCE') === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="link"
              accessibilityState={{ selected }}
              onPress={() =>
                router.navigate({ pathname: '/catalog', params: { workspace: value } })
              }
              style={[s.category, selected && s.selected]}
            >
              <Icon name={icon} size={16} color={colors.green} />
              <Text style={[s.categoryText, readingStyle(locale, true)]}>{ar ? a : en}</Text>
            </Pressable>
          );
        })}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={s.scroll}
          testID="marketplace-content"
        >
          <View style={[s.frame, home && s.home, { direction }]}>
            {children}
            <MobileFooter />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {!keyboard && (
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
                  <Image tintColor={colors.green} source={design[tab.key]} style={s.icon} />
                </View>
                <Text style={[readingStyle(locale, activeTab === tab.key), s.tabText]}>
                  {tab.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      )}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.paper, direction: 'ltr' },
    actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.control,
      backgroundColor: colors.mint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 15, lineHeight: 25, color: colors.green },
    menuButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryBar: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
      borderBottomWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
    },
    category: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: 5,
    },
    categoryText: { fontSize: 11, lineHeight: 20, color: colors.green, flexShrink: 1 },
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
  }),
);
