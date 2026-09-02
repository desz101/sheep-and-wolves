'use client';

import { Scale } from 'lucide-react';
import { ClientGameState } from '@sw/shared';
import { useLanguage } from '@/lib/i18n';

export function TiebreakerView({ state }: { state: ClientGameState }) {
  const { t } = useLanguage();
  const names = (state.tiebreaker?.candidateIds ?? []).map((id) => state.players.find((p) => p.id === id)?.name ?? '?');

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-fade-up">
      <Scale className="h-16 w-16 text-yellow-400" strokeWidth={1.5} />
      <h2 className="text-4xl font-black tracking-tight text-yellow-400">{t.tiebreaker.title}</h2>
      <p className="text-muted">{t.tiebreaker.subtitle}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {names.map((n) => (
          <span key={n} className="rounded-full border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-lg font-bold text-yellow-300">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
