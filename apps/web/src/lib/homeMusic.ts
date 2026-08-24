'use client';

// Bridges the always-mounted <HomeMusicPlayer /> (rendered once in the root
// layout, so it survives client-side navigation between /, /create, /join,
// and the lobby) with the game page deep inside GameProvider, which is the
// only place that actually knows when a game leaves LOBBY. `stopped` is a
// one-way latch for the lifetime of the tab: once a game starts, music never
// resumes, even if a listener attaches after the stop already fired.
type Listener = () => void;

let stopped = false;
const listeners = new Set<Listener>();

export function stopHomeMusic(): void {
  if (stopped) return;
  stopped = true;
  listeners.forEach((fn) => fn());
}

export function onHomeMusicStop(fn: Listener): () => void {
  if (stopped) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}
