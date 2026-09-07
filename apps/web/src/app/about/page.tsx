import type { Metadata } from 'next';
import { AboutContent } from './AboutContent';

const TITLE = 'Why We Made This Game';
const DESCRIPTION =
  'The story behind Sheep & Wolves — why we built a party game about trust, deception, and reading the people you thought you knew.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
    url: '/about',
  },
  twitter: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
