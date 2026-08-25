import type { Metadata } from 'next';
import { HowToPlayContent } from './HowToPlayContent';

const TITLE = 'How to Play';
const DESCRIPTION =
  'Learn how to play Sheep & Wolves: game setup, roles, question cards, discussion, voting, and win conditions — plus answers to frequently asked questions.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/how-to-play' },
  openGraph: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
    url: '/how-to-play',
  },
  twitter: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
  },
};

export default function HowToPlayPage() {
  return <HowToPlayContent />;
}
