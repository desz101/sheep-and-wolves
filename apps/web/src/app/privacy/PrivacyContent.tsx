'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

const CONTACT_EMAIL = 'privacy@sheepandwolves.app';

const RESOURCES: { key: 'livekitLink' | 'googlePrivacyLink' | 'adSettingsLink'; href: string }[] = [
  { key: 'livekitLink', href: 'https://livekit.io/legal/privacy-policy' },
  { key: 'googlePrivacyLink', href: 'https://policies.google.com/privacy' },
  { key: 'adSettingsLink', href: 'https://adssettings.google.com' },
];

// The contact paragraph is authored (in every language) with the literal email
// address in it; turn just that span into a mailto link.
function renderParagraph(text: string): ReactNode {
  const idx = text.indexOf(CONTACT_EMAIL);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2">
        {CONTACT_EMAIL}
      </a>
      {text.slice(idx + CONTACT_EMAIL.length)}
    </>
  );
}

export function PrivacyContent() {
  const { t } = useLanguage();
  const p = t.privacy;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4 pb-16 pt-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">{p.title}</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {p.updatedLabel} {p.date}
        </p>
      </div>

      <Panel className="flex flex-col gap-8 p-6">
        <p className="text-sm leading-relaxed text-muted">{p.intro}</p>

        {p.sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-foreground">{s.heading}</h2>
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
              {s.paragraphs.map((para, i) => (
                <p key={i}>{renderParagraph(para)}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-foreground">{p.resourcesHeading}</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {RESOURCES.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  className="text-accent underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p[r.key]}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Panel>

      <Link href="/" className="text-center text-sm font-semibold text-accent underline underline-offset-4">
        {p.backToHome}
      </Link>
    </main>
  );
}
