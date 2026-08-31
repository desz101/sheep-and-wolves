// HTTP route paths shared by server and client, so a path never drifts between them.
// Every game-scoped route takes the game code in the URL; authenticated ones expect
// { playerId, playerToken } in the POST body (or query string, for the GET state poll).

export const ApiRoutes = {
  createGame: () => `/games`,
  joinGame: (gameCode: string) => `/games/${gameCode}/join`,
  state: (gameCode: string) => `/games/${gameCode}/state`,
  startGame: (gameCode: string) => `/games/${gameCode}/start`,
  revealRoleAck: (gameCode: string) => `/games/${gameCode}/role-reveal-ack`,
  drawQuestionCard: (gameCode: string) => `/games/${gameCode}/draw-question-card`,
  toggleReadyToVote: (gameCode: string) => `/games/${gameCode}/ready-to-vote`,
  submitVote: (gameCode: string) => `/games/${gameCode}/vote`,
  showVoteRecord: (gameCode: string) => `/games/${gameCode}/vote-record/show`,
  hideVoteRecord: (gameCode: string) => `/games/${gameCode}/vote-record/hide`,
  hostEndGame: (gameCode: string) => `/games/${gameCode}/end`,
  hostPauseGame: (gameCode: string) => `/games/${gameCode}/pause`,
  hostResumeGame: (gameCode: string) => `/games/${gameCode}/resume`,
  voiceToken: (gameCode: string) => `/games/${gameCode}/voice-token`,
} as const;
