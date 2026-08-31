'use client';

import { useState } from 'react';
import { Role } from '@sw/shared';
import { BigButton } from './ui';
import { useLanguage } from '@/lib/i18n';

type Teammate = { id: string; name: string };

/** A shrunk-down echo of the wolf card back, badged with a fellow wolf's name. */
function WolfTeammateCard({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex w-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-wolf/50 bg-gradient-to-br from-red-950 to-black p-3 shadow-xl sm:w-28">
      <span className="text-3xl sm:text-4xl">🐺</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wolf">{label}</span>
      <span className="w-full truncate text-center text-sm font-bold text-foreground" title={name}>
        {name}
      </span>
    </div>
  );
}

export function RoleCard({
  role,
  teammates = [],
  onConfirm,
}: {
  role: Role;
  teammates?: Teammate[];
  onConfirm: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { t } = useLanguage();

  const isWolf = role === 'wolf';
  // The server only sends teammates once this wolf has acked their reveal, so
  // their arrival is itself the "after you've seen your card" signal.
  const showPack = isWolf && teammates.length > 0;
  const leftPack = teammates.filter((_, i) => i % 2 === 0);
  const rightPack = teammates.filter((_, i) => i % 2 === 1);

  return (
    <div className="flex flex-col items-center gap-8">
      {showPack && (
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-wolf/80">
          {t.roleCard.otherWolves}
        </p>
      )}

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-5">
        {showPack && (
          <div className="order-2 flex flex-row flex-wrap justify-center gap-3 sm:order-1 sm:flex-col">
            {leftPack.map((tm) => (
              <WolfTeammateCard key={tm.id} name={tm.name} label={t.roleCard.wolfTag} />
            ))}
          </div>
        )}

        <div className="card-flip-scene order-1 h-96 w-72 max-w-full shrink-0 sm:order-2">
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

        {showPack && (
          <div className="order-3 flex flex-row flex-wrap justify-center gap-3 sm:flex-col">
            {rightPack.map((tm) => (
              <WolfTeammateCard key={tm.id} name={tm.name} label={t.roleCard.wolfTag} />
            ))}
          </div>
        )}
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
