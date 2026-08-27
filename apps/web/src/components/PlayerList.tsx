'use client';

import { ClientPlayer } from '@sw/shared';
import { useLanguage } from '@/lib/i18n';

export function PlayerList({ players, showVoted = false }: { players: ClientPlayer[]; showVoted?: boolean }) {
  const { t } = useLanguage();
  return (
    <ul className="flex flex-col divide-y divide-panel-border">
      {players.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                !p.isAlive ? 'bg-transparent' : p.connectionStatus === 'connected' ? 'bg-accent-2' : 'bg-yellow-500'
              }`}
              title={p.connectionStatus}
            />
            <span className={`truncate font-semibold ${p.isAlive ? '' : 'text-muted line-through'}`}>
              {p.name}
              {p.isSelf && <span className="ml-1 text-xs font-normal text-muted">{t.playerList.you}</span>}
            </span>
            {p.isHost && (
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                {t.playerList.host}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            {!p.isAlive ? (
              <span className="flex items-center gap-1 font-bold text-wolf">
                ❌ {p.revealedRole === 'wolf' ? t.playerList.wolf : p.revealedRole === 'sheep' ? t.playerList.sheep : ''}
              </span>
            ) : showVoted && p.hasVoted ? (
              <span className="font-semibold text-accent-2">{t.playerList.voted}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
