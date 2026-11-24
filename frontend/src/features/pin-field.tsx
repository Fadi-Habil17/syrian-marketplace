'use client';
import { useState } from 'react';
import { LocationPicker } from './location-picker';
import type { Point } from './location-map';
import type { Locale } from '../lib/locale';

export function PinField({
  locale,
  initial,
  initialCityId,
}: {
  locale: Locale;
  initial?: Point | null;
  initialCityId?: string;
}) {
  const [point, setPoint] = useState<Point | null>(initial ?? null);
  const [dirty, setDirty] = useState(false);
  const ar = locale === 'ar';
  return (
    <fieldset className="pin-field">
      <legend>{ar ? 'موقع التوصيل' : 'Delivery location'}</legend>
      <LocationPicker
        locale={locale}
        value={point}
        initialCityId={initialCityId}
        cityName="cityId"
        onChange={(next) => {
          setPoint(next);
          setDirty(true);
        }}
      />
      {dirty && point && (
        <>
          <input type="hidden" name="pin.latitude" value={point.latitude} />
          <input type="hidden" name="pin.longitude" value={point.longitude} />
        </>
      )}
      {dirty && !point && <input type="hidden" name="pin.__null" value="true" />}
      {point && (
        <button
          type="button"
          className="button outline"
          onClick={() => {
            setPoint(null);
            setDirty(true);
          }}
        >
          {ar ? 'إزالة الدبوس' : 'Remove pin'}
        </button>
      )}
    </fieldset>
  );
}
