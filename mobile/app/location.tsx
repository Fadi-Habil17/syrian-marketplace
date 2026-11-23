import { themedStyles, useAppearance } from '../src/appearance';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { api, unwrap } from '../src/api/client';
import { useBrowseLocation } from '../src/state/browse-location';
import { useSession } from '../src/state/session';
import { useLoad } from '../src/use-load';
import { design } from '../src/theme';
import { Busy, Button, Card, Copy, Failure, Heading, Page } from '../src/ui';

type Place = { id: string; nameAr: string; nameEn: string };

export default function Location() {
  const s = useStyles();
  const { colors } = useAppearance();
  const { locale } = useSession();
  const ar = locale === 'ar';
  const { location, setLocation } = useBrowseLocation();
  const [governorate, setGovernorate] = useState(location?.governorate ?? null);
  const [city, setCity] = useState(location?.city ?? null);
  const [open, setOpen] = useState<'governorate' | 'city' | null>(null);
  const governorates = useLoad(async () => unwrap(await api.GET('/api/v1/geography/governorates')));
  const governorateId = governorate?.id;
  const cities = useLoad(
    async () =>
      governorateId
        ? unwrap(
            await api.GET('/api/v1/geography/cities', {
              params: { query: { governorateId, limit: 100 } },
            }),
          )
        : null,
    [governorateId],
  );
  const name = (place: Place) => (ar ? place.nameAr : place.nameEn);
  function finish() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return (
    <Page backLabel={ar ? 'العودة للسوق' : 'Marketplace'}>
      <Card>
        <Image tintColor={colors.green} source={design.pin} style={s.pin} />
        <Heading small>{ar ? 'اختر موقعك' : 'Choose your location'}</Heading>
        <Copy variant="muted">
          {ar
            ? 'اختر محافظة أو مدينة لتصفية النتائج في السوق.'
            : 'Choose a governorate or city to filter marketplace results.'}
        </Copy>
        <View style={s.field}>
          <Copy variant="label">{ar ? 'المحافظة' : 'Governorate'}</Copy>
          <Button
            variant="outline"
            title={governorate ? name(governorate) : ar ? 'اختر محافظة' : 'Select a governorate'}
            onPress={() => setOpen(open === 'governorate' ? null : 'governorate')}
          />
          {open === 'governorate' && (
            <>
              {governorates.loading && <Busy />}
              {governorates.error && (
                <Failure message={governorates.error} retry={() => void governorates.reload()} />
              )}
              {governorates.data?.items.map((place) => (
                <PlaceOption
                  key={place.id}
                  title={name(place)}
                  selected={place.id === governorate?.id}
                  onPress={() => {
                    if (place.id !== governorate?.id) setCity(null);
                    setGovernorate(place);
                    setOpen(null);
                  }}
                />
              ))}
            </>
          )}
        </View>
        <View style={s.field}>
          <Copy variant="label">{ar ? 'المدينة' : 'City'}</Copy>
          <Button
            variant="outline"
            disabled={!governorate}
            title={city ? name(city) : ar ? 'كل المدن' : 'All cities'}
            onPress={() => setOpen(open === 'city' ? null : 'city')}
          />
          {open === 'city' && (
            <>
              {cities.loading && <Busy />}
              {cities.error && (
                <Failure message={cities.error} retry={() => void cities.reload()} />
              )}
              <PlaceOption
                title={ar ? 'كل المدن' : 'All cities'}
                selected={!city}
                onPress={() => {
                  setCity(null);
                  setOpen(null);
                }}
              />
              {cities.data?.items.map((place) => (
                <PlaceOption
                  key={place.id}
                  title={name(place)}
                  selected={place.id === city?.id}
                  onPress={() => {
                    setCity(place);
                    setOpen(null);
                  }}
                />
              ))}
            </>
          )}
        </View>
        <Button
          title={ar ? 'استخدم هذا الموقع' : 'Use this location'}
          disabled={!governorate}
          onPress={() => {
            if (!governorate) return;
            setLocation({ governorate, city });
            finish();
          }}
        />
        <Button
          variant="outline"
          title={ar ? 'تخطّي' : 'Skip for now'}
          onPress={() => {
            setLocation(null);
            finish();
          }}
        />
      </Card>
    </Page>
  );
}

function PlaceOption({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[s.option, selected && s.selected]}
      onPress={onPress}
    >
      <Copy>{title}</Copy>
    </Pressable>
  );
}

const useStyles = themedStyles((colors) =>
  StyleSheet.create({
    pin: { width: 17, height: 17 },
    field: { gap: 5 },
    option: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 9 },
    selected: { backgroundColor: colors.mint },
  }),
);
