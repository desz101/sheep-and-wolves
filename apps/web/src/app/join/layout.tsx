import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join a Game',
  description: 'Enter your game code and name to join a Sheep & Wolves party game already in progress.',
  robots: { index: false, follow: true },
};

export default function JoinLayout({ children }: LayoutProps<'/join'>) {
  return children;
}
