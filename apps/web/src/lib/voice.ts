'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Room } from 'livekit-client';
import { fetchVoiceToken, ApiError } from './api';
import { loadSession } from './session';

// Set by NEXT_PUBLIC_LIVEKIT_URL at build time -- the wss:// endpoint for
// your LiveKit Cloud project (or self-hosted server). Not a secret: the
// client needs it to open the media connection. See DEPLOYMENT.md.
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface VoiceChatState {
  status: VoiceStatus;
  muted: boolean;
  activeSpeakerIds: Set<string>;
  errorMessage: string | null;
  available: boolean;
  join: () => void;
  leave: () => void;
  toggleMute: () => void;
}

// livekit-client touches browser-only globals (WebRTC APIs), so it's
// imported lazily inside join() rather than at module scope -- this file is
// 'use client' but still gets evaluated during Next's server render pass on
// first load, where those globals don't exist.
export function useVoiceChat(gameCode: string): VoiceChatState {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const leave = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus('idle');
    setMuted(false);
    setActiveSpeakerIds(new Set());
  }, []);

  const join = useCallback(() => {
    if (!LIVEKIT_URL) {
      setErrorMessage('Voice chat is not set up for this deployment yet.');
      setStatus('error');
      return;
    }
    const session = loadSession(gameCode);
    if (!session) return;

    setStatus('connecting');
    setErrorMessage(null);

    (async () => {
      try {
        const { body } = await fetchVoiceToken(gameCode, session.playerId, session.playerToken);
        const { Room, RoomEvent } = await import('livekit-client');
        const room = new Room();

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setActiveSpeakerIds(new Set(speakers.map((p) => p.identity)));
        });
        room.on(RoomEvent.Disconnected, () => {
          setStatus('idle');
          setMuted(false);
          setActiveSpeakerIds(new Set());
        });

        await room.connect(LIVEKIT_URL, body.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        roomRef.current = room;
        setMuted(false);
        setStatus('connected');
      } catch (err) {
        setErrorMessage(err instanceof ApiError ? err.message : 'Could not join voice chat.');
        setStatus('error');
      }
    })();
  }, [gameCode]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  // Disconnect on unmount (leaving the game page) so we don't leave a dangling
  // publisher in the room.
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  return { status, muted, activeSpeakerIds, errorMessage, available: Boolean(LIVEKIT_URL), join, leave, toggleMute };
}
