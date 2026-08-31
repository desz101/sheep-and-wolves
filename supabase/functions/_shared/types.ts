// Ported from packages/shared/src/types.ts. Deno Edge Functions can't resolve
// the @sw/shared npm workspace package (they're bundled standalone, outside
// the monorepo's node_modules), so the pieces engine.ts/sanitize.ts/gameStore.ts
// need are duplicated here. Keep this in sync with packages/shared/src/types.ts
// by hand if either changes -- there's no automated link between them.

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
  role: Role | null;
  isAlive: boolean;
  isHost: boolean;
  hasRevealedRole: boolean;
  hasVoted: boolean;
  readyToVote: boolean;
  joinedAt: number;
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
  questionHistory: string[];
  questionDeck: string[];
  players: Record<string, Player>;
  playerOrder: string[];
  votes: Record<string, string>;
  voteHistory: RoundVoteRecord[];
  voteRecordVisible: boolean;
  voteRecordUsedThisReveal: boolean;
  tiebreaker: { candidateIds: string[]; attempt: number } | null;
  lastEliminationRole: Role | null;
  lastEliminatedPlayerId: string | null;
  questionCardHolderId: string | null;
  winner: Winner | null;
  phaseEndsAt: number | null;
  paused: boolean;
  pausedRemainingMs: number | null;
  createdAt: number;
  tieStrategy: TieStrategy;
}

// ---- Client-facing sanitized view ----

export interface ClientPlayer {
  id: string;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  isSelf: boolean;
  hasRevealedRole: boolean;
  hasVoted: boolean;
  connectionStatus: ConnectionStatus;
  eliminatedRound: number | null;
  revealedRole: Role | null;
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

export interface FinalSummaryEntry {
  playerId: string;
  name: string;
  role: Role;
  eliminatedRound: number | null;
}

export interface ClientGameState {
  gameCode: string;
  status: GameStatus;
  config: GameConfig;
  currentRound: number;
  currentQuestion: string | null;
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
  readyToVoteCount: number;
  readyToVoteNeeded: number;
  votingOptions: { id: string; name: string }[];
  voteCountsSubmitted: number;
  voteCountsNeeded: number;
  voteTally: VoteTallyDisplay | null;
  latestVoteRecord: ClientVoteRecord | null;
  voteRecordVisible: boolean;
  voteRecordAvailable: boolean;
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
