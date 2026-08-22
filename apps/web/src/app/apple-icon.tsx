import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'radial-gradient(circle at 50% 0%, #1a1f3d 0%, #0b0d17 60%, #08090f 100%)',
          fontSize: 92,
        }}
      >
        <span>🐑</span>
        <span>🐺</span>
      </div>
    ),
    { ...size }
  );
}
