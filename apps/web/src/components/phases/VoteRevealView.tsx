'use client';

import { ClientGameState } from '@sw/shared';
import { Panel } from '../ui';
import { useLanguage } from '@/lib/i18n';

export function VoteRevealView({ state }: { state: ClientGameState }) {
  const { t } = useLanguage();
  const tally = state.voteTally;
  if (!tally) return null;
  const maxCount = Math.max(1, ...tally.tally.map((entry) => entry.count));

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <h2 className="text-center text-3xl font-black tracking-tight">{t.voteReveal.votesAreIn}</h2>

      <Panel className="p-5">
        <ul className="flex flex-col gap-3">
          {tally.tally
            .slice()
            .sort((a, b) => b.count - a.count)
            .map((entry) => (
              <li key={entry.playerId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={`font-bold ${entry.playerId === tally.eliminatedPlayerId ? 'text-wolf' : ''}`}>
                    {entry.playerName}
                  </span>
                  <span className="font-mono text-muted">{entry.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${entry.playerId === tally.eliminatedPlayerId ? 'bg-wolf' : 'bg-accent'}`}
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
        </ul>
      </Panel>

      {tally.eliminatedPlayerName && (
        <p className="text-center text-xl font-bold">
          <span className="text-wolf">{tally.eliminatedPlayerName}</span>
          {t.voteReveal.eliminatedSuffix}
        </p>
      )}
    </div>
  );
}
