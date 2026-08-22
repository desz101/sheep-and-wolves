'use client';

import { ClientGameState } from '@sw/shared';
import { BigButton, Badge, Panel, SectionLabel } from '../ui';
import { PlayerList } from '../PlayerList';
import { QrCode } from '../QrCode';
import { useGame } from '@/lib/GameContext';

export function LobbyView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const isHost = state.hostPlayerId === state.selfPlayerId;
  const joined = state.players.length;
  const needed = state.config.maxPlayers;
  const canStart = joined >= needed;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${state.gameCode}` : '';

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col items-center gap-4 p-6 text-center">
        <SectionLabel>Your Game Code</SectionLabel>
        <div className="text-5xl font-black tracking-[0.15em] text-accent">{state.gameCode}</div>
        <p className="text-sm text-muted">Share this code with everyone playing, or have them scan the QR code.</p>
        {joinUrl && <QrCode value={joinUrl} />}
      </Panel>

      <Panel className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Players Joined</SectionLabel>
          <Badge tone={canStart ? 'sheep' : 'muted'}>
            {joined} / {needed}
          </Badge>
        </div>
        <PlayerList players={state.players} />
      </Panel>

      {isHost ? (
        <div className="flex flex-col gap-3">
          <BigButton variant="primary" disabled={!canStart} onClick={actions.startGame}>
            {canStart ? 'Start Game' : `Waiting for ${needed - joined} more player${needed - joined === 1 ? '' : 's'}…`}
          </BigButton>
          <BigButton variant="ghost" onClick={() => confirm('End this game for everyone?') && actions.hostEndGame()}>
            End Game
          </BigButton>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Waiting for the host to start the game…</p>
      )}
    </div>
  );
}
