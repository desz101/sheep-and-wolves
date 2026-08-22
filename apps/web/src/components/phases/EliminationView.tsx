'use client';

import { ClientGameState } from '@sw/shared';

export function EliminationView({ state }: { state: ClientGameState }) {
  const tally = state.voteTally;
  if (!tally || !tally.eliminatedPlayerName) return null;
  const isWolf = tally.eliminatedRole === 'wolf';

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-fade-up">
      <p className="text-lg font-bold text-muted">{tally.eliminatedPlayerName} was...</p>
      <span className="text-8xl">{isWolf ? '🐺' : '🐑'}</span>
      <h2 className={`text-4xl font-black tracking-tight ${isWolf ? 'text-wolf' : 'text-sheep'}`}>
        {tally.eliminatedPlayerName?.toUpperCase()} WAS A {isWolf ? 'WOLF' : 'SHEEP'}
      </h2>
    </div>
  );
}
