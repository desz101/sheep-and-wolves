import { ClientGameState, ClientPlayer, FinalSummaryEntry, Game, PRESENCE_TIMEOUT_MS, VoteTallyDisplay } from '@sw/shared';

/**
 * Builds the per-player view of the game. This is the ONLY place client
 * payloads are constructed, and it is rebuilt fresh for every recipient on
 * every broadcast. A player's own `role` is included; every other living
 * player's role is always omitted. An eliminated player's role becomes
 * `revealedRole` (public information) for everyone.
 */
export function buildClientView(game: Game, requestingPlayerId: string): ClientGameState {
  const self = game.players[requestingPlayerId];

  const players: ClientPlayer[] = game.playerOrder
    .map((id) => game.players[id])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      isAlive: p.isAlive,
      isHost: p.isHost,
      isSelf: p.id === requestingPlayerId,
      hasRevealedRole: p.hasRevealedRole,
      hasVoted: p.hasVoted,
      connectionStatus: Date.now() - p.lastSeenAt > PRESENCE_TIMEOUT_MS ? 'disconnected' : 'connected',
      eliminatedRound: p.eliminatedRound,
      revealedRole: p.isAlive ? null : p.role,
    }));

  const alivePlayers = game.playerOrder.map((id) => game.players[id]).filter((p) => p && p.isAlive);

  const votingOptions =
    game.status === 'VOTING' && self?.isAlive
      ? alivePlayers
          .filter((p) => p.id !== requestingPlayerId)
          .filter((p) => (game.tiebreaker ? game.tiebreaker.candidateIds.includes(p.id) : true))
          .map((p) => ({ id: p.id, name: p.name }))
      : [];

  const voteTally = buildVoteTally(game);

  const latestRecord = game.voteHistory[game.voteHistory.length - 1] ?? null;
  const voteRecordAvailable = !!latestRecord && !latestRecord.revealUsed;

  const finalSummary: FinalSummaryEntry[] | null =
    game.status === 'GAME_OVER'
      ? game.playerOrder.map((id) => {
          const p = game.players[id];
          return {
            playerId: p.id,
            name: p.name,
            role: p.role as 'sheep' | 'wolf',
            eliminatedRound: p.eliminatedRound,
          };
        })
      : null;

  const questionCardHolder = game.questionCardHolderId ? game.players[game.questionCardHolderId] : null;

  return {
    gameCode: game.gameCode,
    status: game.status,
    config: game.config,
    currentRound: game.currentRound,
    // The question is drawn server-side at round start but stays hidden from
    // everyone -- including the card holder -- until they choose to draw it.
    currentQuestion: game.status === 'QUESTION_SELECTION' ? null : game.currentQuestion,
    questionCardHolderId: game.questionCardHolderId,
    questionCardHolderName: questionCardHolder?.name ?? null,
    isQuestionCardHolder: !!game.questionCardHolderId && game.questionCardHolderId === requestingPlayerId,
    players,
    hostPlayerId: game.hostPlayerId,
    selfPlayerId: requestingPlayerId,
    selfRole: self?.role ?? null,
    selfHasVoted: self?.hasVoted ?? false,
    selfIsAlive: self?.isAlive ?? false,
    votingOptions,
    voteCountsSubmitted: alivePlayers.filter((p) => p.hasVoted).length,
    voteCountsNeeded: alivePlayers.length,
    voteTally,
    latestVoteRecord: game.voteRecordVisible && latestRecord
      ? {
          round: latestRecord.round,
          isTiebreaker: latestRecord.isTiebreaker,
          votes: latestRecord.votes,
          tally: latestRecord.tally,
          eliminatedPlayerId: latestRecord.eliminatedPlayerId,
          eliminatedRole: latestRecord.eliminatedRole,
          tiedPlayerIds: latestRecord.tiedPlayerIds,
        }
      : null,
    voteRecordVisible: game.voteRecordVisible,
    voteRecordAvailable,
    tiebreaker: game.tiebreaker,
    winner: game.winner,
    finalSummary,
    phaseEndsAt: game.paused ? null : game.phaseEndsAt,
    serverNow: Date.now(),
    paused: game.paused,
    playersRevealedCount: game.playerOrder.filter((id) => game.players[id]?.hasRevealedRole).length,
    playersJoinedCount: game.playerOrder.length,
  };
}

function buildVoteTally(game: Game): VoteTallyDisplay | null {
  if (game.status !== 'VOTE_REVEAL' && game.status !== 'ELIMINATION' && game.status !== 'TIEBREAKER') {
    return null;
  }
  const record = game.voteHistory[game.voteHistory.length - 1];
  if (!record) return null;
  const eliminatedName = record.eliminatedPlayerId ? game.players[record.eliminatedPlayerId]?.name ?? null : null;
  return {
    round: record.round,
    isTiebreaker: record.isTiebreaker,
    tally: record.tally,
    eliminatedPlayerId: record.eliminatedPlayerId,
    eliminatedPlayerName: eliminatedName,
    eliminatedRole: record.eliminatedRole,
    tiedPlayerIds: record.tiedPlayerIds,
  };
}
