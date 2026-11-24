import { themedStyles, useAppearance } from '../src/appearance';
import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { MobileShell } from '../src/shell';
import { useSession } from '../src/state/session';
import { useBrowseLocation } from '../src/state/browse-location';
import { design, readingStyle } from '../src/theme';
import { Busy, Copy, Heading } from '../src/ui';

const atlas = require('../assets/design/souk.jpg');
const atlasSize = 1024;
const crops = {
  hero: { x: 14, y: 134, width: 316, height: 87 },
  freelance: { x: 355, y: 30, width: 316, height: 283 },
  professional: { x: 697, y: 30, width: 316, height: 283 },
  store: { x: 14, y: 371, width: 316, height: 283 },
} as const;

function HomePhoto({ crop, style }: { crop: keyof typeof crops; style: ViewStyle }) {
  const s = useStyles();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const rect = crops[crop];
  const scale = Math.max(size.width / rect.width, size.height / rect.height);
  return (
    <View
      style={[s.photo, style]}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
    >
      {scale > 0 && (
        <Image
          source={atlas}
          accessibilityIgnoresInvertColors
          style={{
            position: 'absolute',
            width: atlasSize * scale,
            height: atlasSize * scale,
            start: (size.width - rect.width * scale) / 2 - rect.x * scale,
            top: (size.height - rect.height * scale) / 2 - rect.y * scale,
          }}
        />
      )}
    </View>
  );
}

const entries = [
  [
    'FREELANCE',
    'freelance',
    'العمل الحر',
    'Freelance',
    'خدمات رقمية من مستقلّين في سوريا.',
    'Digital services from freelancers in Syria.',
  ],
  [
    'PROFESSIONAL',
    'professional',
    'المهنيون',
    'Professionals',
    'أصحاب مهن لخدمة بيتك ومشروعك.',
    'Skilled trades for your home or business.',
  ],
  [
    'STORE',
    'store',
    'المتاجر المنزلية',
    'Home stores',
    'مونة ومخبوزات ومنتجات مصنوعة باليد.',
    'Baked goods and handmade finds.',
  ],
] as const;

export default function Home() {
  const s = useStyles();
  const { colors } = useAppearance();
  const { ready, locale } = useSession();
  const { location } = useBrowseLocation();
  const ar = locale === 'ar';
  const place = location?.city ?? location?.governorate;
  const chooseLocation = place
    ? ar
      ? place.nameAr
      : place.nameEn
    : ar
      ? 'اختر موقعك'
      : 'Choose a location';
  const searchLabel = ar ? 'ابحث عن خدمة أو مهنة أو منتج' : 'Search services, trades or products';
  return (
    <MobileShell home>
      <View style={s.hero}>
        <HomePhoto crop="hero" style={s.heroPhoto} />
        <View style={s.heroContent}>
          <Heading>{ar ? 'من حارتك، لكلّ سوريا.' : 'Find it close to home.'}</Heading>
          <Copy variant="muted">
            {ar
              ? 'تسوّق من متاجر منزلية، واعثر على مستقلّ أو مهني يناسبك.'
              : 'Find a freelancer, a trusted tradesperson or something made at home.'}
          </Copy>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel={searchLabel}
            onPress={() => router.push({ pathname: '/catalog', params: { showSearch: '1' } })}
            style={s.search}
          >
            <Image tintColor={colors.green} source={design.search} style={s.searchIcon} />
            <Text style={[s.searchLabel, readingStyle(locale)]}>{searchLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            hitSlop={3}
            onPress={() => router.push('/location')}
            style={s.location}
          >
            <Image tintColor={colors.green} source={design.pin} style={s.pin} />
            <Text style={[s.locationLabel, readingStyle(locale, true)]}>{chooseLocation}</Text>
            <Image tintColor={colors.green} source={design.chevron} style={s.chevron} />
          </Pressable>
        </View>
      </View>
      <Heading small>{ar ? 'استكشف السوق' : 'Explore the marketplace'}</Heading>
      {entries.map(([workspace, crop, a, e, descA, descE]) => (
        <Pressable
          key={workspace}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/catalog', params: { workspace } })}
          style={({ pressed }) => [s.card, pressed && s.pressed]}
        >
          <HomePhoto crop={crop} style={s.thumb} />
          <View style={s.cardContent}>
            <Copy variant="label" style={s.cardTitle}>
              {ar ? a : e}
            </Copy>
            <Copy variant="muted" style={s.cardDescription}>
              {ar ? descA : descE}
            </Copy>
          </View>
          <Image
            tintColor={colors.green}
            source={design.arrow}
            style={[s.arrow, !ar && s.mirror]}
          />
        </Pressable>
      ))}
      {!ready && <Busy />}
      <Copy variant="muted" style={s.simulated}>
        {ar ? 'مدفوعات بالمحاكاة' : 'Simulated payments'}
      </Copy>
    </MobileShell>
  );
}

const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    hero: {
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
      backgroundColor: colors.paper,
    },
    photo: { overflow: 'hidden', backgroundColor: colors.mint, direction: 'ltr' },
    heroPhoto: { height: 96 },
    heroContent: { paddingHorizontal: 13, paddingVertical: 12, gap: 5 },
    search: {
      minHeight: 46,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchIcon: { width: 18, height: 18 },
    searchLabel: { flex: 1, fontSize: 13, lineHeight: 22, color: colors.muted },
    location: {
      minHeight: 38,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    locationLabel: { fontSize: 12, lineHeight: 20, color: colors.green },
    pin: { width: 17, height: 17 },
    chevron: { width: 14, height: 14 },
    card: {
      minHeight: 95,
      padding: 8,
      gap: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 15,
    },
    thumb: { width: 86, height: 77, borderRadius: 11 },
    cardContent: { flex: 1, minWidth: 0, gap: 4 },
    cardTitle: { fontSize: 16, lineHeight: 22 },
    cardDescription: { fontSize: 12, lineHeight: 19 },
    arrow: { width: 16, height: 16 },
    mirror: { transform: [{ scaleX: -1 }] },
    pressed: { backgroundColor: colors.mint },
    simulated: { marginTop: 8, fontSize: 12 },
  }),
);
