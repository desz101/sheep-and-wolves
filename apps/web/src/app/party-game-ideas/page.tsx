import type { Metadata } from 'next';
import { PartyGameIdeasContent } from './PartyGameIdeasContent';

const TITLE = 'Party Games for Game Night';
const DESCRIPTION =
  'Looking for games for game night? Here are our favorite free party games for large groups — social deduction, drawing, trivia, and more, including Sheep & Wolves.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/party-game-ideas' },
  openGraph: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
    url: '/party-game-ideas',
  },
  twitter: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
  },
};

export default function PartyGameIdeasPage() {
  return <PartyGameIdeasContent />;
}
