'use client';

import { ClientPlayer } from '@sw/shared';
import { useVoice } from '@/lib/VoiceContext';
import { Avatar } from './Avatar';

// Deliberately always visible once voice is connected -- not tucked behind
// the collapsible "N Players Remaining" player list, which is hidden by
// default during DISCUSSION (exactly the phase where knowing who's talking
// matters most). Glows the matching bubble straight off LiveKit's own
// active-speaker events, so no one has to guess whose voice that is.
export function SpeakerRow({ players }: { players: ClientPlayer[] }) {
  const { status, activeSpeakerIds } = useVoice();

  if (status !== 'connected') return null;

  return (
    <div className="flex flex-wrap gap-3 px-1">
      {players.map((p) => (
        <div key={p.id} className="flex w-14 flex-col items-center gap-1">
          <Avatar id={p.id} name={p.name} speaking={activeSpeakerIds.has(p.id)} dim={!p.isAlive} status={p.connectionStatus} />
          <span className={`w-full truncate text-center text-[10px] font-semibold ${p.isAlive ? 'text-muted' : 'text-muted line-through'}`}>
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}
