'use client';

import { useState } from 'react';
import { Role } from '@sw/shared';
import { BigButton } from './ui';

export function RoleCard({ role, onConfirm }: { role: Role; onConfirm: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isWolf = role === 'wolf';

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="card-flip-scene h-96 w-72 max-w-full">
        <button
          type="button"
          aria-label={flipped ? 'Your role' : 'Tap to reveal your role'}
          onClick={() => setFlipped(true)}
          className="card-flip-inner relative h-full w-full"
          style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
        >
          {/* Front */}
          <div className="card-face absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-3xl border border-panel-border bg-gradient-to-br from-[#1c2140] to-[#0f1226] shadow-2xl">
            <span className="text-7xl">🃏</span>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Your Role</span>
            <span className="animate-pulse text-lg font-bold text-accent">Tap to reveal</span>
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
              YOU ARE A {isWolf ? 'WOLF' : 'SHEEP'}
            </span>
            <span className="max-w-[85%] text-center text-base text-muted">
              {isWolf
                ? 'Stay hidden and survive until the wolves outnumber the sheep.'
                : 'Find and vote out all of the wolves.'}
            </span>
          </div>
        </button>
      </div>

      {flipped && !confirmed && (
        <div className="w-72 max-w-full animate-fade-up">
          <BigButton
            variant={isWolf ? 'wolf' : 'sheep'}
            onClick={() => {
              setConfirmed(true);
              onConfirm();
            }}
          >
            I&apos;ve Seen My Role
          </BigButton>
        </div>
      )}

      {confirmed && <p className="animate-fade-up text-sm text-muted">Waiting for the other players…</p>}
    </div>
  );
}
