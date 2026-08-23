import crypto from 'crypto';
import {
  Game,
  GameConfig,
  Player,
  Role,
  assignRoles,
  checkWinner,
  drawQuestion,
  freshQuestionDeck,
  generateGameCode,
  generateRandomName,
  normalizeGameCode,
  pickRandom,
  tallyVotes,
  validateGameConfig,
} from '@sw/shared';
import { gameStore } from './gameStore';

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

function newPlayerId(): string {
  return crypto.randomBytes(8).toString('hex');
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
        // No timed transition defined for this status -- stop rather than spin.
        return;
    }
  }
}

function requireGame(gameCode: string): Game {
  const game = gameStore.get(normalizeGameCode(gameCode));
  if (!game) throw new GameError('Game not found.', 'NOT_FOUND');
  resolveExpiry(game);
  return game;
}

/** Fetches a game with any due phase transitions applied -- used by the state poll route. */
export function getGameState(gameCode: string): Game {
  return requireGame(gameCode);
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
export function touchPlayer(gameCode: string, playerId: string): void {
  const game = requireGame(gameCode);
  const player = game.players[playerId];
  if (player) player.lastSeenAt = Date.now();
}

// ---------------- Lobby ----------------

export function createGame(
  hostName: string,
  config: GameConfig
): { game: Game; playerId: string; playerToken: string } {
  const trimmedName = hostName.trim().slice(0, 24) || generateRandomName();

  const validationError = validateGameConfig(config.maxPlayers, config.wolfCount, config.roundTimerSeconds);
  if (validationError) throw new GameError(validationError, 'INVALID_CONFIG');

  let gameCode = generateGameCode();
  while (gameStore.has(gameCode)) gameCode = generateGameCode();

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

  gameStore.set(game);
  const playerToken = gameStore.createToken(gameCode, hostId);
  return { game, playerId: hostId, playerToken };
}

export function joinGame(gameCodeRaw: string, name: string): { game: Game; playerId: string; playerToken: string } {
  const gameCode = normalizeGameCode(gameCodeRaw);
  const game = gameStore.get(gameCode);
  if (!game) throw new GameError('Game code not found.', 'NOT_FOUND');
  if (game.status !== 'LOBBY') throw new GameError('This game has already started.', 'ALREADY_STARTED');
  if (game.playerOrder.length >= game.config.maxPlayers) {
    throw new GameError('This game is full.', 'GAME_FULL');
  }
  const trimmedName = name.trim().slice(0, 24) || generateRandomName();

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
  game.players[playerId] = player;
  game.playerOrder.push(playerId);

  const playerToken = gameStore.createToken(gameCode, playerId);
  gameStore.set(game);
  return { game, playerId, playerToken };
}

// ---------------- Game start / role reveal ----------------

export function startGame(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
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
  gameStore.set(game);
}

export function acknowledgeRoleReveal(gameCode: string, playerId: string): void {
  const game = requireGame(gameCode);
  if (game.status !== 'ROLE_REVEAL') throw new GameError('Not in role reveal.', 'BAD_STATE');
  const player = game.players[playerId];
  if (!player) throw new GameError('Player not found.', 'NOT_FOUND');
  player.hasRevealedRole = true;

  const allRevealed = alivePlayers(game).every((p) => p.hasRevealedRole);
  if (allRevealed) {
    beginRound(game, 1);
  }
  gameStore.set(game);
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

export function drawQuestionCard(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
  if (game.status !== 'QUESTION_SELECTION') throw new GameError('Not waiting on the question card.', 'BAD_STATE');
  if (game.questionCardHolderId !== requesterId) {
    throw new GameError('Only the player holding the question card can draw it.', 'NOT_ALLOWED');
  }
  game.status = 'DISCUSSION';
  game.phaseEndsAt = Date.now() + game.config.roundTimerSeconds * 1000;
  gameStore.set(game);
}

export function submitVote(gameCodeRaw: string, voterId: string, targetId: string): void {
  const game = requireGame(gameCodeRaw);
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
  gameStore.set(game);
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

export function showVoteRecord(gameCodeRaw: string): void {
  const game = requireGame(gameCodeRaw);
  const latest = game.voteHistory[game.voteHistory.length - 1];
  if (!latest) throw new GameError('No vote record yet.', 'NOT_FOUND');
  if (latest.revealUsed) throw new GameError('The vote record has already been revealed for this round.', 'ALREADY_USED');
  game.voteRecordVisible = true;
  latest.revealUsed = true;
  gameStore.set(game);
}

export function hideVoteRecord(gameCodeRaw: string): void {
  const game = requireGame(gameCodeRaw);
  game.voteRecordVisible = false;
  gameStore.set(game);
}

// ---------------- Host controls ----------------

export function hostEndGame(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
  requireHost(game, requesterId);
  requireAlive(game, requesterId);
  game.status = 'CANCELLED';
  game.phaseEndsAt = null;
  gameStore.set(game);
}

export function hostPauseGame(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
  requireHost(game, requesterId);
  requireAlive(game, requesterId);
  if (game.status !== 'DISCUSSION' || game.phaseEndsAt === null) {
    throw new GameError('Can only pause during discussion.', 'BAD_STATE');
  }
  game.paused = true;
  game.pausedRemainingMs = Math.max(0, game.phaseEndsAt - Date.now());
  gameStore.set(game);
}

export function hostResumeGame(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
  requireHost(game, requesterId);
  requireAlive(game, requesterId);
  if (!game.paused || game.pausedRemainingMs === null) throw new GameError('Game is not paused.', 'BAD_STATE');
  const remaining = game.pausedRemainingMs;
  game.paused = false;
  game.pausedRemainingMs = null;
  game.phaseEndsAt = Date.now() + remaining;
  gameStore.set(game);
}
