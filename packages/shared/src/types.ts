// Core domain types shared between server and any client (web, future native apps).
// The server is the only place a full `Game` object with all roles/votes ever exists.

export type Role = 'sheep' | 'wolf';

export type ConnectionStatus = 'connected' | 'disconnected';

export type GameStatus =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'QUESTION_SELECTION'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'TIEBREAKER'
  | 'ELIMINATION'
  | 'GAME_OVER'
  | 'CANCELLED';

export interface Player {
  id: string;
  name: string;
  // Cosmetic sheep avatar key (see AVATAR_KEYS). Assigned a random one on
  // join; the picker screen lets a player swap it before the game starts.
  avatar: string;
  role: Role | null;
  isAlive: boolean;
  isHost: boolean;
  hasRevealedRole: boolean;
  hasVoted: boolean;
  readyToVote: boolean;
  joinedAt: number;
  // Updated on every authenticated request from this player (action or state
  // poll). connectionStatus is derived from this, not stored directly -- there's
  // no socket to tell us the instant someone drops.
  lastSeenAt: number;
  eliminatedRound: number | null;
}

export interface VoteRecordEntry {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
}

export interface RoundVoteRecord {
  round: number;
  isTiebreaker: boolean;
  votes: VoteRecordEntry[];
  tally: { playerId: string; playerName: string; count: number }[];
  eliminatedPlayerId: string | null;
  eliminatedRole: Role | null;
  tiedPlayerIds: string[];
  revealUsed: boolean;
}

export interface GameConfig {
  maxPlayers: number;
  wolfCount: number;
  roundTimerSeconds: number;
  // When true, the game is listed on the homepage's public games list
  // (GET /games/public) for anyone to find and join, instead of only
  // being joinable by sharing the game code.
  isPublic: boolean;
}

export type TieStrategy = 'runoff';

export interface Winner {
  team: 'sheep' | 'wolf';
  reason: string;
}

// Full authoritative state. Lives ONLY on the server.
export interface Game {
  gameId: string;
  gameCode: string;
  hostPlayerId: string;
  status: GameStatus;
  config: GameConfig;
  currentRound: number;
  currentQuestion: string | null;
  questionChoices: string[]; // the 3 options offered to the asker during QUESTION_SELECTION
  questionHistory: string[];
  questionDeck: string[]; // remaining shuffled deck
  players: Record<string, Player>;
  playerOrder: string[];
  votes: Record<string, string>; // voterId -> targetId, cleared each vote phase
  voteHistory: RoundVoteRecord[];
  voteRecordVisible: boolean;
  voteRecordUsedThisReveal: boolean;
  tiebreaker: { candidateIds: string[]; attempt: number } | null;
  lastEliminationRole: Role | null;
  lastEliminatedPlayerId: string | null;
  questionCardHolderId: string | null;
  winner: Winner | null;
  phaseEndsAt: number | null; // epoch ms, null when phase isn't timed
  paused: boolean;
  pausedRemainingMs: number | null;
  createdAt: number;
  tieStrategy: TieStrategy;
  // Request metadata for the host's POST /games call, captured server-side for
  // abuse handling / analytics. Never included in any client-facing view.
  hostIp: string | null;
  hostUserAgent: string | null;
}

// ---- Client-facing sanitized view ----

export interface ClientPlayer {
  id: string;
  name: string;
  avatar: string; // cosmetic sheep avatar key (see AVATAR_KEYS)
  isAlive: boolean;
  isHost: boolean;
  isSelf: boolean;
  hasRevealedRole: boolean;
  hasVoted: boolean;
  connectionStatus: ConnectionStatus;
  eliminatedRound: number | null;
  revealedRole: Role | null; // only set if this player has been eliminated (public knowledge)
}

export interface ClientVoteRecord {
  round: number;
  isTiebreaker: boolean;
  votes: VoteRecordEntry[];
  tally: { playerId: string; playerName: string; count: number }[];
  eliminatedPlayerId: string | null;
  eliminatedRole: Role | null;
  tiedPlayerIds: string[];
}

export interface VoteTallyDisplay {
  round: number;
  isTiebreaker: boolean;
  tally: { playerId: string; playerName: string; count: number }[];
  eliminatedPlayerId: string | null;
  eliminatedPlayerName: string | null;
  eliminatedRole: Role | null;
  tiedPlayerIds: string[];
}

export interface ClientGameState {
  gameCode: string;
  status: GameStatus;
  config: GameConfig;
  currentRound: number;
  currentQuestion: string | null;
  questionChoices: string[]; // only populated for the asker during QUESTION_SELECTION; [] for everyone else
  players: ClientPlayer[];
  hostPlayerId: string;
  selfPlayerId: string;
  selfRole: Role | null;
  selfHasVoted: boolean;
  selfIsAlive: boolean;
  selfReadyToVote: boolean;
  // Populated only for a player who is a wolf AND has acknowledged their role
  // reveal. Lists every OTHER wolf (id + name) so the pack knows each other.
  wolfTeammates: { id: string; name: string }[];
  readyToVoteCount: number; // how many alive players are ready to skip discussion (no identities)
  readyToVoteNeeded: number;
  votingOptions: { id: string; name: string }[];
  voteCountsSubmitted: number; // how many alive players have voted (no identities)
  voteCountsNeeded: number;
  voteTally: VoteTallyDisplay | null; // shown during VOTE_REVEAL / ELIMINATION (totals only, no identities)
  latestVoteRecord: ClientVoteRecord | null; // only populated when voteRecordVisible (individual votes - paper trail)
  voteRecordVisible: boolean;
  voteRecordAvailable: boolean; // true if a record exists that CAN still be revealed once
  tiebreaker: { candidateIds: string[]; attempt: number } | null;
  winner: Winner | null;
  finalSummary: FinalSummaryEntry[] | null;
  phaseEndsAt: number | null;
  serverNow: number;
  paused: boolean;
  playersRevealedCount: number;
  playersJoinedCount: number;
  questionCardHolderId: string | null;
  questionCardHolderName: string | null;
  isQuestionCardHolder: boolean;
}

export interface FinalSummaryEntry {
  playerId: string;
  name: string;
  role: Role;
  eliminatedRound: number | null; // null = survived
}

// ---- HTTP payloads ----

export interface CreateGamePayload {
  hostName: string;
  maxPlayers: number;
  wolfCount: number;
  roundTimerSeconds: number;
  isPublic: boolean;
}

// Returned by GET /games/public -- one entry per public game still in its
// lobby (not yet started, not full). Deliberately a small summary, not a
// ClientGameState: this is visible to anyone browsing the homepage, not just
// players who've joined.
export interface PublicGameSummary {
  gameCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  wolfCount: number;
}

// Returned by POST /games and POST /games/:code/join -- the credentials the
// client stores and sends with every subsequent request.
export interface SessionAck {
  gameCode: string;
  playerId: string;
  playerToken: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// Returned by POST /games/:code/voice-token -- a short-lived LiveKit room
// token scoped to this game's voice room and this player's identity.
export interface VoiceTokenAck {
  token: string;
}
