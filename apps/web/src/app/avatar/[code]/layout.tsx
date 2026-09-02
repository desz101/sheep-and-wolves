import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Pick your sheep — ${code?.toUpperCase()}`,
    description: `Choose your avatar before game ${code?.toUpperCase()} starts.`,
    robots: { index: false, follow: false },
  };
}

export default function AvatarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
