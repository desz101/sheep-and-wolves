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
import { isAvatarKey, randomAvatar } from './constants.ts';
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
const MAX_UPDATE_ATTEMPTS = 5;
// Presence (lastSeenAt) doesn't need sub-second precision -- only actually
// write it once it's gone stale by this much. With N tabs polling every
// ~1.5s, this turns most polls into a pure read with zero write contention
// instead of a write every single poll from every open tab.
const PRESENCE_TOUCH_INTERVAL_MS = 3000;

function newPlayerId(): string {
  return randomHex(8);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential-ish backoff with jitter, capped at ~400ms base. Spreads out
 * retries from competing writers on the same row so they don't all wake up
 * and re-collide at the same instant -- without this, a handful of tabs
 * polling the same game can retry in lockstep indefinitely under load.
 */
function backoffDelay(attempt: number): number {
  const base = Math.min(40 * 2 ** attempt, 400);
  return base + Math.random() * base;
}

/** Touches a player's presence only if it's actually gone stale. Returns whether it wrote anything. */
function touchIfStale(game: Game, playerId: string): boolean {
  const player = game.players[playerId];
  if (!player) return false;
  const now = Date.now();
  if (now - player.lastSeenAt < PRESENCE_TOUCH_INTERVAL_MS) return false;
  player.lastSeenAt = now;
  return true;
}

function alivePlayers(game: Game): Player[] {
  return game.playerOrder.map((id) => game.players[id]).filter((p) => p && p.isAlive);
}

function resetVotes(game: Game): void {
  game.votes = {};
  for (const p of alivePlayers(game)) {
    p.hasVoted = false;
    p.readyToVote = false;
  }
}

/**
 * Every timed phase transition used to be driven by a server-side setTimeout.
 * There's no process to hold that timer anymore: instead, each phase records
 * when it should end (`phaseEndsAt`), and this function -- called at the top
 * of every request that touches a game -- lazily applies any transition whose
 * time has passed. A phase advances the moment *any* player next interacts
 * with the game (an action or a state poll), not at the exact millisecond.
 */
function resolveExpiry(game: Game): boolean {
  let changed = false;
  while (game.phaseEndsAt !== null && !game.paused && Date.now() >= game.phaseEndsAt) {
    changed = true;
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
        return changed;
    }
  }
  return changed;
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
    if (attempt > 0) await sleep(backoffDelay(attempt - 1));
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

/**
 * Like withGame, but for paths where a write frequently isn't needed at all
 * -- specifically, polling. `mutator` reports whether it actually changed
 * anything (see touchIfStale); when neither it nor the lazy phase-expiry
 * check changed anything, the read is returned without ever attempting a
 * write. A game with several idle tabs polling it generates near-zero
 * database writes instead of one full read-modify-write per poll per tab.
 */
async function withGameMaybeWrite(gameCodeRaw: string, mutator: (game: Game) => boolean): Promise<Game> {
  const gameCode = normalizeGameCode(gameCodeRaw);
  for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(backoffDelay(attempt - 1));
    const row = await gameStore.getWithVersion(gameCode);
    if (!row) throw new GameError('Game not found.', 'NOT_FOUND');
    const game = row.state;
    const expiryChanged = resolveExpiry(game);
    const mutatorChanged = mutator(game);
    if (!expiryChanged && !mutatorChanged) return game;
    const ok = await gameStore.setIfVersion(game, row.version);
    if (ok) return game;
  }
  throw new GameError('This game is busy right now -- try again.', 'CONFLICT');
}

/**
 * Fetches a game with any due phase transitions applied and persisted, and
 * marks the requesting player freshly seen (only actually writing that if
 * it's gone stale -- see touchIfStale). This is the *only* thing a plain
 * state poll needs, so it does the whole cycle in one read-modify-write
 * instead of the two separate ones (touch, then a fresh read) it used to.
 */
export async function pollGameState(gameCode: string, playerId: string): Promise<Game> {
  return withGameMaybeWrite(gameCode, (game) => touchIfStale(game, playerId));
}

/**
 * Plain read, no write -- used to look up a player's display name for
 * contexts (like minting a voice-chat token) that need it but aren't
 * otherwise touching game state.
 */
export async function getPlayerName(gameCodeRaw: string, playerId: string): Promise<string> {
  const gameCode = normalizeGameCode(gameCodeRaw);
  const row = await gameStore.getWithVersion(gameCode);
  if (!row) throw new GameError('Game not found.', 'NOT_FOUND');
  const player = row.state.players[playerId];
  if (!player) throw new GameError('Invalid session.', 'BAD_TOKEN');
  return player.name;
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
    avatar: randomAvatar(),
    role: null,
    isAlive: true,
    isHost: true,
    hasRevealedRole: false,
    hasVoted: false,
    readyToVote: false,
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
  // Generated once here (not inside the mutator) for the same idempotency
  // reason as playerId -- a version-conflict retry must not reshuffle it.
  const avatar = randomAvatar();
  const player: Player = {
    id: playerId,
    name: trimmedName,
    avatar,
    role: null,
    isAlive: true,
    isHost: false,
    hasRevealedRole: false,
    hasVoted: false,
    readyToVote: false,
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

export async function setAvatar(gameCodeRaw: string, requesterId: string, avatar: unknown): Promise<Game> {
  if (!isAvatarKey(avatar)) throw new GameError('Unknown avatar.', 'INVALID_AVATAR');
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    const player = game.players[requesterId];
    if (!player) throw new GameError('Player not found.', 'NOT_FOUND');
    // Avatars lock in once the game leaves the lobby -- no changing your face
    // mid-round.
    if (game.status !== 'LOBBY') throw new GameError('The game has already started.', 'BAD_STATE');
    player.avatar = avatar;
  });
  return game;
}

// ---------------- Game start / role reveal ----------------

export async function startGame(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
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
  return game;
}

export async function acknowledgeRoleReveal(gameCode: string, playerId: string): Promise<Game> {
  const { game } = await withGame(gameCode, (game) => {
    touchIfStale(game, playerId);
    if (game.status !== 'ROLE_REVEAL') throw new GameError('Not in role reveal.', 'BAD_STATE');
    const player = game.players[playerId];
    if (!player) throw new GameError('Player not found.', 'NOT_FOUND');
    player.hasRevealedRole = true;

    const allRevealed = alivePlayers(game).every((p) => p.hasRevealedRole);
    if (allRevealed) {
      beginRound(game, 1);
    }
  });
  return game;
}

// ---------------- Rounds ----------------

function beginRound(game: Game, roundNumber: number): void {
  game.currentRound = roundNumber;
  const { question, remainingDeck } = drawQuestion(game.questionDeck, game.currentQuestion);
  game.currentQuestion = question;
  game.questionDeck = remainingDeck;
  game.questionHistory.push(question);
  resetVotes(game);
  // Don't carry a still-open vote record into the next round -- the new
  // question-asker should have to choose to reveal it themselves.
  game.voteRecordVisible = false;
  game.questionCardHolderId = pickRandom(alivePlayers(game)).id;
  game.status = 'QUESTION_SELECTION';
  game.phaseEndsAt = null;
}

export async function drawQuestionCard(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    if (game.status !== 'QUESTION_SELECTION') throw new GameError('Not waiting on the question card.', 'BAD_STATE');
    if (game.questionCardHolderId !== requesterId) {
      throw new GameError('Only the player holding the question card can draw it.', 'NOT_ALLOWED');
    }
    game.status = 'DISCUSSION';
    game.phaseEndsAt = Date.now() + game.config.roundTimerSeconds * 1000;
  });
  return game;
}

/**
 * Lets a player flag themselves ready to skip the rest of discussion. Toggles
 * on repeat calls so someone can change their mind. Once every alive player
 * is ready, moves straight to VOTING instead of waiting for phaseEndsAt --
 * mirrors resolveExpiry's DISCUSSION -> VOTING transition, but skipped while
 * paused so a host break can't be short-circuited by stale readiness.
 */
export async function toggleReadyToVote(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    if (game.status !== 'DISCUSSION') throw new GameError('Not in discussion.', 'BAD_STATE');
    const player = game.players[requesterId];
    if (!player || !player.isAlive) throw new GameError('You cannot do that.', 'NOT_ALLOWED');
    player.readyToVote = !player.readyToVote;

    if (!game.paused && alivePlayers(game).every((p) => p.readyToVote)) {
      game.status = 'VOTING';
      game.phaseEndsAt = null;
    }
  });
  return game;
}

export async function submitVote(gameCodeRaw: string, voterId: string, targetId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, voterId);
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
  return game;
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

export async function showVoteRecord(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    if (game.questionCardHolderId !== requesterId) {
      throw new GameError('Only the player who asked the question can view the vote record.', 'NOT_ALLOWED');
    }
    const latest = game.voteHistory[game.voteHistory.length - 1];
    if (!latest) throw new GameError('No vote record yet.', 'NOT_FOUND');
    if (latest.revealUsed) throw new GameError('The vote record has already been revealed for this round.', 'ALREADY_USED');
    game.voteRecordVisible = true;
    latest.revealUsed = true;
  });
  return game;
}

export async function hideVoteRecord(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    if (game.questionCardHolderId !== requesterId) {
      throw new GameError('Only the player who asked the question can view the vote record.', 'NOT_ALLOWED');
    }
    game.voteRecordVisible = false;
  });
  return game;
}

// ---------------- Host controls ----------------

export async function hostEndGame(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    game.status = 'CANCELLED';
    game.phaseEndsAt = null;
  });
  return game;
}

export async function hostPauseGame(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    if (game.status !== 'DISCUSSION' || game.phaseEndsAt === null) {
      throw new GameError('Can only pause during discussion.', 'BAD_STATE');
    }
    game.paused = true;
    game.pausedRemainingMs = Math.max(0, game.phaseEndsAt - Date.now());
  });
  return game;
}

export async function hostResumeGame(gameCodeRaw: string, requesterId: string): Promise<Game> {
  const { game } = await withGame(gameCodeRaw, (game) => {
    touchIfStale(game, requesterId);
    requireHost(game, requesterId);
    requireAlive(game, requesterId);
    if (!game.paused || game.pausedRemainingMs === null) throw new GameError('Game is not paused.', 'BAD_STATE');
    const remaining = game.pausedRemainingMs;
    game.paused = false;
    game.pausedRemainingMs = null;
    game.phaseEndsAt = Date.now() + remaining;
  });
  return game;
}
