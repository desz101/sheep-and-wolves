'use client';

import { ClientGameState } from '@sw/shared';
import { Panel } from '../ui';
import { useLanguage } from '@/lib/i18n';

export function GameOverView({ state }: { state: ClientGameState }) {
  const { t } = useLanguage();
  const winner = state.winner;
  if (!winner) return null;
  const sheepWin = winner.team === 'sheep';

  const summary = (state.finalSummary ?? []).slice().sort((a, b) => {
    const aAlive = a.eliminatedRound === null;
    const bAlive = b.eliminatedRound === null;
    if (aAlive !== bAlive) return aAlive ? -1 : 1;
    return (a.eliminatedRound ?? 0) - (b.eliminatedRound ?? 0);
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-7xl">{sheepWin ? '🐑' : '🐺'}</span>
        <h1 className={`text-4xl font-black tracking-tight ${sheepWin ? 'text-sheep' : 'text-wolf'}`}>
          {sheepWin ? t.gameOver.sheepWin : t.gameOver.wolvesWin}
        </h1>
        <p className="text-muted">{t.gameOver.reasons[winner.reason] ?? winner.reason}</p>
        <p className="text-sm text-muted">
          {t.gameOver.summary(state.currentRound, state.finalSummary?.length ?? 0, state.config.wolfCount)}
        </p>
      </div>

      <Panel className="p-5">
        <ul className="flex flex-col divide-y divide-panel-border">
          {summary.map((p) => (
            <li key={p.playerId} className="flex items-center justify-between py-3">
              <span className="font-semibold">{p.name}</span>
              <div className="flex items-center gap-2 text-sm">
                <span className={p.role === 'wolf' ? 'font-bold text-wolf' : 'font-bold text-sheep'}>
                  {p.role === 'wolf' ? t.gameOver.wolfLabel : t.gameOver.sheepLabel}
                </span>
                <span className="text-muted">
                  {p.eliminatedRound ? t.gameOver.eliminatedRound(p.eliminatedRound) : t.gameOver.survived}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
