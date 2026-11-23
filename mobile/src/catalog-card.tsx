import { themedStyles } from './appearance';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ApiSchemas } from './api/contracts';
import { CatalogPhoto } from './catalog-photo';
import { money } from './money';
import { useSession } from './state/session';
import { Copy } from './ui';

export function CatalogCard({ item }: { item: ApiSchemas['Listing' | 'Product'] }) {
  const s = useStyles();
  const { locale } = useSession();
  const ar = locale === 'ar';
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() =>
        router.push({
          pathname: '/listing',
          params: { id: item.id, product: 'storeId' in item ? '1' : '0' },
        })
      }
      style={({ pressed }) => [s.card, pressed && s.pressed]}
    >
      <CatalogPhoto id={item.photoIds[0]} style={s.thumb} />
      <View style={s.copy}>
        <Copy variant="label" style={s.title}>
          {ar ? item.titleAr : item.titleEn}
        </Copy>
        {'deliveryDays' in item && item.deliveryDays !== null && (
          <Copy variant="muted">
            {item.deliveryDays} {ar ? 'أيام للتسليم' : 'days to deliver'}
          </Copy>
        )}
        {'availableStock' in item && (
          <Copy variant="muted">
            {item.availableStock} {ar ? 'متاح' : 'in stock'}
          </Copy>
        )}
        <Copy variant="price">{money(item.price)}</Copy>
      </View>
    </Pressable>
  );
}

const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    card: {
      minHeight: 136,
      flexDirection: 'row',
      padding: 7,
      gap: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 17,
      backgroundColor: colors.paper,
    },
    thumb: { width: 104, height: 120 },
    copy: { flex: 1, minWidth: 0, gap: 4, paddingEnd: 4 },
    title: { fontSize: 15, lineHeight: 22 },
    pressed: { backgroundColor: colors.mint },
  }),
);
