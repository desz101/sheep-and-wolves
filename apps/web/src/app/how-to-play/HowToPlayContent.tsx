'use client';

import Link from 'next/link';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function HowToPlayContent() {
  const { t } = useLanguage();
  const faqs = t.howToPlay.faqs;

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 p-4 pb-16 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-black tracking-tight">{t.howToPlay.title}</h1>
        <p className="max-w-sm text-sm text-muted">{t.howToPlay.subtitle}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.howToPlay.setupHeading}</h2>
        <Panel className="flex flex-col gap-4 p-6 text-sm text-muted">
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.setup1Title}</span> {t.howToPlay.setup1Body}
          </p>
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.setup2Title}</span> {t.howToPlay.setup2Body}
          </p>
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.setup3Title}</span> {t.howToPlay.setup3Body}
          </p>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.howToPlay.roundHeading}</h2>
        <Panel className="flex flex-col gap-4 p-6 text-sm text-muted">
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.round4Title}</span> {t.howToPlay.round4Body}
          </p>
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.round5Title}</span> {t.howToPlay.round5Body}
          </p>
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.round6Title}</span> {t.howToPlay.round6Body}
          </p>
          <p>
            <span className="font-bold text-foreground">{t.howToPlay.round7Title}</span> {t.howToPlay.round7Body}
          </p>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.howToPlay.faqHeading}</h2>
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
          {t.howToPlay.hostGame}
        </Link>
        <Link
          href="/party-game-ideas"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-center text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          {t.howToPlay.moreGames}
        </Link>
        <Link
          href="/"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-center text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          {t.howToPlay.backToHome}
        </Link>
      </div>
    </main>
  );
}
