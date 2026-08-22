'use client';

import { useEffect, useState } from 'react';

function format(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Renders a countdown to `phaseEndsAt` (server epoch ms). Never trusts a
 * locally-ticking source of truth: it recomputes from the server-provided
 * deadline plus the measured clock offset every animation frame, so a
 * client-side pause/refresh can't drift or manipulate it.
 */
export function Timer({ phaseEndsAt, clockOffsetMs, size = 'lg' }: { phaseEndsAt: number | null; clockOffsetMs: number; size?: 'lg' | 'sm' }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (phaseEndsAt === null) return;
    let raf: number;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phaseEndsAt]);

  if (phaseEndsAt === null) return null;

  const remaining = phaseEndsAt - (now + clockOffsetMs);
  const critical = remaining <= 10000;
  const sizeClass = size === 'lg' ? 'text-7xl' : 'text-2xl';

  return (
    <div
      className={`font-mono ${sizeClass} font-black tabular-nums tracking-tight ${critical ? 'text-wolf' : 'text-foreground'} ${
        critical && size === 'lg' ? 'timer-critical rounded-full' : ''
      }`}
    >
      {format(remaining)}
    </div>
  );
}
