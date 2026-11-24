import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { themedStyles, useAppearance } from './appearance';
import { useSession } from './state/session';
import { readingStyle } from './theme';
import { Icon } from './icons';
export function MobileFooter() {
  const { locale } = useSession(),
    { colors } = useAppearance(),
    s = useStyles(),
    ar = locale === 'ar';
  const links: [Href, string, string][] = [
    ['/catalog?workspace=FREELANCE', 'العمل الحر', 'Freelance'],
    ['/catalog?workspace=PROFESSIONAL', 'المهنيون', 'Professionals'],
    ['/catalog?workspace=STORE', 'المتاجر المنزلية', 'Home stores'],
    ['/discover', 'اكتشف القريب منك', 'Discover nearby'],
    ['/orders', 'طلباتي', 'My orders'],
    ['/account', 'حسابي', 'My account'],
  ];
  return (
    <View style={s.footer}>
      <Text style={[s.title, readingStyle(locale, true)]}>
        {ar ? 'دكّان و حارة' : 'Dukkan & Hara'}
      </Text>
      <Text style={[s.copy, readingStyle(locale)]}>
        {ar
          ? 'إبداع المستقلين، خبرة المهنيين، ومنتجات معمولة بمحبّة من أهل الحارة.'
          : 'Freelance creativity, skilled professionals and goods made with care by your neighbours.'}
      </Text>
      <View style={[s.links, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
        {links.map(([href, a, en]) => (
          <Pressable
            key={String(href)}
            accessibilityRole="link"
            onPress={() => router.navigate(href)}
            style={s.link}
          >
            <Text style={[s.linkText, readingStyle(locale)]}>{ar ? a : en}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={ar ? 'عن المشروع على GitHub' : 'Project on GitHub'}
        onPress={() =>
          void Linking.openURL('https://github.com/Fadi-Habil17/syrian-marketplace').catch(() => {})
        }
        style={s.source}
      >
        <Icon name="heart" color={colors.green} size={16} />
        <Text style={[s.linkText, readingStyle(locale)]}>
          {ar ? 'عن المشروع على GitHub' : 'Project on GitHub'}
        </Text>
      </Pressable>
      <Text style={[s.small, readingStyle(locale)]}>
        {ar ? 'المدفوعات ضمن المنصة محاكاة تجريبية.' : 'Payments on this platform are simulated.'}
      </Text>
      <Text style={[s.small, readingStyle(locale)]}>
        © {new Date().getFullYear()} {ar ? 'دكّان و حارة' : 'Dukkan & Hara'}
      </Text>
    </View>
  );
}
const useStyles = themedStyles((c) =>
  StyleSheet.create({
    footer: {
      direction: 'ltr',
      borderTopWidth: 1,
      borderColor: c.line,
      paddingVertical: 28,
      marginTop: 24,
      gap: 14,
    },
    title: { fontSize: 20, lineHeight: 32, color: c.ink },
    copy: { fontSize: 13, lineHeight: 24, color: c.muted },
    links: { flexWrap: 'wrap', gap: 4 },
    link: { width: '48%', minHeight: 44, justifyContent: 'center' },
    linkText: { fontSize: 13, lineHeight: 22, color: c.green },
    small: { fontSize: 11, lineHeight: 20, color: c.muted },
    source: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  }),
);
