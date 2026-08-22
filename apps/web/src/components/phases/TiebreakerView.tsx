'use client';

import { ClientGameState } from '@sw/shared';

export function TiebreakerView({ state }: { state: ClientGameState }) {
  const names = (state.tiebreaker?.candidateIds ?? []).map((id) => state.players.find((p) => p.id === id)?.name ?? '?');

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-fade-up">
      <span className="text-6xl">⚖️</span>
      <h2 className="text-4xl font-black tracking-tight text-yellow-400">IT&apos;S A TIE</h2>
      <p className="text-muted">These players will go to a re-vote:</p>
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
