'use client';

import { useState } from 'react';
import { Role } from '@sw/shared';
import { BigButton } from './ui';
import { useLanguage } from '@/lib/i18n';

export function RoleCard({ role, onConfirm }: { role: Role; onConfirm: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { t } = useLanguage();

  const isWolf = role === 'wolf';

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="card-flip-scene h-96 w-72 max-w-full">
        <button
          type="button"
          aria-label={flipped ? t.roleCard.ariaYourRole : t.roleCard.ariaTapToReveal}
          onClick={() => setFlipped(true)}
          className="card-flip-inner relative h-full w-full"
          style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
        >
          {/* Front */}
          <div className="card-face absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-3xl border border-panel-border bg-gradient-to-br from-[#1c2140] to-[#0f1226] shadow-2xl">
            <span className="text-7xl">🃏</span>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">{t.roleCard.yourRole}</span>
            <span className="animate-pulse text-lg font-bold text-accent">{t.roleCard.tapToReveal}</span>
          </div>

          {/* Back */}
          <div
            className={`card-face card-face-back absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-3xl border shadow-2xl ${
              isWolf
                ? 'border-wolf/50 bg-gradient-to-br from-red-950 to-black'
                : 'border-sheep/50 bg-gradient-to-br from-sky-950 to-black'
            }`}
          >
            <span className="text-8xl">{isWolf ? '🐺' : '🐑'}</span>
            <span className={`text-3xl font-black tracking-tight ${isWolf ? 'text-wolf' : 'text-sheep'}`}>
              {isWolf ? t.roleCard.youAreAWolf : t.roleCard.youAreASheep}
            </span>
            <span className="max-w-[85%] text-center text-base text-muted">
              {isWolf ? t.roleCard.wolfBody : t.roleCard.sheepBody}
            </span>
          </div>
        </button>
      </div>

      {flipped && !confirmed && (
        <div className="w-72 max-w-full animate-fade-up">
          <BigButton
            variant={isWolf ? 'wolf' : 'sheep'}
            className="animate-attention-pulse"
            style={{ '--pulse-color': isWolf ? 'var(--wolf)' : 'var(--sheep)' } as React.CSSProperties}
            onClick={() => {
              setConfirmed(true);
              onConfirm();
            }}
          >
            {t.roleCard.seenRole}
          </BigButton>
        </div>
      )}

      {confirmed && <p className="animate-fade-up text-sm text-muted">{t.roleCard.waitingOthers}</p>}
    </div>
  );
}
