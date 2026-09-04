'use client';

import Link from 'next/link';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export function HowToPlayContent() {
  const { t } = useLanguage();
  const faqs = t.howToPlay.faqs;

  const faqCategories: { category: string; items: typeof faqs }[] = [];
  for (const faq of faqs) {
    const group = faqCategories.at(-1);
    if (group?.category === faq.category) {
      group.items.push(faq);
    } else {
      faqCategories.push({ category: faq.category, items: [faq] });
    }
  }

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
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.setup1Title}</h3>
            <p>{t.howToPlay.setup1Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.setup2Title}</h3>
            <p>{t.howToPlay.setup2Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.setup3Title}</h3>
            <p>{t.howToPlay.setup3Body}</p>
          </div>
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.howToPlay.roundHeading}</h2>
        <Panel className="flex flex-col gap-4 p-6 text-sm text-muted">
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.round4Title}</h3>
            <p>{t.howToPlay.round4Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.round5Title}</h3>
            <p>{t.howToPlay.round5Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.round6Title}</h3>
            <p>{t.howToPlay.round6Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.round7Title}</h3>
            <p>{t.howToPlay.round7Body}</p>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t.howToPlay.round8Title}</h3>
            <p>{t.howToPlay.round8Body}</p>
          </div>
        </Panel>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.howToPlay.faqHeading}</h2>
        {faqCategories.map(({ category, items }) => (
          <div key={category} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground">{category}</h3>
            <Panel className="divide-y divide-panel-border p-2">
              {items.map((faq) => (
                <details key={faq.question} className="group p-4">
                  <summary className="cursor-pointer list-none marker:content-none">
                    <h4 className="inline text-sm font-bold text-foreground">{faq.question}</h4>
                  </summary>
                  <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                </details>
              ))}
            </Panel>
          </div>
        ))}
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
