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
}: {
  ar: boolean;
  center?: Point | null;
  entries: Entry[];
  select?: (p: Point) => void;
}) {
  const style = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const camera = useRef<CameraRef>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(13);
  useEffect(() => {
    if (center) camera.current?.jumpTo({ center: [center.longitude, center.latitude], zoom: 13 });
  }, [center?.latitude, center?.longitude]);
  if (!style || failed || Constants.executionEnvironment === 'storeClient')
    return (
      <Copy>
        {ar
          ? 'الخريطة غير متاحة. يمكنك المتابعة أدناه.'
          : 'Map unavailable. You can continue below.'}
      </Copy>
    );
  const { Map, Camera, Marker } =
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
    <View>
      <Map
        style={{ height: 260 }}
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
        {groups.map((items) => {
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
                style={{ color: 'white', backgroundColor: '#185343', borderRadius: 12, padding: 5 }}
              >
                {items.length > 1 ? items.length : '●'}
              </Text>
            </Marker>
          );
        })}
      </Map>
      <Copy>OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors</Copy>
    </View>
  );
}
