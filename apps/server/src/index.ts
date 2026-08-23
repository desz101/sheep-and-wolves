import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApiRoutes, normalizeGameCode } from '@sw/shared';
import { gameStore } from './gameStore';
import { buildClientView } from './sanitize';
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
} from './engine';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

function statusForCode(code: string): number {
  if (code === 'NOT_FOUND') return 404;
  if (code === 'BAD_TOKEN' || code === 'NOT_HOST' || code === 'NOT_ALLOWED') return 403;
  return 400;
}

function sendError(res: Response, err: unknown): void {
  const message = err instanceof GameError ? err.message : 'Something went wrong.';
  const code = err instanceof GameError ? err.code : 'UNKNOWN';
  res.status(statusForCode(code)).json({ message, code });
}

/** Validates a request's playerId/playerToken against the token this server minted for that game. */
function authenticate(gameCode: string, playerId: unknown, playerToken: unknown): void {
  if (typeof playerId !== 'string' || typeof playerToken !== 'string') {
    throw new GameError('Missing session.', 'BAD_TOKEN');
  }
  const entry = gameStore.resolveToken(playerToken);
  if (!entry || entry.gameCode !== normalizeGameCode(gameCode) || entry.playerId !== playerId) {
    throw new GameError('Invalid session.', 'BAD_TOKEN');
  }
}

/**
 * Wraps an authenticated POST action: checks the caller's token, marks them as
 * freshly seen, runs the action, then responds with the resulting state -- so
 * every mutating call doubles as that player's next "poll" for free.
 */
function action(fn: (gameCode: string, playerId: string, body: Record<string, unknown>) => void) {
  return (req: Request, res: Response) => {
    try {
      const gameCode = req.params.code;
      const { playerId, playerToken, ...rest } = req.body ?? {};
      authenticate(gameCode, playerId, playerToken);
      touchPlayer(gameCode, playerId);
      fn(gameCode, playerId, rest);
      res.json(buildClientView(getGameState(gameCode), playerId));
    } catch (err) {
      sendError(res, err);
    }
  };
}

app.post(ApiRoutes.createGame(), (req: Request, res: Response) => {
  try {
    const { hostName, maxPlayers, wolfCount, roundTimerSeconds } = req.body ?? {};
    const { game, playerId, playerToken } = createGame(hostName ?? '', {
      maxPlayers: Number(maxPlayers),
      wolfCount: Number(wolfCount),
      roundTimerSeconds: Number(roundTimerSeconds),
    });
    res.json({ gameCode: game.gameCode, playerId, playerToken });
  } catch (err) {
    sendError(res, err);
  }
});

app.post(ApiRoutes.joinGame(':code'), (req: Request, res: Response) => {
  try {
    const { game, playerId, playerToken } = joinGame(req.params.code, req.body?.name ?? '');
    res.json({ gameCode: game.gameCode, playerId, playerToken });
  } catch (err) {
    sendError(res, err);
  }
});

app.get(ApiRoutes.state(':code'), (req: Request, res: Response) => {
  try {
    const { playerId, playerToken } = req.query;
    const gameCode = req.params.code;
    authenticate(gameCode, playerId, playerToken);
    touchPlayer(gameCode, playerId as string);
    res.json(buildClientView(getGameState(gameCode), playerId as string));
  } catch (err) {
    sendError(res, err);
  }
});

app.post(ApiRoutes.startGame(':code'), action((gameCode, playerId) => startGame(gameCode, playerId)));
app.post(ApiRoutes.revealRoleAck(':code'), action((gameCode, playerId) => acknowledgeRoleReveal(gameCode, playerId)));
app.post(ApiRoutes.drawQuestionCard(':code'), action((gameCode, playerId) => drawQuestionCard(gameCode, playerId)));
app.post(
  ApiRoutes.submitVote(':code'),
  action((gameCode, playerId, body) => submitVote(gameCode, playerId, String(body.targetPlayerId ?? '')))
);
app.post(ApiRoutes.showVoteRecord(':code'), action((gameCode) => showVoteRecord(gameCode)));
app.post(ApiRoutes.hideVoteRecord(':code'), action((gameCode) => hideVoteRecord(gameCode)));
app.post(ApiRoutes.hostEndGame(':code'), action((gameCode, playerId) => hostEndGame(gameCode, playerId)));
app.post(ApiRoutes.hostPauseGame(':code'), action((gameCode, playerId) => hostPauseGame(gameCode, playerId)));
app.post(ApiRoutes.hostResumeGame(':code'), action((gameCode, playerId) => hostResumeGame(gameCode, playerId)));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Sheep & Wolves server listening on :${PORT}`);
});
