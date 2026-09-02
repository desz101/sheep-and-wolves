import type { Metadata } from 'next';

const TITLE = 'Privacy Policy';
const DESCRIPTION =
  'What Sheep & Wolves collects, why, and how long it is kept — including the host IP address and browser details recorded when a game is created.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
    url: '/privacy',
  },
  twitter: {
    title: `${TITLE} | Sheep & Wolves`,
    description: DESCRIPTION,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
