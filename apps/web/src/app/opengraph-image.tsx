import { ImageResponse } from 'next/og';

export const alt = 'Sheep & Wolves — a real-time social deduction party game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: 'radial-gradient(circle at 50% 0%, #1a1f3d 0%, #0b0d17 60%, #08090f 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 160 }}>
          <span>🐑</span>
          <span style={{ fontSize: 90, color: '#8b8fb0' }}>&amp;</span>
          <span>🐺</span>
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, color: '#f4f3ff', letterSpacing: -2 }}>Sheep &amp; Wolves</div>
        <div style={{ fontSize: 34, color: '#8b8fb0', fontWeight: 600 }}>
          A real-time social deduction party game
        </div>
      </div>
    ),
    { ...size }
  );
}
