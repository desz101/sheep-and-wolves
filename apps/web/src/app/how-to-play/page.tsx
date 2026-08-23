import type { Metadata } from 'next';
import Link from 'next/link';
import { Panel } from '@/components/ui';

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

const faqs = [
  {
    question: 'What is Sheep & Wolves?',
    answer:
      "Sheep & Wolves is a free, real-time social deduction party game played on everyone's phones. Most players are secretly sheep and a hidden few are wolves. The group discusses out loud and votes each round to eliminate a suspected wolf, trying to find every wolf before the wolves outnumber the sheep.",
  },
  {
    question: 'How many players do I need?',
    answer:
      'You need at least 3 players, and up to 30 can join a single game. The host picks the player count and the number of wolves when setting up the game — the app automatically caps the wolf count so sheep always start in the majority.',
  },
  {
    question: 'Do players need to download an app?',
    answer:
      "No. Sheep & Wolves runs entirely in the browser. The host creates a game and shares a short code or QR code, and everyone else joins from their own phone's browser — nothing to install.",
  },
  {
    question: 'Do we need to be in the same room?',
    answer:
      "Sheep & Wolves is designed to be played in person. Everyone uses their own phone to see their secret role and vote, but the discussion happens out loud, face to face, which is what makes reading the room — and catching the wolves — possible.",
  },
  {
    question: 'How does a round work?',
    answer:
      "Each round, one player draws a question card and reads it aloud (things like \"who's being unusually quiet?\"). That starts the discussion timer, which the host sets when creating the game. When time is up, everyone votes for who they think is a wolf, and the player with the most votes is eliminated and their role is revealed.",
  },
  {
    question: 'What happens if a vote ties?',
    answer:
      'If two or more players tie for the most votes, those tied players go to a quick tiebreaker vote among the rest of the group instead of eliminating no one.',
  },
  {
    question: 'How do sheep win? How do wolves win?',
    answer:
      "Sheep win once every wolf has been voted out. Wolves win if they ever equal or outnumber the remaining sheep — so the sheep need to find every wolf before that happens. If the game ever comes down to one sheep and one wolf, the wolf wins that final standoff automatically.",
  },
  {
    question: 'Is Sheep & Wolves like Werewolf or Mafia?',
    answer:
      "Yes — Sheep & Wolves is a phone-based take on classic hidden-role social deduction games like Werewolf and Mafia. Instead of a moderator managing roles and votes on paper, everyone's phone handles roles, timers, and voting automatically, so any group can pick up and play with no experience needed.",
  },
  {
    question: 'Is Sheep & Wolves free to play?',
    answer: 'Yes, Sheep & Wolves is completely free to host and join, with no account or app download required.',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function HowToPlayPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 p-4 pb-16 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-black tracking-tight">How to Play Sheep &amp; Wolves</h1>
        <p className="max-w-sm text-sm text-muted">
          A free real-time social deduction party game for 3–30 players. Here&apos;s everything you need to run a
          round.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Setup</h2>
        <Panel className="flex flex-col gap-4 p-6 text-sm text-muted">
          <p>
            <span className="font-bold text-foreground">1. Host creates the game.</span> The host picks how many
            people are playing (3–30), how many are wolves, and how long the discussion timer runs, then shares the
            game code or QR code with the group.
          </p>
          <p>
            <span className="font-bold text-foreground">2. Everyone joins from their phone.</span> Players scan the
            QR code or enter the game code and a name — no app download or account needed.
          </p>
          <p>
            <span className="font-bold text-foreground">3. Roles are dealt secretly.</span> Most players are dealt
            sheep and a hidden few are dealt wolves. Only you can see your own role.
          </p>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Playing a round</h2>
        <Panel className="flex flex-col gap-4 p-6 text-sm text-muted">
          <p>
            <span className="font-bold text-foreground">4. Draw a question card.</span> One player draws a
            discussion prompt and reads it aloud — that starts the timer.
          </p>
          <p>
            <span className="font-bold text-foreground">5. Discuss out loud.</span> Talk it out as a group in person
            until the timer runs out. Wolves try to blend in; sheep try to spot who&apos;s lying.
          </p>
          <p>
            <span className="font-bold text-foreground">6. Vote.</span> Everyone votes for who they suspect is a
            wolf. The player with the most votes is eliminated and their role is revealed. Ties go to a quick
            tiebreaker vote.
          </p>
          <p>
            <span className="font-bold text-foreground">7. Repeat until someone wins.</span> Sheep win once every
            wolf is voted out. Wolves win if they ever equal or outnumber the remaining sheep.
          </p>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Frequently asked questions</h2>
        <Panel className="divide-y divide-panel-border p-2">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-4">
              <summary className="cursor-pointer list-none text-sm font-bold text-foreground marker:content-none">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm text-muted">{faq.answer}</p>
            </details>
          ))}
        </Panel>
      </section>

      <div className="flex w-full flex-col gap-4">
        <Link
          href="/create"
          className="w-full rounded-2xl bg-accent px-6 py-5 text-center text-lg font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
        >
          Host a Game
        </Link>
        <Link
          href="/"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-center text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
