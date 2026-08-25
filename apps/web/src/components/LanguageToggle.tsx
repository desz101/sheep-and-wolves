'use client';

import { useLanguage } from '@/lib/i18n';

export function LanguageToggle() {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t.toggle.ariaLabel}
      className="fixed right-4 top-4 z-20 flex items-center gap-1 rounded-full border border-panel-border bg-panel/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-sm shadow-lg transition active:scale-95"
    >
      <span className={lang === 'en' ? 'text-foreground' : 'text-muted'}>EN</span>
      <span className="text-muted">/</span>
      <span className={lang === 'es' ? 'text-foreground' : 'text-muted'}>ES</span>
    </button>
  );
}
