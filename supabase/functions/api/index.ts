import { Hono } from 'jsr:@hono/hono@4';
import type { Context } from 'jsr:@hono/hono@4';
import { cors } from 'jsr:@hono/hono@4/cors';
import { normalizeGameCode } from '../_shared/gameLogic.ts';
import { gameStore } from '../_shared/gameStore.ts';
import { buildClientView } from '../_shared/sanitize.ts';
import type { Game } from '../_shared/types.ts';
import {
  GameError,
  acknowledgeRoleReveal,
  chooseQuestion,
  createGame,
  getPlayerName,
  hideVoteRecord,
  hostEndGame,
  hostPauseGame,
  hostResumeGame,
  joinGame,
  pollGameState,
  setAvatar,
  showVoteRecord,
  startGame,
  submitVote,
  toggleReadyToVote,
} from '../_shared/engine.ts';
import { mintVoiceToken } from '../_shared/livekit.ts';

// Ported from apps/server/src/index.ts (Express) -- same routes, same
// request/response shapes, same game logic. Only the transport changed.
//
// Every route is registered under both `/api/...` and `/functions/v1/api/...`.
// Supabase's gateway strips the `/functions/v1` prefix before invoking a
// function but is documented to leave the function name itself (`api`) in the
// path, so `/api/...` is the expected shape -- but that can't be verified
// against a live deployment from outside it, so both are mounted rather than
// shipping a routing guess that could silently 404 every request.

const app = new Hono();

// CLIENT_ORIGIN is a comma-separated list (production domain, an Amplify
// branch-preview URL while testing a feature branch, etc). Hono's cors()
// takes an array and matches the request's Origin against it exactly --
// passing '*' as a one-element array would only ever match a literal "*"
// Origin header, never a real one, so the wildcard has to stay a bare
// string and only kick in when CLIENT_ORIGIN is unset entirely.
const clientOrigin = Deno.env.get('CLIENT_ORIGIN');
const allowedOrigins = clientOrigin
  ? clientOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];
app.use('*', cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : '*' }));

type Handler = (c: Context) => Response | Promise<Response>;

function mount(method: 'get' | 'post', path: string, handler: Handler): void {
  for (const prefix of ['/api', '/functions/v1/api']) {
    const fullPath = `${prefix}${path}`;
    if (method === 'get') app.get(fullPath, handler);
    else app.post(fullPath, handler);
  }
}

function statusForCode(code: string): 400 | 403 | 404 {
  if (code === 'NOT_FOUND') return 404;
  if (code === 'BAD_TOKEN' || code === 'NOT_HOST' || code === 'NOT_ALLOWED') return 403;
  return 400;
}

// Best-effort real client IP. Requests reach this function through Supabase's
// gateway (and Cloudflare in front of it), so the socket peer address is a
// proxy -- cf-connecting-ip is the origin client, with x-forwarded-for's first
// hop as the fallback.
function clientIp(c: Context): string | null {
  const cf = c.req.header('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = c.req.header('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;
  return c.req.header('x-real-ip')?.trim() ?? null;
}

function errorResponse(c: Context, err: unknown) {
  const message = err instanceof GameError ? err.message : 'Something went wrong.';
  const code = err instanceof GameError ? err.code : 'UNKNOWN';
  return c.json({ message, code }, statusForCode(code));
}

async function authenticate(gameCode: string, playerId: unknown, playerToken: unknown): Promise<void> {
  if (typeof playerId !== 'string' || typeof playerToken !== 'string') {
    throw new GameError('Missing session.', 'BAD_TOKEN');
  }
  const entry = await gameStore.resolveToken(playerToken);
  if (!entry || entry.gameCode !== normalizeGameCode(gameCode) || entry.playerId !== playerId) {
    throw new GameError('Invalid session.', 'BAD_TOKEN');
  }
}

async function parseBody(c: Context): Promise<Record<string, unknown>> {
  try {
    return (await c.req.json()) ?? {};
  } catch {
    return {};
  }
}

/**
 * Wraps an authenticated POST action: checks the caller's token, runs the
 * action (which touches the caller's presence itself, inside the same
 * read-modify-write cycle -- see touchIfStale in engine.ts), and responds
 * with the resulting state, so every mutating call doubles as that player's
 * next "poll" for free. Deliberately a single round trip through the
 * engine, not "touch, then act, then re-fetch": under concurrent load
 * (several tabs polling/acting on the same game) each extra round trip is
 * another chance to collide with a competing write and have to retry.
 */
function action(fn: (gameCode: string, playerId: string, body: Record<string, unknown>) => Promise<Game>): Handler {
  return async (c: Context) => {
    try {
      const gameCode = c.req.param('code');
      const { playerId, playerToken, ...rest } = await parseBody(c);
      await authenticate(gameCode, playerId, playerToken);
      const game = await fn(gameCode, playerId as string, rest);
      return c.json(buildClientView(game, playerId as string));
    } catch (err) {
      return errorResponse(c, err);
    }
  };
}

mount('get', '/health', (c) => c.json({ ok: true }));

mount('post', '/games', async (c) => {
  try {
    const { hostName, maxPlayers, wolfCount, roundTimerSeconds } = await parseBody(c);
    const { game, playerId, playerToken } = await createGame(
      (hostName as string) ?? '',
      {
        maxPlayers: Number(maxPlayers),
        wolfCount: Number(wolfCount),
        roundTimerSeconds: Number(roundTimerSeconds),
      },
      { ip: clientIp(c), userAgent: c.req.header('user-agent') ?? null }
    );
    return c.json({ gameCode: game.gameCode, playerId, playerToken });
  } catch (err) {
    return errorResponse(c, err);
  }
});

mount('post', '/games/:code/join', async (c) => {
  try {
    const body = await parseBody(c);
    const { game, playerId, playerToken } = await joinGame(c.req.param('code'), (body.name as string) ?? '');
    return c.json({ gameCode: game.gameCode, playerId, playerToken });
  } catch (err) {
    return errorResponse(c, err);
  }
});

mount('get', '/games/:code/state', async (c) => {
  try {
    const gameCode = c.req.param('code');
    const playerId = c.req.query('playerId');
    const playerToken = c.req.query('playerToken');
    await authenticate(gameCode, playerId, playerToken);
    const game = await pollGameState(gameCode, playerId as string);
    return c.json(buildClientView(game, playerId as string));
  } catch (err) {
    return errorResponse(c, err);
  }
});

mount('post', '/games/:code/voice-token', async (c) => {
  try {
    const gameCode = c.req.param('code');
    const { playerId, playerToken } = await parseBody(c);
    await authenticate(gameCode, playerId, playerToken);
    const name = await getPlayerName(gameCode, playerId as string);
    const token = await mintVoiceToken(gameCode, playerId as string, name);
    return c.json({ token });
  } catch (err) {
    return errorResponse(c, err);
  }
});

mount('post', '/games/:code/start', action((gameCode, playerId) => startGame(gameCode, playerId)));
mount('post', '/games/:code/role-reveal-ack', action((gameCode, playerId) => acknowledgeRoleReveal(gameCode, playerId)));
mount('post', '/games/:code/choose-question', action((gameCode, playerId, body) => chooseQuestion(gameCode, playerId, body.question)));
mount('post', '/games/:code/avatar', action((gameCode, playerId, body) => setAvatar(gameCode, playerId, body.avatar)));
mount('post', '/games/:code/ready-to-vote', action((gameCode, playerId) => toggleReadyToVote(gameCode, playerId)));
mount(
  'post',
  '/games/:code/vote',
  action((gameCode, playerId, body) => submitVote(gameCode, playerId, String(body.targetPlayerId ?? '')))
);
mount('post', '/games/:code/vote-record/show', action((gameCode, playerId) => showVoteRecord(gameCode, playerId)));
mount('post', '/games/:code/vote-record/hide', action((gameCode, playerId) => hideVoteRecord(gameCode, playerId)));
mount('post', '/games/:code/end', action((gameCode, playerId) => hostEndGame(gameCode, playerId)));
mount('post', '/games/:code/pause', action((gameCode, playerId) => hostPauseGame(gameCode, playerId)));
mount('post', '/games/:code/resume', action((gameCode, playerId) => hostResumeGame(gameCode, playerId)));

Deno.serve(app.fetch);
