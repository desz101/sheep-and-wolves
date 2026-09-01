'use client';

import type { CSSProperties } from 'react';
import type { ConnectionStatus } from '@sw/shared';
import { avatarSrc, resolveAvatarKey } from '@/lib/avatars';

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
} as const;

// A player's sheep avatar in a circle. The ring pulses (accent glow) while
// `speaking` is true -- driven by LiveKit active-speaker events upstream.
export function Avatar({
  id,
  name,
  avatar,
  speaking = false,
  dim = false,
  size = 'md',
  status,
}: {
  id: string;
  name: string;
  avatar?: string;
  speaking?: boolean;
  dim?: boolean;
  size?: keyof typeof SIZES;
  status?: ConnectionStatus;
}) {
  const key = resolveAvatarKey(avatar, id);

  return (
    <div className="relative shrink-0">
      <div
        className={`${SIZES[size]} overflow-hidden rounded-full bg-black/30 ring-2 transition-opacity ${
          dim ? 'opacity-40' : ''
        } ${speaking ? 'ring-accent animate-attention-pulse' : 'ring-white/15'}`}
        style={{ '--pulse-color': 'var(--accent)' } as CSSProperties}
        title={name}
      >
        <img src={avatarSrc(key)} alt={name} className="h-full w-full object-cover" draggable={false} />
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
