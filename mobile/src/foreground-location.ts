import * as Location from 'expo-location';
import type { ApiSchemas } from './api/contracts';

export async function locate(): Promise<ApiSchemas['GeoPoint']> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Location unavailable');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Location timeout')), 10000);
      }),
    ]);
    return { latitude: result.coords.latitude, longitude: result.coords.longitude };
  } finally {
    clearTimeout(timer);
  }
}
