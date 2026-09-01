export const QUESTION_DECK: string[] = [
  "Who is your #1 wolf suspect right now, and why?",
  "Who do you trust the most right now?",
  "Who do you trust the least right now?",
  "Who is being unusually quiet?",
  "Who seems like they're trying too hard to look innocent?",
  "Who has changed their story or opinion?",
  "Who seems to be influencing where the vote goes?",
  "Which two people could secretly be working together?",
  "If you're eliminated and you're a sheep, who should we look at next?",
  "If you had to make the final vote right now, who goes?",
];

export const TIMER_PRESETS_SECONDS = [60, 120, 180, 300, 420, 600] as const;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 30;

export const GAME_CODE_LENGTH = 6;
// Avoid ambiguous characters: 0/O, 1/I/L
export const GAME_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const RECONNECT_GRACE_MS = 5 * 60 * 1000;

// The client polls GET /games/:code/state on this cadence instead of holding a
// live connection. A player is only shown as "disconnected" once they've missed
// several polls in a row (PRESENCE_TIMEOUT_MS), not the instant one is late.
export const POLL_INTERVAL_MS = 1500;
export const PRESENCE_TIMEOUT_MS = 4 * POLL_INTERVAL_MS;

export function maxWolvesForPlayers(playerCount: number): number {
  // Wolves must never start >= half the players (sheep must start with a majority),
  // and the game validation additionally requires wolves < sheep at game start.
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}

export function minWolves(): number {
  return 1;
}

// Player avatars: one PNG-derived webp per key lives at
// apps/web/public/avatars/<key>.webp. Order is the cycle order in the picker.
// Purely cosmetic -- no key hints at a role.
export const AVATAR_KEYS = [
  'chill',
  'cool',
  'curious',
  'inquisitive',
  'savvy',
  'witty',
  'silly',
  'energized',
  'emotional',
  'tired',
  'annoyed',
  'suspect',
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export function randomAvatar(): AvatarKey {
  return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
}

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === 'string' && (AVATAR_KEYS as readonly string[]).includes(value);
}
