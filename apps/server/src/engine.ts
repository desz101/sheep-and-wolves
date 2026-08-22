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

let notify: (gameCode: string) => void = () => {};
export function setNotifier(fn: (gameCode: string) => void) {
  notify = fn;
}

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

function scheduleTimer(gameCode: string, delayMs: number, handler: () => void): void {
  gameStore.setTimer(
    gameCode,
    setTimeout(() => {
      handler();
    }, delayMs)
  );
}

function requireGame(gameCode: string): Game {
  const game = gameStore.get(normalizeGameCode(gameCode));
  if (!game) throw new GameError('Game not found.', 'NOT_FOUND');
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

// ---------------- Lobby ----------------

export function createGame(
  hostName: string,
  config: GameConfig
): { game: Game; playerId: string; playerToken: string } {
  const trimmedName = hostName.trim().slice(0, 24);
  if (!trimmedName) throw new GameError('Enter a name.', 'INVALID_NAME');

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
    connectionStatus: 'connected',
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
  const trimmedName = name.trim().slice(0, 24);
  if (!trimmedName) throw new GameError('Enter a name.', 'INVALID_NAME');

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
    connectionStatus: 'connected',
    eliminatedRound: null,
  };
  game.players[playerId] = player;
  game.playerOrder.push(playerId);

  const playerToken = gameStore.createToken(gameCode, playerId);
  notify(gameCode);
  return { game, playerId, playerToken };
}

export function reconnect(gameCodeRaw: string, token: string): { game: Game; playerId: string } {
  const gameCode = normalizeGameCode(gameCodeRaw);
  const entry = gameStore.resolveToken(token);
  if (!entry || entry.gameCode !== gameCode) throw new GameError('Session expired.', 'BAD_TOKEN');
  const game = gameStore.get(gameCode);
  if (!game) throw new GameError('Game not found.', 'NOT_FOUND');
  const player = game.players[entry.playerId];
  if (!player) throw new GameError('Player not found.', 'NOT_FOUND');
  player.connectionStatus = 'connected';
  notify(gameCode);
  return { game, playerId: entry.playerId };
}

export function markDisconnected(gameCode: string, playerId: string): void {
  const game = gameStore.get(gameCode);
  if (!game) return;
  const player = game.players[playerId];
  if (!player) return;
  player.connectionStatus = 'disconnected';
  notify(gameCode);
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
  notify(game.gameCode);
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
  notify(game.gameCode);
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
  scheduleTimer(game.gameCode, game.config.roundTimerSeconds * 1000, () => onDiscussionTimeout(game.gameCode));
  notify(game.gameCode);
}

function onDiscussionTimeout(gameCode: string): void {
  const game = gameStore.get(gameCode);
  if (!game || game.status !== 'DISCUSSION') return;
  game.status = 'VOTING';
  game.phaseEndsAt = null;
  notify(gameCode);
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
  notify(game.gameCode);

  if (alivePlayers(game).every((p) => p.hasVoted)) {
    resolveVotes(game);
    notify(game.gameCode);
  }
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
    scheduleTimer(game.gameCode, TIEBREAKER_ANNOUNCE_MS, () => onTiebreakerAnnounceTimeout(game.gameCode));
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
  scheduleTimer(game.gameCode, VOTE_REVEAL_DISPLAY_MS, () => onVoteRevealTimeout(game.gameCode));
}

function onTiebreakerAnnounceTimeout(gameCode: string): void {
  const game = gameStore.get(gameCode);
  if (!game || game.status !== 'TIEBREAKER') return;
  resetVotes(game);
  game.status = 'VOTING';
  game.phaseEndsAt = null;
  notify(gameCode);
}

function onVoteRevealTimeout(gameCode: string): void {
  const game = gameStore.get(gameCode);
  if (!game || game.status !== 'VOTE_REVEAL') return;
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
  game.status = 'ELIMINATION';
  game.phaseEndsAt = Date.now() + ELIMINATION_DISPLAY_MS;
  scheduleTimer(gameCode, ELIMINATION_DISPLAY_MS, () => onEliminationTimeout(gameCode));
  notify(gameCode);
}

function onEliminationTimeout(gameCode: string): void {
  const game = gameStore.get(gameCode);
  if (!game || game.status !== 'ELIMINATION') return;

  const alive = alivePlayers(game);
  const aliveWolves = alive.filter((p) => p.role === 'wolf').length;
  const aliveSheep = alive.filter((p) => p.role === 'sheep').length;
  const winner = checkWinner(aliveSheep, aliveWolves);

  if (winner) {
    game.winner = winner;
    game.status = 'GAME_OVER';
    game.phaseEndsAt = null;
    gameStore.clearTimer(gameCode);
  } else {
    beginRound(game, game.currentRound + 1);
  }
  notify(gameCode);
}

// ---------------- Vote record (paper trail) ----------------

export function showVoteRecord(gameCodeRaw: string): void {
  const game = requireGame(gameCodeRaw);
  const latest = game.voteHistory[game.voteHistory.length - 1];
  if (!latest) throw new GameError('No vote record yet.', 'NOT_FOUND');
  if (latest.revealUsed) throw new GameError('The vote record has already been revealed for this round.', 'ALREADY_USED');
  game.voteRecordVisible = true;
  latest.revealUsed = true;
  notify(game.gameCode);
}

export function hideVoteRecord(gameCodeRaw: string): void {
  const game = requireGame(gameCodeRaw);
  game.voteRecordVisible = false;
  notify(game.gameCode);
}

// ---------------- Host controls ----------------

export function hostEndGame(gameCodeRaw: string, requesterId: string): void {
  const game = requireGame(gameCodeRaw);
  requireHost(game, requesterId);
  requireAlive(game, requesterId);
  game.status = 'CANCELLED';
  game.phaseEndsAt = null;
  gameStore.clearTimer(game.gameCode);
  notify(game.gameCode);
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
  gameStore.clearTimer(game.gameCode);
  notify(game.gameCode);
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
  scheduleTimer(game.gameCode, remaining, () => onDiscussionTimeout(game.gameCode));
  notify(game.gameCode);
}
