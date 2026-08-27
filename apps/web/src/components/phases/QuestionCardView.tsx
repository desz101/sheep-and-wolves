'use client';

import { useState } from 'react';
import { ClientGameState } from '@sw/shared';
import { useGame } from '@/lib/GameContext';
import { useLanguage } from '@/lib/i18n';

export function QuestionCardView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const { t } = useLanguage();
  const [drawing, setDrawing] = useState(false);

  if (state.isQuestionCardHolder) {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <GameOnBadge label={t.questionCard.gameOnBadge} />
        <div className="card-flip-scene h-80 w-64 max-w-full">
          <button
            type="button"
            aria-label={t.questionCard.ariaTap}
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
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">{t.questionCard.holderTitle}</span>
              <span className="max-w-[80%] text-base text-foreground">{t.questionCard.tapWhenReady}</span>
            </div>
            <div className="card-face card-face-back absolute inset-0 flex items-center justify-center rounded-3xl border border-accent/50 bg-gradient-to-br from-[#241a45] to-[#0f1226] shadow-2xl">
              <span className="animate-pulse text-lg font-bold text-accent">{t.questionCard.revealing}</span>
            </div>
          </button>
        </div>
        <p className="max-w-xs text-sm text-muted">{t.questionCard.readAloud}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <GameOnBadge label={t.questionCard.gameOnBadge} />
      <span className="text-5xl">🃏</span>
      <p className="text-xl font-bold">
        {t.questionCard.someoneHasCard(state.questionCardHolderName ?? t.questionCard.someoneFallback)}
      </p>
      <p className="text-sm text-muted">{t.questionCard.theyWillRead}</p>
    </div>
  );
}

// Round after round, players land on this waiting screen and don't realize
// the game is live and it's fine to talk -- a plain "here's who has the
// card" message alone reads as "nothing is happening yet."
function GameOnBadge({ label }: { label: string }) {
  return (
    <div className="flex animate-fade-up items-center gap-2 rounded-full border border-accent-2/30 bg-accent-2/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent-2">
      {label}
    </div>
  );
}
