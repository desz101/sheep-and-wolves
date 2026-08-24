import Link from 'next/link';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sheep & Wolves',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Any (web browser)',
  description:
    'Free real-time social deduction party game. Host a game, share the code, and find the wolves before they outnumber the sheep. No app download required.',
  url: 'https://sheepandwolves.app',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-12 p-6 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1 text-6xl">
          <span>🐑</span>
          <span className="text-4xl text-muted">&amp;</span>
          <span>🐺</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Sheep &amp; Wolves</h1>
        <p className="max-w-xs text-muted">
          A real-time social deduction party game. Gather your group, grab your phones, and find the wolves before
          it&apos;s too late.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Link
          href="/create"
          className="w-full rounded-2xl bg-accent px-6 py-5 text-lg font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
        >
          Host a Game
        </Link>
        <Link
          href="/join"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          Join a Game
        </Link>
      </div>

      <div className="flex w-full flex-col gap-3 text-left text-sm text-muted">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">How it works</h2>
        <ol className="flex flex-col gap-2">
          <li>
            <span className="font-bold text-foreground">1. Host sets up the round.</span> Pick a player count, wolf
            count, and discussion timer, then share the code or QR.
          </li>
          <li>
            <span className="font-bold text-foreground">2. Everyone gets a secret role.</span> Most players are
            sheep; a hidden few are wolves.
          </li>
          <li>
            <span className="font-bold text-foreground">3. Discuss, then vote.</span> Talk it out in person, then
            vote out who you think is a wolf before they outnumber the sheep.
          </li>
        </ol>
        <Link href="/how-to-play" className="text-center text-sm font-semibold text-accent underline underline-offset-4">
          Full rules &amp; FAQ
        </Link>
        <Link
          href="/party-game-ideas"
          className="text-center text-sm font-semibold text-accent underline underline-offset-4"
        >
          More games for game night
        </Link>
      </div>
    </main>
  );
}
