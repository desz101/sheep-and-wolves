// Mints a short-lived LiveKit access token scoped to one game's voice room
// and one player's identity. LIVEKIT_API_KEY/LIVEKIT_API_SECRET are secrets
// you set yourself (see DEPLOYMENT.md) -- unlike SUPABASE_URL/SERVICE_ROLE_KEY,
// Supabase doesn't inject these automatically.

import { AccessToken } from 'npm:livekit-server-sdk@2';
import { normalizeGameCode } from './gameLogic.ts';
import { GameError } from './engine.ts';

const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

// One voice room per game, named off the (already-unique) game code.
export function voiceRoomName(gameCodeRaw: string): string {
  return `sw-${normalizeGameCode(gameCodeRaw)}`;
}

export async function mintVoiceToken(gameCodeRaw: string, playerId: string, playerName: string): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new GameError('Voice chat is not configured on this server.', 'NOT_ALLOWED');
  }
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: playerId,
    name: playerName,
    ttl: '4h',
  });
  at.addGrant({
    room: voiceRoomName(gameCodeRaw),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  return await at.toJwt();
}
