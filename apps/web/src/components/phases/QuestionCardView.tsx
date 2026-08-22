'use client';

import { useState } from 'react';
import { ClientGameState } from '@sw/shared';
import { useGame } from '@/lib/GameContext';

export function QuestionCardView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const [drawing, setDrawing] = useState(false);

  if (state.isQuestionCardHolder) {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="card-flip-scene h-80 w-64 max-w-full">
          <button
            type="button"
            aria-label="Tap when your group is ready to draw the question"
            disabled={drawing}
            onClick={() => {
              setDrawing(true);
              actions.drawQuestionCard();
            }}
            className="card-flip-inner relative h-full w-full disabled:cursor-wait"
            style={{ transform: drawing ? 'rotateY(180deg)' : undefined }}
          >
            <div className="card-face absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-3xl border border-accent/50 bg-gradient-to-br from-[#241a45] to-[#0f1226] shadow-2xl">
              <span className="text-6xl">🃏</span>
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">You have the question card</span>
              <span className="max-w-[80%] text-base text-foreground">
                Tap when your group is ready to hear it
              </span>
            </div>
            <div className="card-face card-face-back absolute inset-0 flex items-center justify-center rounded-3xl border border-accent/50 bg-gradient-to-br from-[#241a45] to-[#0f1226] shadow-2xl">
              <span className="animate-pulse text-lg font-bold text-accent">Revealing…</span>
            </div>
          </button>
        </div>
        <p className="max-w-xs text-sm text-muted">
          Read it out loud once everyone&apos;s ready — the timer starts the moment you draw it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="text-5xl">🃏</span>
      <p className="text-xl font-bold">
        {state.questionCardHolderName ?? 'Someone'} has the question card
      </p>
      <p className="text-sm text-muted">They&apos;ll read it out loud when your group is ready.</p>
    </div>
  );
}
