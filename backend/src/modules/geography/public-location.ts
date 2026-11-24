import type { ApiSchemas } from '@syrian-marketplace/contracts';
export type Point = ApiSchemas['GeoPoint'];
export const coverageWhere = (cityId: string, areaId?: string | null) => ({
  cityId,
  OR: [{ areaId: null }, ...(areaId ? [{ areaId }] : [])],
});
type Center = { centerLatitude: number | null; centerLongitude: number | null };
type Venue = {
  venuePublished: boolean;
  venueLatitude: number | null;
  venueLongitude: number | null;
};
export function centerOf(row: Center | null) {
  return row && row.centerLatitude !== null && row.centerLongitude !== null
    ? { latitude: row.centerLatitude, longitude: row.centerLongitude }
    : null;
}
export function venueOf(row: Venue) {
  return row.venuePublished && row.venueLatitude !== null && row.venueLongitude !== null
    ? { latitude: row.venueLatitude, longitude: row.venueLongitude }
    : null;
}
export function venueData(point: Point | null) {
  return {
    venuePublished: point !== null,
    venueLatitude: point?.latitude ?? null,
    venueLongitude: point?.longitude ?? null,
  };
}
export const publicPlaceSelect = {
  id: true,
  nameAr: true,
  nameEn: true,
  centerLatitude: true,
  centerLongitude: true,
} as const;
export const venueSelect = {
  venuePublished: true,
  venueLatitude: true,
  venueLongitude: true,
} as const;
export function publicLocation(row: Venue, city: Center | null) {
  const venue = venueOf(row),
    point = venue ?? centerOf(city);
  return {
    point,
    precision: venue ? ('PUBLIC_VENUE' as const) : point ? ('APPROXIMATE' as const) : null,
  };
}
