import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { Page, Field, Card, Copy, Button, Busy, Failure } from '../src/ui';
import { money } from '../src/money';
export default function Catalog() {
  const { workspace = 'FREELANCE' } = useLocalSearchParams<{ workspace: string }>();
  const { locale } = useSession();
  const ar = locale === 'ar';
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string>();
  const products = workspace === 'STORE';
  const result = useLoad(
    async () =>
      products
        ? unwrap(
            await api.GET('/api/v1/products', {
              params: { query: { search: query || undefined, cursor, limit: 20 } },
            }),
          )
        : unwrap(
            await api.GET('/api/v1/listings', {
              params: {
                query: {
                  kind: workspace === 'PROFESSIONAL' ? 'PROFESSIONAL_PACKAGE' : 'FREELANCE',
                  search: query || undefined,
                  cursor,
                  limit: 20,
                },
              },
            }),
          ),
    [workspace, query, cursor],
  );
  return (
    <Page
      title={
        ar
          ? products
            ? 'منتجات المتاجر المنزلية'
            : workspace === 'PROFESSIONAL'
              ? 'دليل المهنيين'
              : 'خدمات العمل الحر'
          : products
            ? 'Home store products'
            : workspace === 'PROFESSIONAL'
              ? 'Professionals'
              : 'Freelance services'
      }
    >
      <Field
        label={ar ? 'بحث' : 'Search'}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => {
          setCursor(undefined);
          setQuery(search);
        }}
      />
      <Button
        title={ar ? 'بحث' : 'Search'}
        onPress={() => {
          setCursor(undefined);
          setQuery(search);
        }}
      />
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data?.items.length === 0 && <Copy>{ar ? 'لا توجد نتائج' : 'No results'}</Copy>}
      {result.data?.items.map((item) => (
        <Card key={item.id}>
          <Copy>{ar ? item.titleAr : item.titleEn}</Copy>
          <Copy>{money(item.price)}</Copy>
          <Button
            title={ar ? 'عرض التفاصيل' : 'View details'}
            onPress={() =>
              router.push({
                pathname: '/listing',
                params: { id: item.id, product: products ? '1' : '0' },
              })
            }
          />
        </Card>
      ))}
      {result.data?.nextCursor && (
        <Button
          title={ar ? 'التالي' : 'Next'}
          onPress={() => setCursor(result.data!.nextCursor!)}
        />
      )}
    </Page>
  );
}
