'use client';
import { useRef, useState } from 'react';
import { LocationMap, locate, type Point } from './location-map';
import type { Locale } from '../lib/locale';
export function PinField({
  locale,
  initial,
  center,
}: {
  locale: Locale;
  initial?: Point | null;
  center?: Point | null;
}) {
  const ar = locale === 'ar';
  const [lat, setLat] = useState(initial?.latitude.toString() ?? '');
  const [lon, setLon] = useState(initial?.longitude.toString() ?? '');
  const [dirty, change] = useState(false);
  const [removed, remove] = useState(false);
  const [error, setError] = useState(false);
  const seq = useRef(0);
  const point =
    lat.trim() && lon.trim() && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180
      ? { latitude: Number(lat), longitude: Number(lon) }
      : undefined;
  const modified = () => {
    seq.current++;
    change(true);
    remove(false);
  };
  function select(p: Point) {
    modified();
    setLat(String(p.latitude));
    setLon(String(p.longitude));
  }
  async function gps() {
    const id = ++seq.current;
    setError(false);
    try {
      const p = await locate();
      if (seq.current === id) select(p);
    } catch {
      if (seq.current === id) setError(true);
    }
  }
  return (
    <fieldset>
      <legend>{ar ? 'دبوس الوجهة الخاص (اختياري)' : 'Private destination pin (optional)'}</legend>
      <LocationMap
        locale={locale}
        center={point ?? center}
        entries={point ? [{ id: 'pin', point, label: ar ? 'الوجهة' : 'Destination' }] : []}
        select={select}
      />
      <button type="button" onClick={() => void gps()}>
        {ar ? 'استخدم موقعي' : 'Use my location'}
      </button>
      {error && (
        <p role="status">
          {ar
            ? 'تعذّر تحديد موقعك. اختر النقطة يدويًا.'
            : 'Location unavailable. Choose the point manually.'}
        </p>
      )}
      <label>
        {ar ? 'خط العرض' : 'Latitude'}
        <input
          type="number"
          min="-90"
          max="90"
          step="any"
          value={lat}
          required={!!lon || (dirty && !removed)}
          name={dirty ? 'pin.latitude' : undefined}
          onChange={(e) => {
            modified();
            setLat(e.target.value);
          }}
        />
      </label>
      <label>
        {ar ? 'خط الطول' : 'Longitude'}
        <input
          type="number"
          min="-180"
          max="180"
          step="any"
          value={lon}
          required={!!lat || (dirty && !removed)}
          name={dirty ? 'pin.longitude' : undefined}
          onChange={(e) => {
            modified();
            setLon(e.target.value);
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          modified();
          remove(true);
          setLat('');
          setLon('');
        }}
      >
        {ar ? 'إزالة الدبوس' : 'Remove pin'}
      </button>
      {removed && <input type="hidden" name="pin.__null" value="true" />}
    </fieldset>
  );
}
