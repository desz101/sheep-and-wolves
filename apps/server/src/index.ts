import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { ClientEvents, ServerEvents, normalizeGameCode } from '@sw/shared';
import { gameStore } from './gameStore';
import { buildClientView } from './sanitize';
import {
  GameError,
  acknowledgeRoleReveal,
  createGame,
  drawQuestionCard,
  hideVoteRecord,
  hostEndGame,
  hostPauseGame,
  hostResumeGame,
  joinGame,
  markDisconnected,
  reconnect,
  setNotifier,
  showVoteRecord,
  startGame,
  submitVote,
} from './engine';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ORIGIN, methods: ['GET', 'POST'] },
});

// socket.id -> { gameCode, playerId }
const socketMembership = new Map<string, { gameCode: string; playerId: string }>();

function broadcast(gameCode: string): void {
  const game = gameStore.get(gameCode);
  if (!game) return;
  const room = io.sockets.adapter.rooms.get(gameCode);
  if (!room) return;
  for (const socketId of room) {
    const membership = socketMembership.get(socketId);
    if (!membership || membership.gameCode !== gameCode) continue;
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    socket.emit(ServerEvents.GameState, buildClientView(game, membership.playerId));
  }
}

setNotifier(broadcast);

function sendError(socket: Socket, err: unknown): void {
  const message = err instanceof GameError ? err.message : 'Something went wrong.';
  const code = err instanceof GameError ? err.code : 'UNKNOWN';
  socket.emit(ServerEvents.Error, { message, code });
}

io.on('connection', (socket: Socket) => {
  socket.on(ClientEvents.PingClock, (clientSentAt: number) => {
    socket.emit(ServerEvents.PongClock, { clientSentAt, serverNow: Date.now() });
  });

  socket.on(ClientEvents.CreateGame, (payload: { hostName: string; maxPlayers: number; wolfCount: number; roundTimerSeconds: number }) => {
    try {
      const { game, playerId, playerToken } = createGame(payload.hostName, {
        maxPlayers: Number(payload.maxPlayers),
        wolfCount: Number(payload.wolfCount),
        roundTimerSeconds: Number(payload.roundTimerSeconds),
      });
      socket.join(game.gameCode);
      socketMembership.set(socket.id, { gameCode: game.gameCode, playerId });
      socket.emit(ServerEvents.JoinAck, { gameCode: game.gameCode, playerId, playerToken });
      broadcast(game.gameCode);
    } catch (err) {
      sendError(socket, err);
    }
  });

  socket.on(ClientEvents.JoinGame, (payload: { gameCode: string; name: string }) => {
    try {
      const { game, playerId, playerToken } = joinGame(payload.gameCode, payload.name);
      socket.join(game.gameCode);
      socketMembership.set(socket.id, { gameCode: game.gameCode, playerId });
      socket.emit(ServerEvents.JoinAck, { gameCode: game.gameCode, playerId, playerToken });
      broadcast(game.gameCode);
    } catch (err) {
      sendError(socket, err);
    }
  });

  socket.on(ClientEvents.Reconnect, (payload: { gameCode: string; playerToken: string }) => {
    try {
      const { game, playerId } = reconnect(payload.gameCode, payload.playerToken);
      socket.join(game.gameCode);
      socketMembership.set(socket.id, { gameCode: game.gameCode, playerId });
      socket.emit(ServerEvents.JoinAck, { gameCode: game.gameCode, playerId, playerToken: payload.playerToken });
      broadcast(game.gameCode);
    } catch (err) {
      sendError(socket, err);
    }
  });

  socket.on(ClientEvents.StartGame, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      startGame(payload.gameCode, m.playerId);
    });
  });

  socket.on(ClientEvents.RevealRoleAck, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      acknowledgeRoleReveal(payload.gameCode, m.playerId);
    });
  });

  socket.on(ClientEvents.DrawQuestionCard, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      drawQuestionCard(payload.gameCode, m.playerId);
    });
  });

  socket.on(ClientEvents.SubmitVote, (payload: { gameCode: string; targetPlayerId: string }) => {
    guard(socket, payload.gameCode, (m) => {
      submitVote(payload.gameCode, m.playerId, payload.targetPlayerId);
    });
  });

  socket.on(ClientEvents.ShowVoteRecord, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, () => {
      showVoteRecord(payload.gameCode);
    });
  });

  socket.on(ClientEvents.HideVoteRecord, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, () => {
      hideVoteRecord(payload.gameCode);
    });
  });

  socket.on(ClientEvents.HostEndGame, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      hostEndGame(payload.gameCode, m.playerId);
    });
  });

  socket.on(ClientEvents.HostPauseGame, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      hostPauseGame(payload.gameCode, m.playerId);
    });
  });

  socket.on(ClientEvents.HostResumeGame, (payload: { gameCode: string }) => {
    guard(socket, payload.gameCode, (m) => {
      hostResumeGame(payload.gameCode, m.playerId);
    });
  });

  socket.on('disconnect', () => {
    const membership = socketMembership.get(socket.id);
    socketMembership.delete(socket.id);
    if (membership) {
      markDisconnected(membership.gameCode, membership.playerId);
    }
  });

  function guard(s: Socket, gameCodeRaw: string, fn: (m: { gameCode: string; playerId: string }) => void): void {
    try {
      const gameCode = normalizeGameCode(gameCodeRaw);
      const membership = socketMembership.get(s.id);
      if (!membership || membership.gameCode !== gameCode) {
        throw new GameError('Not connected to this game.', 'NOT_JOINED');
      }
      fn(membership);
    } catch (err) {
      sendError(s, err);
    }
  }
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Sheep & Wolves server listening on :${PORT}`);
});
