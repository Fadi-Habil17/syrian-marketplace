import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import type { ApiSchemas } from '../src/api/contracts';
import { useLoad } from '../src/use-load';
import { useSession } from '../src/state/session';
import { useBrowseLocation } from '../src/state/browse-location';
import { Page, Field, Card, Copy, Button, Busy, Failure } from '../src/ui';
import { CatalogCard } from '../src/catalog-card';
import { colors } from '../src/theme';
import { listingQuery, productQuery } from '../src/catalog-query';

export default function Catalog() {
  const params = useLocalSearchParams<{ workspace: string; showSearch: string }>();
  const workspace = params.workspace ?? 'FREELANCE';
  return (
    <CatalogPage
      key={workspace}
      workspace={workspace}
      startWithSearch={params.showSearch === '1'}
    />
  );
}

function CatalogPage({
  workspace,
  startWithSearch,
}: {
  workspace: string;
  startWithSearch: boolean;
}) {
  const { locale } = useSession();
  const { location, setLocation } = useBrowseLocation();
  const ar = locale === 'ar';
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<{ cursor: string; location: typeof location }>();
  const [category, setCategory] = useState<ApiSchemas['Category'] | null>(null);
  const [panel, setPanel] = useState<'search' | 'categories' | null>(
    startWithSearch ? 'search' : null,
  );
  const products = workspace === 'STORE';
  const professional = workspace === 'PROFESSIONAL';
  const categoryWorkspace = products ? 'HOME_STORE' : professional ? 'PROFESSIONALS' : 'FREELANCE';
  const cursor = page?.location === location ? page?.cursor : undefined;
  const filters = {
    categoryId: category?.id,
    governorateId: location?.governorate.id,
    cityId: location?.city?.id,
  };
  const categories = useLoad(
    async () =>
      panel === 'categories'
        ? unwrap(
            await api.GET('/api/v1/categories', {
              params: { query: { workspace: categoryWorkspace, limit: 100 } },
            }),
          )
        : null,
    [panel, categoryWorkspace],
  );
  const result = useLoad(
    async () =>
      products
        ? unwrap(
            await api.GET('/api/v1/products', {
              params: { query: productQuery(query, cursor, filters) },
            }),
          )
        : unwrap(
            await api.GET('/api/v1/listings', {
              params: { query: listingQuery(workspace, query, cursor, filters) },
            }),
          ),
    [workspace, query, cursor, filters.categoryId, filters.governorateId, filters.cityId],
  );
  const heading = products
    ? ar
      ? 'منتجات المتاجر المنزلية'
      : 'Home store products'
    : professional
      ? ar
        ? 'دليل المهنيين'
        : 'Professionals'
      : ar
        ? 'خدمات العمل الحر'
        : 'Freelance services';
  const description = products
    ? ar
      ? 'تسوّق منتجات من متاجر منزلية سورية.'
      : 'Browse products from local Syrian home stores.'
    : professional
      ? ar
        ? 'اعثر على مهني في منطقتك.'
        : 'Find skilled trades and local services near you.'
      : ar
        ? 'تصفّح خدمات التصميم والكتابة والبرمجة، واختر ما يناسب مشروعك.'
        : 'Find design, writing and development services for your next project.';
  function submitSearch() {
    setPage(undefined);
    setQuery(search.trim());
    setPanel(null);
  }
  function selectCategory(next: ApiSchemas['Category'] | null) {
    setPage(undefined);
    setCategory(next);
    setPanel(null);
  }
  const selectedPlace = location?.city ?? location?.governorate;
  const hasFilters = Boolean(query || category || selectedPlace);
  const placeLabel = selectedPlace && (ar ? selectedPlace.nameAr : selectedPlace.nameEn);
  const categoryLabel = category && (ar ? category.nameAr : category.nameEn);
  return (
    <Page title={heading} backLabel={ar ? 'السوق' : 'Marketplace'}>
      <Copy variant="muted">{description}</Copy>
      <View style={s.filters}>
        <FilterTag
          title={ar ? 'التصفية' : 'Filters'}
          active={panel === 'search' || Boolean(query)}
          onPress={() => setPanel(panel === 'search' ? null : 'search')}
        />
        <FilterTag
          title={categoryLabel || (ar ? 'الفئة' : 'Category')}
          active={panel === 'categories' || Boolean(category)}
          onPress={() => setPanel(panel === 'categories' ? null : 'categories')}
        />
        <FilterTag
          title={placeLabel || (ar ? 'الموقع' : 'Location')}
          active={Boolean(selectedPlace)}
          onPress={() => router.push('/location')}
        />
      </View>
      {panel === 'search' && (
        <Card>
          <Field
            label={ar ? 'بحث' : 'Search'}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
          />
          <Button title={ar ? 'بحث' : 'Search'} onPress={submitSearch} />
        </Card>
      )}
      {panel === 'categories' && (
        <Card>
          {categories.loading && <Busy />}
          {categories.error && (
            <Failure message={categories.error} retry={() => void categories.reload()} />
          )}
          <Button
            variant="outline"
            title={ar ? 'كل الفئات' : 'All categories'}
            onPress={() => selectCategory(null)}
          />
          {categories.data?.items.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              title={ar ? item.nameAr : item.nameEn}
              onPress={() => selectCategory(item)}
            />
          ))}
        </Card>
      )}
      {result.loading && <Busy />}
      {result.error && <Failure message={result.error} retry={() => void result.reload()} />}
      {result.data && (
        <View style={s.resultBar}>
          <Copy variant="muted">
            {new Intl.NumberFormat(locale).format(result.data.items.length)}{' '}
            {ar ? 'النتائج المعروضة' : 'results shown'}
          </Copy>
          {hasFilters && (
            <Button
              variant="link"
              title={ar ? 'مسح التصفية' : 'Clear filters'}
              onPress={() => {
                setSearch('');
                setQuery('');
                setCategory(null);
                setLocation(null);
                setPage(undefined);
              }}
            />
          )}
        </View>
      )}
      {result.data?.items.length === 0 && <Copy>{ar ? 'لا توجد نتائج' : 'No results'}</Copy>}
      <View style={s.results}>
        {result.data?.items.map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </View>
      {result.data?.nextCursor && (
        <Button
          variant="outline"
          title={ar ? 'التالي' : 'Next'}
          onPress={() => setPage({ cursor: result.data!.nextCursor!, location })}
        />
      )}
    </Page>
  );
}

function FilterTag({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.tag, active && s.selected]}
    >
      <Copy variant="label" style={s.tagText}>
        {title}
      </Copy>
    </Pressable>
  );
}

const s = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    minHeight: 44,
    maxWidth: '100%',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tagText: { color: colors.green },
  selected: { backgroundColor: colors.mint },
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  results: { gap: 10 },
});
