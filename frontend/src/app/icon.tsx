import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#10554c',
        borderRadius: 14,
      }}
    >
      <div
        style={{ display: 'flex', width: 34, height: 9, background: '#f7f3e9', borderRadius: 3 }}
      />
      <div
        style={{
          display: 'flex',
          width: 28,
          height: 18,
          border: '3px solid #f7f3e9',
          borderTop: '0',
          borderRadius: 2,
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', width: 9, height: 12, background: '#f7f3e9' }} />
      </div>
    </div>,
    size,
  );
}
