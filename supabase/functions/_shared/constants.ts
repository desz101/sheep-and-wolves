// Ported from packages/shared/src/constants.ts -- see the note in types.ts
// about why this is duplicated rather than imported from @sw/shared.

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

export const GAME_CODE_LENGTH = 6;
export const GAME_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const POLL_INTERVAL_MS = 1500;
export const PRESENCE_TIMEOUT_MS = 4 * POLL_INTERVAL_MS;

// Cosmetic player avatars -- keep in sync with packages/shared/src/constants.ts.
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

export function randomAvatar(): string {
  return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
}

export function isAvatarKey(value: unknown): value is string {
  return typeof value === 'string' && (AVATAR_KEYS as readonly string[]).includes(value);
}
