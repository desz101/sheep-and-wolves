'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto px-4 py-4 text-center text-[11px] text-muted">
      <Link href="/how-to-play" className="hover:text-foreground">
        {t.footer.howToPlay}
      </Link>
      <span className="mx-2 opacity-40">·</span>
      <Link href="/privacy" className="hover:text-foreground">
        {t.footer.privacy}
      </Link>
    </footer>
  );
}
