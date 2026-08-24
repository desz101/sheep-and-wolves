'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ClientGameState, POLL_INTERVAL_MS } from '@sw/shared';
import * as api from './api';
import { stopHomeMusic } from './homeMusic';
import { loadSession } from './session';

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
    toggleReadyToVote: () => void;
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

// RTT/2 clock-offset estimate from a single timed request, matching the old
// ping/pong math -- there's just no dedicated endpoint for it anymore, since
// every response already carries serverNow.
function estimateOffset(serverNow: number, sentAt: number, receivedAt: number): number {
  return serverNow + (receivedAt - sentAt) / 2 - receivedAt;
}

export function GameProvider({ gameCode, children }: { gameCode: string; children: React.ReactNode }) {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [noSession, setNoSession] = useState(false);

  const applyTimed = useCallback((timed: { body: ClientGameState; sentAt: number; receivedAt: number }) => {
    setState(timed.body);
    setConnected(true);
    setClockOffsetMs(estimateOffset(timed.body.serverNow, timed.sentAt, timed.receivedAt));
  }, []);

  const poll = useCallback(async () => {
    const session = loadSession(gameCode);
    if (!session) {
      setNoSession(true);
      return;
    }
    try {
      const timed = await api.fetchState(gameCode, session.playerId, session.playerToken);
      applyTimed(timed);
    } catch (err) {
      setConnected(false);
      if (err instanceof api.ApiError && err.code === 'BAD_TOKEN') setNoSession(true);
    }
  }, [gameCode, applyTimed]);

  useEffect(() => {
    // Deferred rather than called directly: `poll` can set state on its first
    // synchronous branch (no session yet), and effects shouldn't set state
    // synchronously during their own body.
    const kickoff = setTimeout(poll, 0);
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [poll]);

  // Home-screen music (see HomeMusicPlayer) is meant to be a pre-game-only
  // touch -- fine through setup and the lobby, but not once play is actually
  // underway. This is the one place that sees every game's status regardless
  // of which phase view is rendered.
  useEffect(() => {
    if (state && state.status !== 'LOBBY') stopHomeMusic();
  }, [state]);

  const runAction = useCallback(
    async (fn: (gameCode: string, playerId: string, playerToken: string) => Promise<{ body: ClientGameState; sentAt: number; receivedAt: number }>) => {
      const session = loadSession(gameCode);
      if (!session) {
        setNoSession(true);
        return;
      }
      try {
        const timed = await fn(gameCode, session.playerId, session.playerToken);
        applyTimed(timed);
      } catch (err) {
        setError(err instanceof api.ApiError ? err.message : 'Something went wrong.');
      }
    },
    [gameCode, applyTimed]
  );

  const actions: GameContextValue['actions'] = {
    startGame: () => runAction(api.startGame),
    revealRoleAck: () => runAction(api.revealRoleAck),
    drawQuestionCard: () => runAction(api.drawQuestionCard),
    toggleReadyToVote: () => runAction(api.toggleReadyToVote),
    submitVote: (targetPlayerId: string) => runAction((gc, pid, tok) => api.submitVote(gc, pid, tok, targetPlayerId)),
    showVoteRecord: () => runAction(api.showVoteRecord),
    hideVoteRecord: () => runAction(api.hideVoteRecord),
    hostEndGame: () => runAction(api.hostEndGame),
    hostPauseGame: () => runAction(api.hostPauseGame),
    hostResumeGame: () => runAction(api.hostResumeGame),
    dismissError: () => setError(null),
  };

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
