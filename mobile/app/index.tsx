import { router } from 'expo-router';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../src/state/session';
import { colors, Busy } from '../src/ui';
const assets = {
  brand: require('../assets/design/brand.svg'),
  globe: require('../assets/design/globe.svg'),
  home: require('../assets/design/home.svg'),
  explore: require('../assets/design/explore.svg'),
  orders: require('../assets/design/orders.svg'),
  user: require('../assets/design/user.svg'),
  search: require('../assets/design/search.svg'),
  arrow: require('../assets/design/arrow.svg'),
  souk: require('../assets/design/souk.png'),
};
export default function Home() {
  const { user, ready, locale, setLocale } = useSession();
  const ar = locale === 'ar';
  const width = Math.min(useWindowDimensions().width - 40, 560);
  const row = { flexDirection: ar ? ('row-reverse' as const) : ('row' as const) };
  const text = {
    textAlign: ar ? ('right' as const) : ('left' as const),
    writingDirection: ar ? ('rtl' as const) : ('ltr' as const),
  };
  const entries = [
    [
      'FREELANCE',
      'العمل الحر',
      'Freelance',
      'خدمات رقمية من مستقلّين في سوريا.',
      'Digital services from freelancers in Syria.',
      -1.1246,
      -0.106,
    ],
    [
      'PROFESSIONAL',
      'المهنيون',
      'Professionals',
      'أصحاب مهن لخدمة بيتك ومشروعك.',
      'Skilled trades for your home or business.',
      -2.2033,
      -0.106,
    ],
    [
      'STORE',
      'المتاجر المنزلية',
      'Home stores',
      'مونة ومخبوزات ومنتجات مصنوعة باليد.',
      'Baked goods and handmade finds.',
      -0.0458,
      -1.3109,
    ],
  ] as const;
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={[s.header, row]}>
        <View style={[row, { alignItems: 'center', gap: 10 }]}>
          <Image source={assets.brand} style={{ width: 38, height: 38 }} />
          <Text style={s.wordmark}>{ar ? 'دكّان و حارة' : 'Dukkan & Hara'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ar ? 'Switch to English' : 'التبديل للعربية'}
          onPress={() => setLocale(ar ? 'en' : 'ar')}
          style={[s.language, row]}
        >
          <Image source={assets.globe} style={{ width: 17, height: 17 }} />
          <Text style={s.languageText}>{ar ? 'العربية / English' : 'English / العربية'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.hero, { width }]}>
          <View style={{ height: 96, overflow: 'hidden' }}>
            <Image
              source={assets.souk}
              style={{
                position: 'absolute',
                width: width * 3.2362,
                height: 96 * 11.7988,
                left: width * -0.0458,
                top: 96 * -1.4783,
              }}
            />
          </View>
          <View style={{ padding: 13, gap: 6 }}>
            <Text style={[s.headline, text]}>
              {ar ? 'من حارتك، لكلّ سوريا.' : 'Find it close to home.'}
            </Text>
            <Text style={[s.description, text]}>
              {ar
                ? 'تسوّق من متاجر منزلية، واعثر على مستقلّ أو مهني يناسبك.'
                : 'Find a freelancer, a trusted tradesperson or something made at home.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/catalog')}
              style={[s.search, row]}
            >
              <Image source={assets.search} style={{ width: 18, height: 18 }} />
              <Text style={[s.description, text, { flex: 1 }]}>
                {ar ? 'ابحث عن خدمة أو مهنة أو منتج' : 'Search services, trades or products'}
              </Text>
            </Pressable>
          </View>
        </View>
        <Text style={[s.section, text, { width }]}>
          {ar ? 'استكشف السوق' : 'Explore the marketplace'}
        </Text>
        {entries.map(([workspace, a, e, descA, descE, x, y]) => (
          <Pressable
            key={workspace}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/catalog', params: { workspace } })}
            style={[s.card, row, { width }]}
          >
            <View style={s.thumb}>
              <Image
                source={assets.souk}
                style={{
                  position: 'absolute',
                  width: 86 * 3.2362,
                  height: 77 * 3.6145,
                  left: 86 * x,
                  top: 77 * y,
                }}
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={[s.cardTitle, text]}>{ar ? a : e}</Text>
                <Image
                  source={assets.arrow}
                  style={{ width: 16, height: 16, transform: [{ scaleX: ar ? 1 : -1 }] }}
                />
              </View>
              <Text style={[s.description, text]}>{ar ? descA : descE}</Text>
            </View>
          </Pressable>
        ))}
        {!ready && <Busy />}
        <Text style={[s.description, text]}>{ar ? 'مدفوعات تجريبية' : 'Simulated payments'}</Text>
      </ScrollView>
      <View style={[s.nav, row]}>
        {(['home', 'explore', 'orders', 'user'] as const).map((name, i) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === 0 }}
            onPress={() =>
              router.push((['/', '/catalog', '/orders', user ? '/account' : '/auth'] as const)[i]!)
            }
            style={s.tab}
          >
            <View style={[s.tabIcon, i === 0 && { backgroundColor: '#e5efe7' }]}>
              <Image source={assets[name]} style={{ width: 19, height: 19 }} />
            </View>
            <Text style={s.navText}>
              {
                (ar
                  ? ['الرئيسية', 'استكشاف', 'طلباتي', 'حسابي']
                  : ['Home', 'Explore', 'Orders', 'Account'])[i]
              }
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    minHeight: 62,
    paddingHorizontal: 20,
    backgroundColor: '#fffdf8',
    borderBottomWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wordmark: { fontFamily: 'NotoSansArabic_700Bold', fontSize: 20, color: colors.ink },
  language: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#e5efe7',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  languageText: { fontFamily: 'NotoSansArabic_700Bold', fontSize: 11, color: colors.green },
  content: { alignItems: 'center', padding: 20, paddingTop: 13, gap: 8 },
  hero: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    backgroundColor: '#fffdf8',
  },
  headline: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 28,
    lineHeight: 41,
    color: colors.ink,
  },
  description: {
    fontFamily: 'NotoSansArabic_400Regular',
    fontSize: 12,
    lineHeight: 22,
    color: colors.muted,
  },
  search: {
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  section: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 19,
    lineHeight: 32,
    color: colors.ink,
  },
  card: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#fffdf8',
  },
  thumb: { width: 86, height: 77, overflow: 'hidden', borderRadius: 11 },
  cardTitle: { fontFamily: 'NotoSansArabic_700Bold', fontSize: 16, color: colors.ink },
  nav: {
    backgroundColor: '#fffdf8',
    borderTopWidth: 1,
    borderColor: colors.line,
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  tab: { minHeight: 57, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: {
    width: 46,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontFamily: 'NotoSansArabic_400Regular', fontSize: 11, color: colors.green },
});
