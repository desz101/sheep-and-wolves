'use client';

import { ClientGameState } from '@sw/shared';
import { BigButton, Badge, Panel, SectionLabel } from '../ui';
import { PlayerList } from '../PlayerList';
import { QrCode } from '../QrCode';
import { useGame } from '@/lib/GameContext';
import { useLanguage } from '@/lib/i18n';

export function LobbyView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const { t } = useLanguage();
  const isHost = state.hostPlayerId === state.selfPlayerId;
  const joined = state.players.length;
  const needed = state.config.maxPlayers;
  const canStart = joined >= needed;
  // UTM-tagged so GA can tell "someone scanned the lobby QR code" apart from
  // generic Direct traffic -- referrer-based attribution can't see this at
  // all, since scanning a QR code carries no HTTP referrer.
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${state.gameCode}&utm_source=qr_code&utm_medium=in_person&utm_campaign=lobby_join`
      : '';

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col items-center gap-4 p-6 text-center">
        <SectionLabel>{t.lobby.yourGameCode}</SectionLabel>
        <div className="text-5xl font-black tracking-[0.15em] text-accent">{state.gameCode}</div>
        <p className="text-sm text-muted">{t.lobby.shareCode}</p>
        {joinUrl && <QrCode value={joinUrl} />}
      </Panel>

      <Panel className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>{t.lobby.playersJoined}</SectionLabel>
          <Badge tone={canStart ? 'sheep' : 'muted'}>
            {joined} / {needed}
          </Badge>
        </div>
        <PlayerList players={state.players} />
      </Panel>

      {isHost ? (
        <div className="flex flex-col gap-3">
          <BigButton variant="primary" disabled={!canStart} onClick={actions.startGame}>
            {canStart ? t.lobby.startGame : t.lobby.waitingForMore(needed - joined)}
          </BigButton>
          <BigButton variant="ghost" onClick={() => confirm(t.lobby.endGameConfirm) && actions.hostEndGame()}>
            {t.lobby.endGame}
          </BigButton>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">{t.lobby.waitingHostStart}</p>
      )}
    </div>
  );
}
