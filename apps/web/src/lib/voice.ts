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
  // True once LiveKit has confirmed the browser is blocking autoplay of the
  // remote audio elements (common on mobile Safari) -- resolved by calling
  // enableAudio() from a fresh tap, per LiveKit's AudioPlaybackStatusChanged.
  audioBlocked: boolean;
  join: () => void;
  leave: () => void;
  toggleMute: () => void;
  enableAudio: () => void;
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
  const [audioBlocked, setAudioBlocked] = useState(false);
  const roomRef = useRef<Room | null>(null);
  // Remote participants' audio only plays if their tracks are attached to an
  // actual <audio> element in the document -- LiveKit doesn't do this for
  // you. Kept off-screen; cleaned up on leave/unmount.
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  const teardownAudioContainer = useCallback(() => {
    audioContainerRef.current?.remove();
    audioContainerRef.current = null;
  }, []);

  const leave = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    teardownAudioContainer();
    setStatus('idle');
    setMuted(false);
    setActiveSpeakerIds(new Set());
    setAudioBlocked(false);
  }, [teardownAudioContainer]);

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
        const { Room, RoomEvent, Track } = await import('livekit-client');
        const room = new Room();

        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        audioContainerRef.current = container;

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setActiveSpeakerIds(new Set(speakers.map((p) => p.identity)));
        });
        room.on(RoomEvent.Disconnected, () => {
          teardownAudioContainer();
          setStatus('idle');
          setMuted(false);
          setActiveSpeakerIds(new Set());
          setAudioBlocked(false);
        });
        // Fires for every *other* participant's tracks (never our own local
        // publish) -- attach audio ones to the page so they're actually audible.
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            container.appendChild(track.attach());
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((el) => el.remove());
        });
        // Browsers (mobile Safari especially) can silently block autoplay on
        // these dynamically-created <audio> elements; this fires with the
        // real answer once LiveKit tries, so we can surface a manual retry.
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          setAudioBlocked(!room.canPlaybackAudio);
        });

        await room.connect(LIVEKIT_URL, body.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        roomRef.current = room;
        setMuted(false);
        setAudioBlocked(!room.canPlaybackAudio);
        setStatus('connected');
      } catch (err) {
        teardownAudioContainer();
        setErrorMessage(err instanceof ApiError ? err.message : 'Could not join voice chat.');
        setStatus('error');
      }
    })();
  }, [gameCode, teardownAudioContainer]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  // Retries attaching/playing the blocked <audio> elements -- must be called
  // from a fresh user-gesture handler (a click), which is why this is
  // exposed rather than retried automatically.
  const enableAudio = useCallback(() => {
    roomRef.current?.startAudio().then(() => setAudioBlocked(false));
  }, []);

  // Disconnect on unmount (leaving the game page) so we don't leave a dangling
  // publisher in the room.
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
      teardownAudioContainer();
    };
  }, [teardownAudioContainer]);

  return {
    status,
    muted,
    activeSpeakerIds,
    errorMessage,
    available: Boolean(LIVEKIT_URL),
    audioBlocked,
    join,
    leave,
    toggleMute,
    enableAudio,
  };
}
