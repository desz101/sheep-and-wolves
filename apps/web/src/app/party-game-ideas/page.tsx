import type { Metadata } from 'next';
import Link from 'next/link';
import { Panel } from '@/components/ui';

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

const otherGames = [
  {
    name: 'The Imposter',
    url: 'https://imposter.app/',
    blurb: 'A quick social deduction game — everyone gets a word except the imposter, who has to bluff their way through.',
  },
  {
    name: 'Gartic Phone',
    url: 'https://garticphone.com/',
    blurb: "A drawing-and-guessing game with a telephone twist — watch prompts hilariously mutate as they pass around the group.",
  },
  {
    name: 'Skribbl.io',
    url: 'https://skribbl.io/',
    blurb: 'The classic browser drawing-and-guessing game — simple, fast rounds that work for almost any group size.',
  },
  {
    name: 'Draw Battle',
    url: 'https://drawbattle.io/',
    blurb: "Imagine Skribbl.io but team-based — draw and guess against another team instead of everyone for themselves.",
  },
  {
    name: "Pretend You're Xyzzy",
    url: 'https://pyx-1.pretendyoure.xyz/zy/',
    blurb: 'A free browser clone of Cards Against Humanity for groups who want the classic card-matching chaos online.',
  },
  {
    name: 'All Bad Cards',
    url: 'https://allbad.cards/',
    blurb: 'Another Cards Against Humanity-style game, with a cleaner interface and custom card packs.',
  },
  {
    name: 'Spyfall',
    url: 'https://www.spyfall.app/',
    blurb: "Everyone knows the secret location except the spy, who has to guess it before getting caught — great with a big group.",
  },
  {
    name: 'Songlio',
    url: 'https://songl.io/',
    blurb: 'A fast-paced music guessing game — great for a group with strong opinions about their playlists.',
  },
  {
    name: 'Jigsaw Explorer',
    url: 'https://www.jigsawexplorer.com/',
    blurb: 'Online jigsaw puzzles you can solve together — doing one with a big group turns into chaotic, surprisingly fun teamwork.',
  },
  {
    name: 'GeoGuessr',
    url: 'https://www.geoguessr.com/',
    blurb: 'Drop into a random Street View location and guess where in the world you are — plays great solo or as a group.',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: TITLE,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Sheep & Wolves',
      url: 'https://sheepandwolves.app/',
    },
    ...otherGames.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: game.name,
      url: game.url,
    })),
  ],
};

export default function PartyGameIdeasPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 p-4 pb-16 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-black tracking-tight">Party Games for Game Night</h1>
        <p className="max-w-sm text-sm text-muted">
          A running list of our favorite free games for game night — good for large groups, no downloads required.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Start here</h2>
        <Panel className="flex flex-col gap-4 border-accent/40 bg-accent/10 p-6">
          <div className="flex items-center gap-2 text-3xl">
            <span>🐑</span>
            <span className="text-xl text-muted">&amp;</span>
            <span>🐺</span>
          </div>
          <h3 className="text-xl font-black">Sheep &amp; Wolves</h3>
          <p className="text-sm text-muted">
            A free real-time social deduction game for 3–30 players. Everyone plays from their own phone — no app
            download needed.
          </p>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="flex-1 rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
            >
              Host a Game
            </Link>
            <Link
              href="/how-to-play"
              className="flex-1 rounded-2xl border border-panel-border bg-white/5 px-4 py-3 text-center text-sm font-bold text-foreground transition active:scale-[0.98]"
            >
              How to Play
            </Link>
          </div>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">More games to try</h2>
        <p className="text-sm text-muted">
          Other free, browser-based games we&apos;ve played and liked for group game nights.
        </p>
        <Panel className="divide-y divide-panel-border p-2">
          {otherGames.map((game) => (
            <div key={game.name} className="flex flex-col gap-1 p-4">
              <a
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-foreground underline decoration-panel-border underline-offset-4 hover:text-accent"
              >
                {game.name} ↗
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
        Back to Home
      </Link>
    </main>
  );
}
