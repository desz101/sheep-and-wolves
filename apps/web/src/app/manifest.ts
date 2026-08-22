import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sheep & Wolves',
    short_name: 'Sheep & Wolves',
    description: 'A real-time social deduction party game for your phone.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0d17',
    theme_color: '#0b0d17',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
