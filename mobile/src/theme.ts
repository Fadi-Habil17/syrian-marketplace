import { Platform, type TextStyle } from 'react-native';

export const colors = {
  ink: '#192f2a',
  green: '#10554c',
  cream: '#faf6ed',
  paper: '#fffdf8',
  muted: '#486158',
  line: '#d8dfd4',
  mint: '#e5efe7',
  gold: '#e8b665',
};

export const design = {
  brand: require('../assets/design/brand.svg'),
  globe: require('../assets/design/globe.svg'),
  home: require('../assets/design/home.svg'),
  explore: require('../assets/design/explore.svg'),
  orders: require('../assets/design/orders.svg'),
  account: require('../assets/design/user.svg'),
  search: require('../assets/design/search.svg'),
  arrow: require('../assets/design/arrow.svg'),
  pin: require('../assets/design/pin.svg'),
  chevron: require('../assets/design/chevron.svg'),
};

export function readingStyle(locale: 'ar' | 'en', bold = false): TextStyle {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  return {
    direction,
    writingDirection: direction,
    // Android Fabric resolves the default alignment from the paragraph direction.
    textAlign: Platform.OS === 'android' ? 'auto' : locale === 'ar' ? 'right' : 'left',
    includeFontPadding: false,
    ...(locale === 'ar'
      ? { fontFamily: bold ? 'NotoSansArabic_700Bold' : 'NotoSansArabic_400Regular' }
      : { fontWeight: bold ? '700' : '400' }),
  };
}
