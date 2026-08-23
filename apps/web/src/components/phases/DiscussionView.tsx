'use client';

import { ClientGameState } from '@sw/shared';
import { Timer } from '../Timer';
import { BigButton, Panel } from '../ui';
import { useGame } from '@/lib/GameContext';

export function DiscussionView({ state }: { state: ClientGameState }) {
  const { actions, clockOffsetMs } = useGame();
  const isHost = state.hostPlayerId === state.selfPlayerId && state.selfIsAlive;
  const alive = state.players.filter((p) => p.isAlive).length;

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-accent-2">
        <span>🗣️</span> Discussion
      </div>

      <Panel className="w-full p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">Question</div>
        <p className="text-2xl font-bold leading-snug">{state.currentQuestion}</p>
      </Panel>

      {state.paused ? (
        <div className="animate-pulse text-2xl font-black text-yellow-400">⏸ PAUSED</div>
      ) : (
        <Timer phaseEndsAt={state.phaseEndsAt} clockOffsetMs={clockOffsetMs} />
      )}

      <p className="text-sm text-muted">
        {alive} player{alive === 1 ? '' : 's'} remaining · Round {state.currentRound}
      </p>

      {state.selfIsAlive && !state.paused && (
        <div className="flex w-full flex-col items-center gap-2">
          <BigButton variant={state.selfReadyToVote ? 'ghost' : 'primary'} onClick={() => actions.toggleReadyToVote()}>
            {state.selfReadyToVote ? '✅ Ready to vote' : 'Ready to vote'}
          </BigButton>
          <p className="text-xs text-muted">
            {state.readyToVoteCount}/{state.readyToVoteNeeded} ready
            {state.selfReadyToVote ? ' — tap to cancel' : ' · skips the timer once everyone is'}
          </p>
        </div>
      )}

      {isHost && (
        <button
          onClick={() => (state.paused ? actions.hostResumeGame() : actions.hostPauseGame())}
          className="text-xs font-semibold uppercase tracking-widest text-muted underline underline-offset-4"
        >
          {state.paused ? 'Resume timer' : 'Pause timer'}
        </button>
      )}
    </div>
  );
}
