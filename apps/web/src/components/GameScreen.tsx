'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/GameContext';
import { LobbyView } from './phases/LobbyView';
import { RoleRevealView } from './phases/RoleRevealView';
import { QuestionCardView } from './phases/QuestionCardView';
import { DiscussionView } from './phases/DiscussionView';
import { VotingView } from './phases/VotingView';
import { VoteRevealView } from './phases/VoteRevealView';
import { TiebreakerView } from './phases/TiebreakerView';
import { EliminationView } from './phases/EliminationView';
import { GameOverView } from './phases/GameOverView';
import { VoteRecordModal } from './VoteRecordModal';
import { PlayerList } from './PlayerList';
import { VoiceChatBar } from './VoiceChatBar';
import { SpeakerRow } from './SpeakerRow';
import { BigButton } from './ui';
import { useLanguage } from '@/lib/i18n';

export function GameScreen() {
  const { state, connected, error, noSession, actions } = useGame();
  const [showPlayers, setShowPlayers] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => actions.dismissError(), 4000);
      return () => clearTimeout(timeout);
    }
  }, [error, actions]);

  useEffect(() => {
    if (noSession && !state) {
      const code = window.location.pathname.split('/').pop() ?? '';
      router.replace(`/join?code=${code}`);
    }
  }, [noSession, state, router]);

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="animate-pulse text-muted">{noSession ? t.game.redirecting : t.game.connecting}</p>
      </div>
    );
  }

  if (state.status === 'CANCELLED') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-5xl">🚫</span>
        <h1 className="text-2xl font-black">{t.game.gameEndedTitle}</h1>
        <p className="text-muted">{t.game.gameEndedBody}</p>
        <BigButton className="max-w-xs" onClick={() => router.push('/')}>
          {t.game.backToHome}
        </BigButton>
      </div>
    );
  }

  const alive = state.players.filter((p) => p.isAlive).length;
  const showRoundHeader = !['LOBBY', 'ROLE_REVEAL', 'GAME_OVER'].includes(state.status);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pb-10 pt-6">
      {!connected && (
        <div className="rounded-xl bg-yellow-500/20 px-4 py-2 text-center text-sm font-semibold text-yellow-300">
          {t.game.reconnecting}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-wolf/20 px-4 py-2 text-center text-sm font-semibold text-wolf">{error}</div>
      )}

      <VoiceChatBar />
      <SpeakerRow players={state.players} />

      {showRoundHeader && (
        <div className="flex items-center justify-between text-sm font-semibold text-muted">
          <span className="flex items-center gap-2">
            {t.game.round(state.currentRound)}
            {!state.selfIsAlive && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                {t.game.spectating}
              </span>
            )}
          </span>
          <button onClick={() => setShowPlayers((v) => !v)} className="underline underline-offset-4">
            {t.game.playersRemaining(alive)}
          </button>
        </div>
      )}

      {showPlayers && showRoundHeader && (
        <div className="rounded-3xl border border-panel-border bg-panel/80 p-4">
          <PlayerList players={state.players} showVoted={state.status === 'VOTING'} />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center">
        {state.status === 'LOBBY' && <LobbyView state={state} />}
        {state.status === 'ROLE_REVEAL' && <RoleRevealView state={state} />}
        {state.status === 'QUESTION_SELECTION' && <QuestionCardView state={state} />}
        {state.status === 'DISCUSSION' && <DiscussionView state={state} />}
        {state.status === 'VOTING' && <VotingView state={state} />}
        {state.status === 'TIEBREAKER' && <TiebreakerView state={state} />}
        {state.status === 'VOTE_REVEAL' && <VoteRevealView state={state} />}
        {state.status === 'ELIMINATION' && <EliminationView state={state} />}
        {state.status === 'GAME_OVER' && <GameOverView state={state} />}
      </div>

      {(state.status === 'VOTE_REVEAL' ||
        state.status === 'ELIMINATION' ||
        state.status === 'QUESTION_SELECTION' ||
        state.status === 'DISCUSSION') &&
        state.voteRecordAvailable && (
          <BigButton variant="ghost" onClick={actions.showVoteRecord}>
            {t.game.revealVoteRecord}
          </BigButton>
        )}

      {state.voteRecordVisible && state.latestVoteRecord && (
        <VoteRecordModal record={state.latestVoteRecord} onClose={actions.hideVoteRecord} />
      )}

      {state.hostPlayerId === state.selfPlayerId &&
        state.selfIsAlive &&
        state.status !== 'GAME_OVER' &&
        state.status !== 'LOBBY' && (
        <button
          onClick={() => confirm(t.game.endGameConfirm) && actions.hostEndGame()}
          className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-muted underline underline-offset-4"
        >
          {t.game.endGame}
        </button>
      )}
    </div>
  );
}
