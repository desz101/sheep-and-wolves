'use client';

import { useEffect, useRef, useState } from 'react';
import { onHomeMusicStop } from '@/lib/homeMusic';

const TRACKS = ['/audio/sneaky.mp3', '/audio/sneaky-snitch.mp3'];
const MUTE_KEY = 'sw_music_muted';

// Rendered once in the root layout so it survives client-side navigation
// across /, /create, /join, and the lobby -- a fresh Audio object per page
// would restart the track (and lose the mute state) on every navigation.
// It disappears entirely once stopHomeMusic() fires (see homeMusic.ts),
// which GameContext calls the moment a game leaves LOBBY.
export function HomeMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const storedMuted = localStorage.getItem(MUTE_KEY) === 'true';
    setMuted(storedMuted);

    const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const audio = new Audio(track);
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = storedMuted;
    audioRef.current = audio;

    // Browsers block unmuted autoplay without a prior user gesture -- if that
    // happens, just wait for the visitor's first tap/click anywhere on the
    // page and try again then, same as the browser would require regardless.
    const resume = () => audio.play().catch(() => {});
    audio.play().catch(() => {
      window.addEventListener('pointerdown', resume, { once: true });
    });

    const unsubscribe = onHomeMusicStop(() => {
      window.removeEventListener('pointerdown', resume);
      audio.pause();
      setStopped(true);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('pointerdown', resume);
      audio.pause();
      audio.src = '';
    };
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, String(next));
    const audio = audioRef.current;
    if (audio) {
      audio.muted = next;
      if (!next) audio.play().catch(() => {});
    }
  }

  if (stopped) return null;

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      className="fixed bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-panel-border bg-panel/80 text-lg backdrop-blur-sm shadow-lg transition active:scale-95"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
