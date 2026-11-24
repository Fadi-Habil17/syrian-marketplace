import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { themedStyles, useAppearance } from './appearance';
import { AppearancePicker } from './appearance-picker';
import { useSession } from './state/session';
import { readingStyle } from './theme';
import { Icon } from './icons';

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, setLocale, user } = useSession(),
    { colors, reduceMotion } = useAppearance(),
    s = useStyles();
  const ar = locale === 'ar',
    offset = useRef(new Animated.Value(-380)).current;
  useEffect(() => {
    if (open) {
      offset.setValue(reduceMotion ? 0 : -380);
      Animated.timing(offset, {
        toValue: 0,
        duration: reduceMotion ? 0 : 200,
        useNativeDriver: true,
      }).start();
    }
    return () => offset.stopAnimation();
  }, [open, offset, reduceMotion]);
  const links: [Href, string, string][] = [
    ['/', 'الرئيسية', 'Home'],
    ['/discover', 'اكتشف القريب منك', 'Discover nearby'],
    ['/orders', 'طلباتي', 'My orders'],
    ['/addresses', 'عناويني', 'My addresses'],
    ['/wallet', 'المحفظة', 'Wallet'],
    [user ? '/account' : '/auth', user ? 'حسابي' : 'تسجيل الدخول', user ? 'My account' : 'Sign in'],
  ];
  if (user?.activeBusinessProfile) links.push(['/seller', 'مساحة عملي', 'My workspace']);
  if (user?.roles.includes('ADMIN')) links.push(['/admin', 'الإدارة', 'Administration']);
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={ar ? 'إغلاق القائمة' : 'Close menu'}
          onPress={onClose}
        />
        <Animated.View
          style={[s.panel, { transform: [{ translateX: offset }] }]}
          accessibilityViewIsModal
        >
          <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
              <View style={[s.heading, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
                <Text accessibilityRole="header" style={[s.title, readingStyle(locale, true)]}>
                  {ar ? 'دكّان و حارة' : 'Dukkan & Hara'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ar ? 'إغلاق القائمة' : 'Close menu'}
                  onPress={onClose}
                  style={s.close}
                >
                  <Icon name="close" color={colors.ink} />
                </Pressable>
              </View>
              <Text style={[s.welcome, readingStyle(locale, true)]}>
                {ar ? 'أهلاً في الحارة' : 'Welcome to the neighbourhood'}
              </Text>
              {links.map(([href, a, en]) => (
                <Pressable
                  key={String(href)}
                  accessibilityRole="link"
                  onPress={() => {
                    onClose();
                    router.navigate(href);
                  }}
                  style={({ pressed }) => [s.link, pressed && { backgroundColor: colors.mint }]}
                >
                  <Text style={[s.text, readingStyle(locale, true)]}>{ar ? a : en}</Text>
                </Pressable>
              ))}
              <View style={s.settings}>
                <Text style={[s.caption, readingStyle(locale, true)]}>
                  {ar ? 'على ذوقك' : 'Make it yours'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ar ? 'Switch to English' : 'التبديل للعربية'}
                  onPress={() => setLocale(ar ? 'en' : 'ar')}
                  style={[s.language, { flexDirection: ar ? 'row-reverse' : 'row' }]}
                >
                  <Icon name="globe" color={colors.green} />
                  <Text style={[s.text, { flex: 1 }, readingStyle(locale, true)]}>
                    {ar ? 'اللغة' : 'Language'}
                  </Text>
                  <Text style={s.badge}>{ar ? 'English' : 'العربية'}</Text>
                </Pressable>
                <AppearancePicker locale={locale} />
              </View>
              <View style={s.note}>
                <Icon name="heart" color={colors.green} size={16} />
                <Text style={[s.caption, readingStyle(locale)]}>
                  {ar ? 'من حارتنا، وبمحبّة.' : 'From our neighbourhood, with care.'}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
const useStyles = themedStyles((c) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: c.overlay, direction: 'ltr', alignItems: 'flex-start' },
    panel: {
      width: '88%',
      maxWidth: 380,
      height: '100%',
      backgroundColor: c.paper,
      borderRightWidth: 1,
      borderColor: c.line,
    },
    safe: { flex: 1 },
    content: { padding: 20, gap: 5, flexGrow: 1 },
    heading: { alignItems: 'center', gap: 8, marginBottom: 20 },
    title: { flex: 1, fontSize: 20, color: c.ink, lineHeight: 32 },
    close: {
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: c.mint,
    },
    welcome: { fontSize: 14, lineHeight: 24, color: c.green, marginBottom: 12 },
    link: { paddingHorizontal: 12, paddingVertical: 12, minHeight: 48, borderRadius: 12 },
    text: { color: c.ink, fontSize: 14, lineHeight: 24 },
    settings: { borderTopWidth: 1, borderColor: c.line, paddingTop: 20, marginTop: 16, gap: 14 },
    caption: { color: c.muted, fontSize: 12, lineHeight: 22 },
    language: { gap: 12, alignItems: 'center', minHeight: 48 },
    badge: { color: c.green, backgroundColor: c.mint, padding: 8, borderRadius: 10, fontSize: 13 },
    note: {
      marginTop: 'auto',
      paddingTop: 24,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
  }),
);
