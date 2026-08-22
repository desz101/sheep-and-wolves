import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const gameCode = code?.toUpperCase();
  return {
    title: `Game ${gameCode}`,
    description: `Join game ${gameCode} on Sheep & Wolves.`,
    robots: { index: false, follow: false },
  };
}

export default function GameLayout({ children }: LayoutProps<'/game/[code]'>) {
  return children;
}
