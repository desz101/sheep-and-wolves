// Socket.IO event name constants shared by server and client to avoid typos/drift.

export const ClientEvents = {
  CreateGame: 'create_game',
  JoinGame: 'join_game',
  Reconnect: 'reconnect',
  StartGame: 'start_game',
  RevealRoleAck: 'reveal_role_ack',
  DrawQuestionCard: 'draw_question_card',
  SubmitVote: 'submit_vote',
  ShowVoteRecord: 'show_vote_record',
  HideVoteRecord: 'hide_vote_record',
  HostEndGame: 'host_end_game',
  HostPauseGame: 'host_pause_game',
  HostResumeGame: 'host_resume_game',
  PingClock: 'ping_clock',
} as const;

export const ServerEvents = {
  GameState: 'game_state',
  JoinAck: 'join_ack',
  Error: 'error_event',
  PongClock: 'pong_clock',
} as const;
