'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

const GAME_URLS: Record<string, string> = {
  'The Imposter': 'https://imposter.app/',
  'Gartic Phone': 'https://garticphone.com/',
  'Skribbl.io': 'https://skribbl.io/',
  'Draw Battle': 'https://drawbattle.io/',
  Spyfall: 'https://www.spyfall.app/',
  Songlio: 'https://songl.io/',
  'Jigsaw Explorer': 'https://www.jigsawexplorer.com/',
  GeoGuessr: 'https://www.geoguessr.com/',
};

export function PartyGameIdeasContent() {
  const { t } = useLanguage();
  const games = t.partyGameIdeas.games;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.partyGameIdeas.title,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Sheep & Wolves',
        url: 'https://sheepandwolves.app/',
      },
      ...games.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: game.name,
        url: GAME_URLS[game.name],
      })),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 p-4 pb-16 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-black tracking-tight">{t.partyGameIdeas.title}</h1>
        <p className="max-w-sm text-sm text-muted">{t.partyGameIdeas.subtitle}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.partyGameIdeas.startHereHeading}</h2>
        <Panel className="flex flex-col gap-4 border-accent/40 bg-accent/10 p-6">
          <div className="flex items-center gap-2 text-3xl">
            <span>🐑</span>
            <span className="text-xl text-muted">&amp;</span>
            <span>🐺</span>
          </div>
          <h3 className="text-xl font-black">Sheep &amp; Wolves</h3>
          <p className="text-sm text-muted">{t.partyGameIdeas.intro}</p>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="flex-1 rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
            >
              {t.partyGameIdeas.hostGame}
            </Link>
            <Link
              href="/how-to-play"
              className="flex-1 rounded-2xl border border-panel-border bg-white/5 px-4 py-3 text-center text-sm font-bold text-foreground transition active:scale-[0.98]"
            >
              {t.partyGameIdeas.howToPlay}
            </Link>
          </div>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.partyGameIdeas.moreGamesHeading}</h2>
        <p className="text-sm text-muted">{t.partyGameIdeas.moreGamesIntro}</p>
        <Panel className="divide-y divide-panel-border p-2">
          {games.map((game) => (
            <div key={game.name} className="flex flex-col gap-1 p-4">
              <a
                href={GAME_URLS[game.name]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-foreground underline decoration-panel-border underline-offset-4 hover:text-accent"
              >
                {game.name}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </a>
              <p className="text-sm text-muted">{game.blurb}</p>
            </div>
          ))}
        </Panel>
      </section>

      <Link
        href="/"
        className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-center text-lg font-bold text-foreground transition active:scale-[0.98]"
      >
        {t.partyGameIdeas.backToHome}
      </Link>
    </main>
  );
}
