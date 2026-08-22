'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ClientEvents, ClientGameState, ErrorPayload, JoinAckPayload, ServerEvents } from '@sw/shared';
import { getSocket } from './socket';
import { loadSession, saveSession } from './session';

interface GameContextValue {
  state: ClientGameState | null;
  connected: boolean;
  error: string | null;
  clockOffsetMs: number;
  noSession: boolean;
  actions: {
    startGame: () => void;
    revealRoleAck: () => void;
    drawQuestionCard: () => void;
    submitVote: (targetPlayerId: string) => void;
    showVoteRecord: () => void;
    hideVoteRecord: () => void;
    hostEndGame: () => void;
    hostPauseGame: () => void;
    hostResumeGame: () => void;
    dismissError: () => void;
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ gameCode, children }: { gameCode: string; children: React.ReactNode }) {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [noSession, setNoSession] = useState(false);
  const attemptedReconnect = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    function onGameState(payload: ClientGameState) {
      setState(payload);
    }
    function onError(payload: ErrorPayload) {
      setError(payload.message);
    }
    function onJoinAck(payload: JoinAckPayload) {
      saveSession(payload);
    }
    function onConnect() {
      setConnected(true);
      syncClock();
      const session = loadSession(gameCode);
      if (session) {
        socket.emit(ClientEvents.Reconnect, { gameCode, playerToken: session.playerToken });
      } else {
        setNoSession(true);
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onPong({ clientSentAt, serverNow }: { clientSentAt: number; serverNow: number }) {
      const rtt = Date.now() - clientSentAt;
      const estimatedServerNow = serverNow + rtt / 2;
      setClockOffsetMs(estimatedServerNow - Date.now());
    }
    function syncClock() {
      socket.emit(ClientEvents.PingClock, Date.now());
    }

    socket.on(ServerEvents.GameState, onGameState);
    socket.on(ServerEvents.Error, onError);
    socket.on(ServerEvents.JoinAck, onJoinAck);
    socket.on(ServerEvents.PongClock, onPong);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected && !attemptedReconnect.current) {
      attemptedReconnect.current = true;
      onConnect();
    }

    const clockInterval = setInterval(syncClock, 15000);

    return () => {
      socket.off(ServerEvents.GameState, onGameState);
      socket.off(ServerEvents.Error, onError);
      socket.off(ServerEvents.JoinAck, onJoinAck);
      socket.off(ServerEvents.PongClock, onPong);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      clearInterval(clockInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode]);

  const actions = useMemo(
    () => ({
      startGame: () => getSocket().emit(ClientEvents.StartGame, { gameCode }),
      revealRoleAck: () => getSocket().emit(ClientEvents.RevealRoleAck, { gameCode }),
      drawQuestionCard: () => getSocket().emit(ClientEvents.DrawQuestionCard, { gameCode }),
      submitVote: (targetPlayerId: string) => getSocket().emit(ClientEvents.SubmitVote, { gameCode, targetPlayerId }),
      showVoteRecord: () => getSocket().emit(ClientEvents.ShowVoteRecord, { gameCode }),
      hideVoteRecord: () => getSocket().emit(ClientEvents.HideVoteRecord, { gameCode }),
      hostEndGame: () => getSocket().emit(ClientEvents.HostEndGame, { gameCode }),
      hostPauseGame: () => getSocket().emit(ClientEvents.HostPauseGame, { gameCode }),
      hostResumeGame: () => getSocket().emit(ClientEvents.HostResumeGame, { gameCode }),
      dismissError: () => setError(null),
    }),
    [gameCode]
  );

  return (
    <GameContext.Provider value={{ state, connected, error, clockOffsetMs, noSession, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
