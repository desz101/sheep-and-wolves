'use client';

import { ApiRoutes, ClientGameState, ErrorPayload, SessionAck, VoiceTokenAck } from '@sw/shared';

// http://localhost:54321 is the Supabase CLI's default local API gateway port
// (`supabase start` / `supabase functions serve`), so this "just works" for
// local dev without a .env.local as long as the local Supabase stack is up.
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:54321/functions/v1/api';

export class ApiError extends Error {
  code?: string;
  constructor(payload: ErrorPayload) {
    super(payload.message);
    this.code = payload.code;
  }
}

// Every response carries `serverNow`, so the caller can derive the clock offset
// from ordinary request timing instead of a dedicated ping/pong exchange.
export interface Timed<T> {
  body: T;
  sentAt: number;
  receivedAt: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<Timed<T>> {
  const sentAt = Date.now();
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const receivedAt = Date.now();
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body ?? { message: 'Something went wrong.' });
  return { body: body as T, sentAt, receivedAt };
}

export function createGame(payload: {
  hostName: string;
  maxPlayers: number;
  wolfCount: number;
  roundTimerSeconds: number;
}): Promise<Timed<SessionAck>> {
  return request(ApiRoutes.createGame(), { method: 'POST', body: JSON.stringify(payload) });
}

export function joinGame(gameCode: string, name: string): Promise<Timed<SessionAck>> {
  return request(ApiRoutes.joinGame(gameCode), { method: 'POST', body: JSON.stringify({ name }) });
}

export function fetchState(gameCode: string, playerId: string, playerToken: string): Promise<Timed<ClientGameState>> {
  const qs = new URLSearchParams({ playerId, playerToken });
  return request(`${ApiRoutes.state(gameCode)}?${qs}`);
}

function authedAction(route: (gameCode: string) => string) {
  return (gameCode: string, playerId: string, playerToken: string, extra?: Record<string, unknown>): Promise<Timed<ClientGameState>> =>
    request(route(gameCode), {
      method: 'POST',
      body: JSON.stringify({ playerId, playerToken, ...extra }),
    });
}

export const startGame = authedAction(ApiRoutes.startGame);

export function setAvatar(
  gameCode: string,
  playerId: string,
  playerToken: string,
  avatar: string
): Promise<Timed<ClientGameState>> {
  return authedAction(ApiRoutes.setAvatar)(gameCode, playerId, playerToken, { avatar });
}
export const revealRoleAck = authedAction(ApiRoutes.revealRoleAck);
export const drawQuestionCard = authedAction(ApiRoutes.drawQuestionCard);
export const toggleReadyToVote = authedAction(ApiRoutes.toggleReadyToVote);
export const showVoteRecord = authedAction(ApiRoutes.showVoteRecord);
export const hideVoteRecord = authedAction(ApiRoutes.hideVoteRecord);
export const hostEndGame = authedAction(ApiRoutes.hostEndGame);
export const hostPauseGame = authedAction(ApiRoutes.hostPauseGame);
export const hostResumeGame = authedAction(ApiRoutes.hostResumeGame);

export function submitVote(gameCode: string, playerId: string, playerToken: string, targetPlayerId: string): Promise<Timed<ClientGameState>> {
  return authedAction(ApiRoutes.submitVote)(gameCode, playerId, playerToken, { targetPlayerId });
}

export function fetchVoiceToken(gameCode: string, playerId: string, playerToken: string): Promise<Timed<VoiceTokenAck>> {
  return request(ApiRoutes.voiceToken(gameCode), {
    method: 'POST',
    body: JSON.stringify({ playerId, playerToken }),
  });
}
