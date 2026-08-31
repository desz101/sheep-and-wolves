'use client';

import type { CSSProperties } from 'react';
import type { ConnectionStatus } from '@sw/shared';

// A small fixed palette (not per-app theme colors like accent/wolf/sheep,
// which already mean something else) so every player gets a consistent,
// visually distinct bubble color for the life of the game -- hashed off
// their (stable) player id, not their name, so a name change or duplicate
// name never reshuffles anyone's color.
const PALETTE = ['#7c5cff', '#22d3a8', '#ff8a5c', '#5cc8ff', '#ffce54', '#ff6ec7', '#63e6be', '#a78bfa'];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  id,
  name,
  speaking = false,
  dim = false,
  size = 'md',
  status,
}: {
  id: string;
  name: string;
  speaking?: boolean;
  dim?: boolean;
  size?: 'sm' | 'md';
  status?: ConnectionStatus;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const color = colorForId(id);
  const dimension = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${dimension} items-center justify-center rounded-full font-black text-white transition-opacity ${
          dim ? 'opacity-40' : ''
        } ${speaking ? 'animate-attention-pulse' : ''}`}
        style={{ backgroundColor: color, '--pulse-color': color } as CSSProperties}
        title={name}
      >
        {initial}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${
            status === 'connected' ? 'bg-accent-2' : 'bg-yellow-500'
          }`}
          title={status}
        />
      )}
    </div>
  );
}
