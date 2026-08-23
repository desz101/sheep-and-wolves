// Ported from apps/server/src/engine.ts. Game logic is unchanged from the
// Express version -- only the runtime (Node -> Deno) and crypto helper changed.

import {
  Game,
  GameConfig,
  Player,
  Role,
} from './types.ts';
import {
  assignRoles,
  checkWinner,
  drawQuestion,
  freshQuestionDeck,
  generateGameCode,
  normalizeGameCode,
  pickRandom,
  tallyVotes,
  validateGameConfig,
} from './gameLogic.ts';
import { generateRandomName } from './randomName.ts';
import { randomHex } from './util.ts';
import { gameStore } from './gameStore.ts';

export class GameError extends Error {
  code: string;
  constructor(message: string, code = 'GAME_ERROR') {
    super(message);
    this.code = code;
  }
}

const VOTE_REVEAL_DISPLAY_MS = 6000;
const TIEBREAKER_ANNOUNCE_MS = 4000;
const ELIMINATION_DISPLAY_MS = 6000;
const MAX_UPDATE_ATTEMPTS = 8;

function newPlayerId(): string {
  return randomHex(8);
}

function alivePlayers(game: Game): Player[] {
  return game.playerOrder.map((id) => game.players[id]).filter((p) => p && p.isAlive);
}

function resetVotes(game: Game): void {
  game.votes = {};
  for (const p of alivePlayers(game)) p.hasVoted = false;
}

/**
 * Every timed phase transition used to be driven by a server-side setTimeout.
 * There's no process to hold that timer anymore: instead, each phase records
 * when it should end (`phaseEndsAt`), and this function -- called at the top
 * of every request that touches a game -- lazily applies any transition whose
 * time has passed. A phase advances the moment *any* player next interacts
 * with the game (an action or a state poll), not at the exact millisecond.
 */
function resolveExpiry(game: Game): void {
  while (game.phaseEndsAt !== null && !game.paused && Date.now() >= game.phaseEndsAt) {
    switch (game.status) {
      case 'DISCUSSION':
        game.status = 'VOTING';
        game.phaseEndsAt = null;
        break;
      case 'TIEBREAKER':
        resetVotes(game);
        game.status = 'VOTING';
        game.phaseEndsAt = null;
        break;
      case 'VOTE_REVEAL':
        applyElimination(game);
        game.status = 'ELIMINATION';
        game.phaseEndsAt = Date.now() + ELIMINATION_DISPLAY_MS;
        break;
      case 'ELIMINATION':
        advanceRoundOrEndGame(game);
        break;
      default:
        return;
    }
  }
}

/**
 * Every game mutation -- including a plain state poll, which may need to
 * persist a lazily-resolved phase expiry -- goes through here: fetch the
 * row with its version, resolve expiry, run `mutator` against the in-memory
 * object, then write it back conditionally on the version being unchanged.
 *
 * This exists because *every* poll from *every* open tab (roughly every
 * 1.5s per player, see touchPlayer) does a read-modify-write of the same
 * row. Without a version check, two requests that both read before either
 * writes will silently clobber each other on write -- e.g. a player join
 * getting erased by an unrelated poll's write landing right after it. A
 * GameError thrown by `mutator` (a validation failure, not a conflict)
 * propagates immediately rather than being retried; only a lost race on the
 * version check triggers a retry against freshly-read state.
 */
async function withGame<T>(
  gameCodeRaw: string,
  mutator: (game: Game) => T | Promise<T>
): Promise<{ game: Game; result: T }> {
  const gameCode = normalizeGameCode(gameCodeRaw);
  for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt++) {
    const row = await gameStore.getWithVersion(gameCode);
    if (!row) throw new GameError('Game not found.', 'NOT_FOUND');
    const game = row.state;
    resolveExpiry(game);
    const result = await mutator(game);
    const ok = await gameStore.setIfVersion(game, row.version);
    if (ok) return { game, result };
  }
  throw new GameError('This game is busy right now -- try again.', 'CONFLICT');
}

/** Fetches a game with any due phase transitions applied and persisted -- used by the state poll route. */
export async function getGameState(gameCode: string): Promise<Game> {
  const { game } = await withGame(gameCode, () => {});
  return game;
}

function requireHost(game: Game, requesterId: string): void {
  if (game.hostPlayerId !== requesterId) throw new GameError('Only the host can do that.', 'NOT_HOST');
}

function requireAlive(game: Game, requesterId: string): void {
  if (!game.players[requesterId]?.isAlive) {
    throw new GameError('Eliminated players can only spectate.', 'ELIMINATED');
  }
}

/** Marks a player as freshly seen. Called on every authenticated request (action or poll). */
export async function touchPlayer(gameCode: string, playerId: string): Promise<void> {
  await withGame(gameCode, (game) => {
    const player = game.players[playerId];
    if (player) player.lastSeenAt = Date.now();
  });
}

// ---------------- Lobby ----------------

export async function createGame(
  hostName: string,
  config: GameConfig
): Promise<{ game: Game; playerId: string; playerToken: string }> {
  const trimmedName = hostName.trim().slice(0, 24) || generateRandomName();

  const validationError = validateGameConfig(config.maxPlayers, config.wolfCount, config.roundTimerSeconds);
  if (validationError) throw new GameError(validationError, 'INVALID_CONFIG');

  let gameCode = generateGameCode();
  while (await gameStore.has(gameCode)) gameCode = generateGameCode();

  const hostId = newPlayerId();
  const hostPlayer: Player = {
    id: hostId,
    name: trimmedName,
    role: null,
    isAlive: true,
    isHost: true,
    hasRevealedRole: false,
    hasVoted: false,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    eliminatedRound: null,
  };

  const game: Game = {
    gameId: crypto.randomUUID(),
    gameCode,
    hostPlayerId: hostId,
    status: 'LOBBY',
    config,
    currentRound: 0,
    currentQuestion: null,
    questionHistory: [],
    questionDeck: freshQuestionDeck(),
    players: { [hostId]: hostPlayer },
    playerOrder: [hostId],
    votes: {},
    voteHistory: [],
    voteRecordVisible: false,
    voteRecordUsedThisReveal: false,
    tiebreaker: null,
    lastEliminationRole: null,
    lastEliminatedPlayerId: null,
    questionCardHolderId: null,
    winner: null,
    phaseEndsAt: null,
    paused: false,
    pausedRemainingMs: null,
    createdAt: Date.now(),
    tieStrategy: 'runoff',
  };

  // A fresh insert on a code we just confirmed doesn't exist -- no concurrent
  // writer to conflict with, so this doesn't need withGame's version check.
  await gameStore.insert(game);
  const playerToken = await gameStore.createToken(gameCode, hostId);
  return { game, playerId: hostId, playerToken };
}

export async function joinGame(
  gameCodeRaw: string,
  name: string
): Promise<{ game: Game; playerId: string; playerToken: string }> {
  const gameCode = normalizeGameCode(gameCodeRaw);
  const trimmedName = name.trim().slice(0, 24) || generateRandomName();

  // Generated once, outside the retry loop: withGame's mutator can run more
  // than once on a version conflict, and re-running it must be idempotent.
  const playerId = newPlayerId();
  const player: Player = {
    id: playerId,
    name: trimmedName,
    role: null,
    isAlive: true,
    isHost: false,
    hasRevealedRole: false,
    hasVoted: false,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    eliminatedRound: null,
  };

  const { game } = await withGame(gameCode, (game) => {
    if (game.status !== 'LOBBY') throw new GameError('This game has already started.', 'ALREADY_STARTED');
    if (game.playerOrder.length >= game.config.maxPlayers) {
      throw new GameError('This game is full.', 'GAME_FULL');
    }
    game.players[playerId] = player;
    game.playerOrder.push(playerId);
  });

  const playerToken = await gameStore.createToken(gameCode, playerId);
  return { game, playerId, playerToken };
}

// ---------------- Game start / role reveal ----------------

export async function startGame(gameCodeRaw: string, requesterId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    requireHost(game, requesterId);
    if (game.status !== 'LOBBY') throw new GameError('Game already started.', 'BAD_STATE');
    if (game.playerOrder.length < game.config.maxPlayers) {
      throw new GameError(`Waiting for ${game.config.maxPlayers - game.playerOrder.length} more player(s).`, 'NOT_ENOUGH_PLAYERS');
    }

    const roles = assignRoles(game.playerOrder, game.config.wolfCount);
    for (const id of game.playerOrder) {
      game.players[id].role = roles[id] as Role;
    }
    game.status = 'ROLE_REVEAL';
  });
}

export async function acknowledgeRoleReveal(gameCode: string, playerId: string): Promise<void> {
  await withGame(gameCode, (game) => {
    if (game.status !== 'ROLE_REVEAL') throw new GameError('Not in role reveal.', 'BAD_STATE');
    const player = game.players[playerId];
    if (!player) throw new GameError('Player not found.', 'NOT_FOUND');
    player.hasRevealedRole = true;

    const allRevealed = alivePlayers(game).every((p) => p.hasRevealedRole);
    if (allRevealed) {
      beginRound(game, 1);
    }
  });
}

// ---------------- Rounds ----------------

function beginRound(game: Game, roundNumber: number): void {
  game.currentRound = roundNumber;
  const { question, remainingDeck } = drawQuestion(game.questionDeck, game.currentQuestion);
  game.currentQuestion = question;
  game.questionDeck = remainingDeck;
  game.questionHistory.push(question);
  resetVotes(game);
  game.questionCardHolderId = pickRandom(alivePlayers(game)).id;
  game.status = 'QUESTION_SELECTION';
  game.phaseEndsAt = null;
}

export async function drawQuestionCard(gameCodeRaw: string, requesterId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    if (game.status !== 'QUESTION_SELECTION') throw new GameError('Not waiting on the question card.', 'BAD_STATE');
    if (game.questionCardHolderId !== requesterId) {
      throw new GameError('Only the player holding the question card can draw it.', 'NOT_ALLOWED');
    }
    game.status = 'DISCUSSION';
    game.phaseEndsAt = Date.now() + game.config.roundTimerSeconds * 1000;
  });
}

export async function submitVote(gameCodeRaw: string, voterId: string, targetId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    if (game.status !== 'VOTING') throw new GameError('Voting is not open.', 'BAD_STATE');
    const voter = game.players[voterId];
    if (!voter || !voter.isAlive) throw new GameError('You cannot vote.', 'NOT_ALLOWED');
    if (voter.hasVoted) throw new GameError('You already voted.', 'ALREADY_VOTED');
    const target = game.players[targetId];
    if (!target || !target.isAlive) throw new GameError('Invalid vote target.', 'INVALID_TARGET');
    if (targetId === voterId) throw new GameError('You cannot vote for yourself.', 'SELF_VOTE');
    if (game.tiebreaker && !game.tiebreaker.candidateIds.includes(targetId)) {
      throw new GameError('That player is not part of the tiebreaker.', 'INVALID_TARGET');
    }

    game.votes[voterId] = targetId;
    voter.hasVoted = true;

    if (alivePlayers(game).every((p) => p.hasVoted)) {
      resolveVotes(game);
    }
  });
}

function resolveVotes(game: Game): void {
  const eligibleIds = game.tiebreaker ? game.tiebreaker.candidateIds : alivePlayers(game).map((p) => p.id);
  const { tally, leaders } = tallyVotes(game.votes, eligibleIds);

  const namedTally = tally
    .map((t) => ({ playerId: t.playerId, playerName: game.players[t.playerId]?.name ?? '?', count: t.count }))
    .sort((a, b) => b.count - a.count);

  const voteEntries = Object.entries(game.votes).map(([voterId, targetId]) => ({
    voterId,
    voterName: game.players[voterId]?.name ?? '?',
    targetId,
    targetName: game.players[targetId]?.name ?? '?',
  }));

  const isTiebreakerRound = !!game.tiebreaker;

  if (leaders.length > 1) {
    game.voteHistory.push({
      round: game.currentRound,
      isTiebreaker: isTiebreakerRound,
      votes: voteEntries,
      tally: namedTally,
      eliminatedPlayerId: null,
      eliminatedRole: null,
      tiedPlayerIds: leaders,
      revealUsed: false,
    });
    game.tiebreaker = { candidateIds: leaders, attempt: (game.tiebreaker?.attempt ?? 0) + 1 };
    game.status = 'TIEBREAKER';
    game.phaseEndsAt = Date.now() + TIEBREAKER_ANNOUNCE_MS;
    return;
  }

  const eliminatedId = leaders[0] ?? null;
  game.voteHistory.push({
    round: game.currentRound,
    isTiebreaker: isTiebreakerRound,
    votes: voteEntries,
    tally: namedTally,
    eliminatedPlayerId: eliminatedId,
    eliminatedRole: eliminatedId ? game.players[eliminatedId]?.role ?? null : null,
    tiedPlayerIds: [],
    revealUsed: false,
  });
  game.tiebreaker = null;
  game.status = 'VOTE_REVEAL';
  game.phaseEndsAt = Date.now() + VOTE_REVEAL_DISPLAY_MS;
}

function applyElimination(game: Game): void {
  const record = game.voteHistory[game.voteHistory.length - 1];
  if (record?.eliminatedPlayerId) {
    const eliminated = game.players[record.eliminatedPlayerId];
    if (eliminated) {
      eliminated.isAlive = false;
      eliminated.eliminatedRound = record.round;
    }
    game.lastEliminatedPlayerId = record.eliminatedPlayerId;
    game.lastEliminationRole = record.eliminatedRole;
  }
}

function advanceRoundOrEndGame(game: Game): void {
  const alive = alivePlayers(game);
  const aliveWolves = alive.filter((p) => p.role === 'wolf').length;
  const aliveSheep = alive.filter((p) => p.role === 'sheep').length;
  const winner = checkWinner(aliveSheep, aliveWolves);

  if (winner) {
    game.winner = winner;
    game.status = 'GAME_OVER';
    game.phaseEndsAt = null;
  } else {
    beginRound(game, game.currentRound + 1);
  }
}

// ---------------- Vote record (paper trail) ----------------

export async function showVoteRecord(gameCodeRaw: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    const latest = game.voteHistory[game.voteHistory.length - 1];
    if (!latest) throw new GameError('No vote record yet.', 'NOT_FOUND');
    if (latest.revealUsed) throw new GameError('The vote record has already been revealed for this round.', 'ALREADY_USED');
    game.voteRecordVisible = true;
    latest.revealUsed = true;
  });
}

export async function hideVoteRecord(gameCodeRaw: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    game.voteRecordVisible = false;
  });
}

// ---------------- Host controls ----------------

export async function hostEndGame(gameCodeRaw: string, requesterId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    game.status = 'CANCELLED';
    game.phaseEndsAt = null;
  });
}

export async function hostPauseGame(gameCodeRaw: string, requesterId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    if (game.status !== 'DISCUSSION' || game.phaseEndsAt === null) {
      throw new GameError('Can only pause during discussion.', 'BAD_STATE');
    }
    game.paused = true;
    game.pausedRemainingMs = Math.max(0, game.phaseEndsAt - Date.now());
  });
}

export async function hostResumeGame(gameCodeRaw: string, requesterId: string): Promise<void> {
  await withGame(gameCodeRaw, (game) => {
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    if (!game.paused || game.pausedRemainingMs === null) throw new GameError('Game is not paused.', 'BAD_STATE');
    const remaining = game.pausedRemainingMs;
    game.paused = false;
    game.pausedRemainingMs = null;
    game.phaseEndsAt = Date.now() + remaining;
  });
}
