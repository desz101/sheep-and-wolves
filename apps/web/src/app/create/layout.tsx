import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host a Game',
  description:
    'Set up a Sheep & Wolves game: choose your player count, wolf count, and discussion timer, then share the code or QR to invite your group.',
  alternates: { canonical: '/create' },
};

export default function CreateLayout({ children }: LayoutProps<'/create'>) {
  return children;
}
