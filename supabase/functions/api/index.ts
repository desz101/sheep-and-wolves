import { Hono } from 'jsr:@hono/hono@4';
import type { Context } from 'jsr:@hono/hono@4';
import { cors } from 'jsr:@hono/hono@4/cors';
import { normalizeGameCode } from '../_shared/gameLogic.ts';
import { gameStore } from '../_shared/gameStore.ts';
import { buildClientView } from '../_shared/sanitize.ts';
import {
  GameError,
  acknowledgeRoleReveal,
  createGame,
  drawQuestionCard,
  getGameState,
  hideVoteRecord,
  hostEndGame,
  hostPauseGame,
  hostResumeGame,
  joinGame,
  showVoteRecord,
  startGame,
  submitVote,
  touchPlayer,
} from '../_shared/engine.ts';

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

app.use('*', cors({ origin: Deno.env.get('CLIENT_ORIGIN') ?? '*' }));

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
 * Wraps an authenticated POST action: checks the caller's token, marks them as
 * freshly seen, runs the action, then responds with the resulting state -- so
 * every mutating call doubles as that player's next "poll" for free.
 */
function action(fn: (gameCode: string, playerId: string, body: Record<string, unknown>) => Promise<void>): Handler {
  return async (c: Context) => {
    try {
      const gameCode = c.req.param('code');
      const { playerId, playerToken, ...rest } = await parseBody(c);
      await authenticate(gameCode, playerId, playerToken);
      await touchPlayer(gameCode, playerId as string);
      await fn(gameCode, playerId as string, rest);
      return c.json(buildClientView(await getGameState(gameCode), playerId as string));
    } catch (err) {
      return errorResponse(c, err);
    }
  };
}

mount('get', '/health', (c) => c.json({ ok: true }));

mount('post', '/games', async (c) => {
  try {
    const { hostName, maxPlayers, wolfCount, roundTimerSeconds } = await parseBody(c);
    const { game, playerId, playerToken } = await createGame((hostName as string) ?? '', {
      maxPlayers: Number(maxPlayers),
      wolfCount: Number(wolfCount),
      roundTimerSeconds: Number(roundTimerSeconds),
    });
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
    await touchPlayer(gameCode, playerId as string);
    return c.json(buildClientView(await getGameState(gameCode), playerId as string));
  } catch (err) {
    return errorResponse(c, err);
  }
});

mount('post', '/games/:code/start', action((gameCode, playerId) => startGame(gameCode, playerId)));
mount('post', '/games/:code/role-reveal-ack', action((gameCode, playerId) => acknowledgeRoleReveal(gameCode, playerId)));
mount('post', '/games/:code/draw-question-card', action((gameCode, playerId) => drawQuestionCard(gameCode, playerId)));
mount(
  'post',
  '/games/:code/vote',
  action((gameCode, playerId, body) => submitVote(gameCode, playerId, String(body.targetPlayerId ?? '')))
);
mount('post', '/games/:code/vote-record/show', action((gameCode) => showVoteRecord(gameCode)));
mount('post', '/games/:code/vote-record/hide', action((gameCode) => hideVoteRecord(gameCode)));
mount('post', '/games/:code/end', action((gameCode, playerId) => hostEndGame(gameCode, playerId)));
mount('post', '/games/:code/pause', action((gameCode, playerId) => hostPauseGame(gameCode, playerId)));
mount('post', '/games/:code/resume', action((gameCode, playerId) => hostResumeGame(gameCode, playerId)));

Deno.serve(app.fetch);
