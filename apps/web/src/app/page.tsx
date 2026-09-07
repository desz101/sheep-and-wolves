'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PublicGameSummary } from '@sw/shared';
import { fetchPublicGames } from '@/lib/api';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import { ORGANIZATION_ID } from '@/lib/seo';

// Refetch interval for the public games list. Not a live game screen, so no
// need for the ~1.5s cadence a game-in-progress polls at -- this only needs
// to be fresh enough that a stale "still open" card is rare.
const PUBLIC_GAMES_POLL_MS = 5000;

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
  publisher: { '@id': ORGANIZATION_ID },
  creator: { '@id': ORGANIZATION_ID },
};

export default function Home() {
  const { t } = useLanguage();
  const [publicGames, setPublicGames] = useState<PublicGameSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchPublicGames();
        if (!cancelled) setPublicGames(body);
      } catch {
        // Best-effort -- a failed refresh just leaves the last known list showing.
      }
    }

    load();
    const interval = setInterval(load, PUBLIC_GAMES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
        <p className="max-w-xs text-muted">{t.home.tagline}</p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Link
          href="/create"
          className="w-full rounded-2xl bg-accent px-6 py-5 text-lg font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
        >
          {t.home.hostGame}
        </Link>
        <Link
          href="/join"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          {t.home.joinGame}
        </Link>
      </div>

      <div className="flex w-full flex-col gap-3 text-left">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.home.publicGames}</h2>
        {publicGames.length === 0 ? (
          <p className="text-center text-sm text-muted">{t.home.noPublicGames}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {publicGames.map((game) => (
              <Panel key={game.gameCode} className="flex items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-bold text-foreground">{t.home.hostedBy(game.hostName)}</span>
                  <span className="text-xs text-muted">{t.home.playerCount(game.playerCount, game.maxPlayers)}</span>
                </div>
                <Link
                  href={`/join?code=${game.gameCode}`}
                  className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  {t.home.joinCard}
                </Link>
              </Panel>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-3 text-left text-sm text-muted">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.home.howItWorks}</h2>
        <ol className="flex flex-col gap-2">
          <li>
            <span className="font-bold text-foreground">{t.home.step1Title}</span> {t.home.step1Body}
          </li>
          <li>
            <span className="font-bold text-foreground">{t.home.step2Title}</span> {t.home.step2Body}
          </li>
          <li>
            <span className="font-bold text-foreground">{t.home.step3Title}</span> {t.home.step3Body}
          </li>
        </ol>
        <Link href="/how-to-play" className="text-center text-sm font-semibold text-accent underline underline-offset-4">
          {t.home.fullRules}
        </Link>
        <Link
          href="/party-game-ideas"
          className="text-center text-sm font-semibold text-accent underline underline-offset-4"
        >
          {t.home.moreGames}
        </Link>
      </div>
    </main>
  );
}
