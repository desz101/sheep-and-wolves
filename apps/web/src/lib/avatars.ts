import { AVATAR_KEYS } from '@sw/shared';

// Static files live at apps/web/public/avatars/<key>.webp (400x400, derived
// from the source PNGs).
export function avatarSrc(key: string): string {
  return `/avatars/${key}.webp`;
}

// Older game rows (created before avatars existed) have no avatar field, and a
// malformed value should never 404 an <img>. Fall back to a stable pick hashed
// off the player id so the same player always gets the same face.
export function resolveAvatarKey(key: string | undefined | null, playerId: string): string {
  if (key && (AVATAR_KEYS as readonly string[]).includes(key)) return key;
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  return AVATAR_KEYS[hash % AVATAR_KEYS.length];
}
