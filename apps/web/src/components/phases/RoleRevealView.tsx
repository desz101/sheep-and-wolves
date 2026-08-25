'use client';

import { ClientGameState } from '@sw/shared';
import { RoleCard } from '../RoleCard';
import { Panel } from '../ui';
import { useGame } from '@/lib/GameContext';
import { useLanguage } from '@/lib/i18n';

export function RoleRevealView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const { t } = useLanguage();

  if (!state.selfRole) {
    return <p className="text-center text-muted">{t.roleReveal.assigningRoles}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <RoleCard role={state.selfRole} onConfirm={actions.revealRoleAck} />
      <Panel className="w-full max-w-xs p-4 text-center">
        <p className="text-sm text-muted">
          <span className="font-bold text-foreground">
            {state.playersRevealedCount} / {state.playersJoinedCount}
          </span>{' '}
          {t.roleReveal.haveRevealed}
        </p>
      </Panel>
    </div>
  );
}
