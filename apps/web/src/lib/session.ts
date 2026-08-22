'use client';

export interface StoredSession {
  gameCode: string;
  playerId: string;
  playerToken: string;
}

function key(gameCode: string): string {
  return `sw_session_${gameCode.toUpperCase()}`;
}

// sessionStorage (not localStorage) is deliberate: it survives a refresh
// (satisfies the reconnect requirement) but is scoped to a single tab, so a
// player who opens the same game in two tabs on one device — or a game host
// who is also a player — never has one tab's identity clobbered by another's.

export function saveSession(session: StoredSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key(session.gameCode), JSON.stringify(session));
}

export function loadSession(gameCode: string): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(key(gameCode));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(gameCode: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(key(gameCode));
}
