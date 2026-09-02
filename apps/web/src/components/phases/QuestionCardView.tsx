'use client';

import { useState } from 'react';
import { ClientGameState } from '@sw/shared';
import { BigButton } from '../ui';
import { useGame } from '@/lib/GameContext';
import { useLanguage } from '@/lib/i18n';

export function QuestionCardView({ state }: { state: ClientGameState }) {
  const { actions } = useGame();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (state.isQuestionCardHolder) {
    return (
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <GameOnBadge label={t.questionCard.gameOnBadge} />
        <h2 className="text-2xl font-black tracking-tight">{t.questionCard.holderTitle}</h2>
        <p className="max-w-xs text-sm text-muted">{t.questionCard.pickPrompt}</p>

        {state.questionChoices.length === 0 ? (
          <p className="animate-pulse text-sm text-muted">…</p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {state.questionChoices.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelected(q)}
                className={`rounded-2xl border px-5 py-4 text-left text-base font-semibold leading-snug transition ${
                  selected === q
                    ? 'border-accent bg-accent/20 text-foreground'
                    : 'border-panel-border bg-black/20 text-foreground hover:bg-white/5'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <BigButton
          className="mt-1"
          disabled={!selected || submitting}
          onClick={() => {
            if (!selected) return;
            setSubmitting(true);
            actions.chooseQuestion(selected);
          }}
        >
          {t.questionCard.askThis}
        </BigButton>
        <p className="max-w-xs text-xs text-muted">{t.questionCard.readAloud}</p>
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
