'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

// Source copy marks emphasis with *asterisks*; turn those spans into <em>.
function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i} className="text-foreground">
        {part.slice(1, -1)}
      </em>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function AboutContent() {
  const { t } = useLanguage();
  const a = t.aboutUs;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4 pb-16 pt-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-3xl">
          <span>🐑</span>
          <span className="text-xl text-muted">&amp;</span>
          <span>🐺</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">{a.title}</h1>
      </div>

      <Panel className="flex flex-col gap-8 p-6">
        <p className="text-base leading-relaxed text-muted">{a.intro}</p>

        {a.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground">{s.heading}</h2>
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
              {s.paragraphs.map((para, i) => (
                <p key={i}>{renderEmphasis(para)}</p>
              ))}
            </div>
          </section>
        ))}
      </Panel>

      <Panel className="border-accent/40 bg-accent/10 p-6">
        <p className="text-center text-base font-semibold italic leading-relaxed text-foreground">{a.closing}</p>
      </Panel>

      <Panel className="flex flex-col items-center gap-4 p-6 text-center">
        <h2 className="text-xl font-black">{a.ctaHeading}</h2>
        <p className="text-sm text-muted">{a.ctaBody}</p>
        <div className="flex w-full gap-3">
          <Link
            href="/create"
            className="flex-1 rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
          >
            {a.hostGame}
          </Link>
          <Link
            href="/how-to-play"
            className="flex-1 rounded-2xl border border-panel-border bg-white/5 px-4 py-3 text-center text-sm font-bold text-foreground transition active:scale-[0.98]"
          >
            {a.howToPlay}
          </Link>
        </div>
      </Panel>

      <Link href="/" className="text-center text-sm font-semibold text-accent underline underline-offset-4">
        {a.backToHome}
      </Link>
    </main>
  );
}
