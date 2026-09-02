'use client';

import type { CSSProperties } from 'react';
import { ClientPlayer } from '@sw/shared';
import { useVoice } from '@/lib/VoiceContext';
import { Avatar } from './Avatar';

// A circle of player faces around a small status medallion, so the table can
// see at a glance who's in the game. The ring around a face pulses (via
// <Avatar speaking>) straight off LiveKit's active-speaker events, so it
// doubles as "who's talking right now". Shown on every screen in place of the
// old flat SpeakerRow strip.
export function PlayerRing({
  players,
  centerTop,
  centerBottom,
}: {
  players: ClientPlayer[];
  centerTop: string;
  centerBottom?: string;
}) {
  const { activeSpeakerIds } = useVoice();
  const n = players.length;

  // Face size shrinks as the table grows so a full 30-player game still reads
  // as a ring rather than a pile.
  const faceSize: 'sm' | 'md' | 'lg' = n <= 8 ? 'lg' : n <= 16 ? 'md' : 'sm';

  return (
    <div className="relative mx-auto aspect-square w-[min(80vw,340px)]">
      {/* status medallion */}
      <div className="absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-panel-border bg-panel/80 text-center shadow-inner">
        <span className="text-xl font-black leading-none tracking-tight">{centerTop}</span>
        {centerBottom && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">{centerBottom}</span>
        )}
      </div>

      {players.map((p, i) => {
        // Start at the top (−90°) and go clockwise. Rounded to a fixed
        // precision so the server and client render byte-identical style
        // strings (raw floats serialize differently -> hydration mismatch).
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = (50 + 50 * Math.cos(angle)).toFixed(3);
        const y = (50 + 50 * Math.sin(angle)).toFixed(3);
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` } as CSSProperties}
          >
            <Avatar
              id={p.id}
              name={p.name}
              avatar={p.avatar}
              size={faceSize}
              dim={!p.isAlive}
              speaking={activeSpeakerIds.has(p.id)}
              status={p.isAlive ? p.connectionStatus : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
