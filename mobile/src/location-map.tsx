import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import type { ApiSchemas } from './api/contracts';
import { Copy } from './ui';
export type Point = ApiSchemas['GeoPoint'];
export { locate } from './foreground-location';
export type Entry = { id: string; point: Point; label: string; open?: () => void };
export function LocationMap({
  ar,
  center,
  entries,
  select,
  focusKey = 0,
}: {
  ar: boolean;
  center?: Point | null;
  entries: Entry[];
  select?: (p: Point) => void;
  focusKey?: number;
}) {
  const style = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const camera = useRef<CameraRef>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(13);
  useEffect(() => {
    if (center) camera.current?.jumpTo({ center: [center.longitude, center.latitude], zoom: 13 });
  }, [center?.latitude, center?.longitude, focusKey]);
  if (!style || failed || Constants.executionEnvironment === 'storeClient')
    return (
      <Copy>
        {Constants.executionEnvironment === 'storeClient'
          ? ar
            ? 'الخريطة التفاعلية تحتاج نسخة التطوير من التطبيق. يمكنك اختيار المدينة بدونها.'
            : 'Interactive maps need the development version of the app. You can still select your city.'
          : ar
            ? 'الخريطة غير متاحة. يمكنك المتابعة أدناه.'
            : 'Map unavailable. You can continue below.'}
      </Copy>
    );
  const { Map, Camera, Marker, ViewAnnotation } =
    require('@maplibre/maplibre-react-native') as typeof import('@maplibre/maplibre-react-native');
  const groups: Entry[][] = [];
  for (const item of entries) {
    const near = groups.find((g) => {
      const p = g[0]!.point;
      return (
        Math.hypot(
          (p.latitude - item.point.latitude) /
            Math.max(0.1, Math.cos((p.latitude * Math.PI) / 180)),
          p.longitude - item.point.longitude,
        ) <
        (32 * 360) / (512 * 2 ** zoom)
      );
    });
    if (near) near.push(item);
    else groups.push([item]);
  }
  return (
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Map
        style={{ height: 300, borderRadius: 16 }}
        mapStyle={style}
        onDidFailLoadingMap={() => setFailed(true)}
        onRegionDidChange={(e) => setZoom(e.nativeEvent.zoom)}
        onPress={(e) => {
          const [longitude, latitude] = e.nativeEvent.lngLat;
          select?.({ latitude, longitude });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{
            center: center ? [center.longitude, center.latitude] : [38.5, 35],
            zoom: center ? 13 : 6,
          }}
        />
        {select && entries[0] ? (
          <ViewAnnotation
            id="selected-location"
            draggable
            lngLat={[entries[0].point.longitude, entries[0].point.latitude]}
            onDragEnd={(event) => {
              const [longitude, latitude] = event.nativeEvent.lngLat;
              select({ latitude, longitude });
            }}
          >
            <View
              collapsable={false}
              accessible
              accessibilityLabel={ar ? 'اسحب الدبوس لموقعك' : 'Drag the pin to your location'}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: '#fffdf8',
                backgroundColor: '#10554c',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fffdf8', fontSize: 18 }}>●</Text>
            </View>
          </ViewAnnotation>
        ) : (
          groups.map((items) => {
            const item = items[0]!;
            return (
              <Marker
                key={item.id}
                lngLat={[item.point.longitude, item.point.latitude]}
                onPress={() =>
                  items.length === 1
                    ? item.open?.()
                    : camera.current?.jumpTo({
                        center: [item.point.longitude, item.point.latitude],
                        zoom: zoom + 2,
                      })
                }
              >
                <Text
                  accessibilityLabel={items.map((x) => x.label).join(', ')}
                  style={{
                    color: 'white',
                    backgroundColor: '#185343',
                    borderRadius: 12,
                    padding: 5,
                  }}
                >
                  {items.length > 1 ? items.length : '●'}
                </Text>
              </Marker>
            );
          })
        )}
      </Map>
    </View>
  );
}
