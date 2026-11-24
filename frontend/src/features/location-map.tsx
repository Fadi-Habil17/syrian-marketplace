'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ApiSchemas } from '../lib/api/contracts';
import type { Locale } from '../lib/locale';
export type Point = ApiSchemas['GeoPoint'];
export type MapEntry = { id: string; point: Point; label: string; open?: () => void };

export function LocationMap({
  locale,
  center,
  entries,
  select,
  focusKey = 0,
}: {
  locale: Locale;
  center?: Point | null;
  entries: MapEntry[];
  select?: (p: Point) => void;
  focusKey?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(select);
  latest.current = select;
  const editableMarker = useRef<Marker | undefined>(undefined);
  const selectedEntry = useRef(entries[0]);
  selectedEntry.current = entries[0];
  const hasPin = !!entries[0];
  const [map, setMap] = useState<LibreMap>();
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const style = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const editable = !!select;
  useEffect(() => {
    if (!style || !host.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((item) => item.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [style]);
  useEffect(() => {
    if (!visible || !host.current || !style) return;
    let disposed = false;
    let instance: LibreMap | undefined;
    void import('maplibre-gl')
      .then(({ Map, setWorkerUrl }) => {
        if (disposed || !host.current) return;
        setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href);
        instance = new Map({
          container: host.current,
          style,
          center: [38.5, 35],
          zoom: 6,
          attributionControl: { compact: true },
          transformRequest: (url) => ({
            url,
            credentials: 'same-origin',
            referrerPolicy: 'no-referrer',
          }),
        });
        instance.on('click', (e) =>
          latest.current?.({ latitude: e.lngLat.lat, longitude: e.lngLat.wrap().lng }),
        );
        instance.on('error', () => setFailed(true));
        setMap(instance);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      instance?.remove();
    };
  }, [style, visible]);
  const latitude = center?.latitude,
    longitude = center?.longitude;
  useEffect(() => {
    if (map && latitude !== undefined && longitude !== undefined)
      map.jumpTo({ center: [longitude, latitude], zoom: 13 });
  }, [map, latitude, longitude, focusKey]);
  useEffect(() => {
    if (!map || !editable || !hasPin) return;
    let disposed = false;
    let marker: Marker | undefined;
    void import('maplibre-gl').then(({ Marker }) => {
      if (disposed) return;
      const entry = selectedEntry.current!;
      marker = new Marker({ draggable: true, color: '#10554c' })
        .setLngLat([entry.point.longitude, entry.point.latitude])
        .addTo(map);
      editableMarker.current = marker;
      const element = marker.getElement();
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', entry.label);
      marker.on('dragend', () => {
        const position = marker!.getLngLat().wrap();
        latest.current?.({ latitude: position.lat, longitude: position.lng });
      });
      element.addEventListener('click', (event) => event.stopPropagation());
      element.addEventListener('keydown', (event) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const position = marker!.getLngLat();
        const step = event.shiftKey ? 0.001 : 0.0001;
        const latitude = Math.max(
          -85,
          Math.min(
            85,
            position.lat + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
          ),
        );
        const longitude =
          ((position.lng +
            (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0) +
            540) %
            360) -
          180;
        latest.current?.({ latitude, longitude });
      });
    });
    return () => {
      disposed = true;
      marker?.remove();
      editableMarker.current = undefined;
    };
  }, [map, editable, hasPin]);
  useEffect(() => {
    const entry = entries[0];
    if (!editable || !entry || !editableMarker.current) return;
    editableMarker.current.setLngLat([entry.point.longitude, entry.point.latitude]);
    editableMarker.current.getElement().setAttribute('aria-label', entry.label);
  }, [entries, editable]);
  useEffect(() => {
    if (!map || editable) return;
    let disposed = false;
    const markers: Marker[] = [];
    void import('maplibre-gl').then(({ Marker }) => {
      if (disposed) return;
      const draw = () => {
        markers.splice(0).forEach((m) => m.remove());
        const groups: { x: number; y: number; items: MapEntry[] }[] = [];
        for (const item of entries) {
          const { x, y } = map.project([item.point.longitude, item.point.latitude]);
          const group = groups.find((g) => Math.hypot(g.x - x, g.y - y) < 32);
          if (group) group.items.push(item);
          else groups.push({ x, y, items: [item] });
        }
        for (const { items } of groups) {
          const first = items[0]!;
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'map-marker';
          button.textContent = items.length > 1 ? String(items.length) : '●';
          button.setAttribute('aria-label', items.map((i) => i.label).join(', '));
          button.onclick = (e) => {
            e.stopPropagation();
            if (items.length === 1) first.open?.();
            else
              map.easeTo({
                center: [first.point.longitude, first.point.latitude],
                zoom: map.getZoom() + 2,
              });
          };
          markers.push(
            new Marker({ element: button })
              .setLngLat([first.point.longitude, first.point.latitude])
              .addTo(map),
          );
        }
      };
      draw();
      map.on('moveend', draw);
      cleanup = () => {
        map.off('moveend', draw);
      };
    });
    let cleanup = () => {};
    return () => {
      disposed = true;
      cleanup();
      markers.forEach((m) => m.remove());
    };
  }, [map, entries, editable]);
  return (
    <>
      {style && (
        <div ref={host} aria-label={locale === 'ar' ? 'خريطة' : 'Map'} style={{ height: 280 }} />
      )}
      {(!style || failed) && (
        <p role="status">
          {locale === 'ar'
            ? 'الخريطة غير متاحة. يمكنك المتابعة أدناه.'
            : 'Map unavailable. You can continue below.'}
        </p>
      )}
    </>
  );
}
export function locate(): Promise<Point> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { timeout: 10000, maximumAge: 0 },
    ),
  );
}
