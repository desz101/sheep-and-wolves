'use client';

import { useState } from 'react';
import { ClientGameState } from '@sw/shared';
import { BigButton, Panel, SectionLabel } from '../ui';
import { useGame } from '@/lib/GameContext';

export function VotingView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  if (!state.selfIsAlive) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-4xl">👻</span>
        <p className="text-lg font-bold">Voting is underway</p>
        <p className="text-sm text-muted">
          You&apos;ve been eliminated and are now spectating.{' '}
          {state.voteCountsSubmitted}/{state.voteCountsNeeded} votes submitted.
        </p>
      </div>
    );
  }

  if (state.selfHasVoted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">✅</span>
        <p className="text-2xl font-black">Vote submitted</p>
        <p className="text-sm text-muted">
          Waiting for the other players… ({state.voteCountsSubmitted}/{state.voteCountsNeeded})
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-3xl font-black tracking-tight">
        {state.tiebreaker ? "IT'S A TIE — VOTE AGAIN" : 'TIME TO VOTE'}
      </h2>
      <Panel className="p-4">
        <SectionLabel>Who do you suspect?</SectionLabel>
        <div className="flex flex-col gap-2">
          {state.votingOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-lg font-semibold transition ${
                selected === opt.id
                  ? 'border-accent bg-accent/20 text-foreground'
                  : 'border-panel-border bg-black/20 text-foreground hover:bg-white/5'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected === opt.id ? 'border-accent bg-accent' : 'border-muted'
                }`}
              >
                {selected === opt.id && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              {opt.name}
            </button>
          ))}
        </div>
      </Panel>
      <BigButton variant="danger" disabled={!selected} onClick={() => selected && actions.submitVote(selected)}>
        Submit Vote
      </BigButton>
    </div>
  );
}
