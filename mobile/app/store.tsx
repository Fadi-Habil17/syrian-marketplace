import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { api, unwrap } from '../src/api/client';
import { useSession } from '../src/state/session';
import { useLoad } from '../src/use-load';
import { CatalogPhoto } from '../src/catalog-photo';
import { CatalogCard } from '../src/catalog-card';
import { Busy, Button, Copy, Failure, Heading, Page } from '../src/ui';

export default function Store() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  return <StorePage key={id} id={id} />;
}

function StorePage({ id }: { id: string }) {
  const { locale } = useSession();
  const ar = locale === 'ar';
  const [cursor, setCursor] = useState<string>();
  const store = useLoad(
    async () =>
      unwrap(await api.GET('/api/v1/stores/{storeId}', { params: { path: { storeId: id } } })),
    [id],
  );
  const products = useLoad(
    async () =>
      unwrap(
        await api.GET('/api/v1/products', {
          params: { query: { storeId: id, cursor, limit: 20 } },
        }),
      ),
    [id, cursor],
  );
  return (
    <Page backLabel={ar ? 'المتاجر المنزلية' : 'Home stores'}>
      {store.loading && <Busy />}
      {store.error && <Failure message={store.error} retry={() => void store.reload()} />}
      {store.data && (
        <>
          <Heading>{ar ? store.data.nameAr : store.data.nameEn}</Heading>
          {store.data.logoId && <CatalogPhoto id={store.data.logoId} style={s.cover} />}
          <Copy>{ar ? store.data.descriptionAr : store.data.descriptionEn}</Copy>
          <Heading small>{ar ? 'منتجات المتجر' : 'From this store'}</Heading>
          {products.loading && <Busy />}
          {products.error && (
            <Failure message={products.error} retry={() => void products.reload()} />
          )}
          {products.data?.items.length === 0 && (
            <Copy>{ar ? 'لا توجد منتجات' : 'No products listed'}</Copy>
          )}
          <View style={s.products}>
            {products.data?.items.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </View>
          {products.data?.nextCursor && (
            <Button
              variant="outline"
              title={ar ? 'التالي' : 'Next'}
              onPress={() => setCursor(products.data!.nextCursor!)}
            />
          )}
        </>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  cover: { aspectRatio: 350 / 172, borderRadius: 17 },
  products: { gap: 10 },
});
