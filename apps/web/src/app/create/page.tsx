'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClientEvents, ErrorPayload, JoinAckPayload, MAX_PLAYERS, MIN_PLAYERS, ServerEvents, TIMER_PRESETS_SECONDS, maxWolvesForPlayers } from '@sw/shared';
import { getSocket } from '@/lib/socket';
import { saveSession } from '@/lib/session';
import { BigButton, Panel, SectionLabel, TextInput } from '@/components/ui';

const TIMER_LABELS: Record<number, string> = {
  60: '1 min',
  120: '2 min',
  180: '3 min',
  300: '5 min',
  420: '7 min',
  600: '10 min',
};

export default function CreatePage() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [wolfCount, setWolfCount] = useState(2);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [customTimer, setCustomTimer] = useState('');
  const [useCustomTimer, setUseCustomTimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wolfCap = maxWolvesForPlayers(maxPlayers);
  const effectiveTimer = useCustomTimer ? Math.max(15, Math.min(3600, Number(customTimer) || 0)) : timerSeconds;

  function handleCreate() {
    setSubmitting(true);
    setError(null);
    const socket = getSocket();

    const onAck = (payload: JoinAckPayload) => {
      cleanup();
      saveSession(payload);
      router.push(`/game/${payload.gameCode}`);
    };
    const onError = (payload: ErrorPayload) => {
      cleanup();
      setSubmitting(false);
      setError(payload.message);
    };
    function cleanup() {
      socket.off(ServerEvents.JoinAck, onAck);
      socket.off(ServerEvents.Error, onError);
    }

    socket.on(ServerEvents.JoinAck, onAck);
    socket.on(ServerEvents.Error, onError);
    socket.emit(ClientEvents.CreateGame, {
      hostName,
      maxPlayers,
      wolfCount,
      roundTimerSeconds: effectiveTimer,
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pb-10 pt-8">
      <h1 className="text-center text-3xl font-black tracking-tight">Host a Game</h1>

      <Panel className="flex flex-col gap-5 p-6">
        <div>
          <SectionLabel>Your Name</SectionLabel>
          <TextInput
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Leave blank for a random name"
            maxLength={24}
          />
        </div>

        <div>
          <SectionLabel>How many people are playing?</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <StepperButton onClick={() => setMaxPlayers((n) => Math.max(MIN_PLAYERS, n - 1))}>−</StepperButton>
            <span className="text-3xl font-black tabular-nums">{maxPlayers}</span>
            <StepperButton onClick={() => setMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}>+</StepperButton>
          </div>
        </div>

        <div>
          <SectionLabel>How many wolves?</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <StepperButton onClick={() => setWolfCount((n) => Math.max(1, n - 1))}>−</StepperButton>
            <span className="text-3xl font-black tabular-nums">{wolfCount}</span>
            <StepperButton onClick={() => setWolfCount((n) => Math.min(wolfCap, n + 1))}>+</StepperButton>
          </div>
          <p className="mt-1 text-center text-xs text-muted">Max {wolfCap} wolves for {maxPlayers} players</p>
        </div>

        <div>
          <SectionLabel>Discussion Timer</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {TIMER_PRESETS_SECONDS.map((secs) => (
              <button
                key={secs}
                onClick={() => {
                  setUseCustomTimer(false);
                  setTimerSeconds(secs);
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  !useCustomTimer && timerSeconds === secs
                    ? 'border-accent bg-accent/20 text-foreground'
                    : 'border-panel-border bg-black/20 text-muted'
                }`}
              >
                {TIMER_LABELS[secs]}
              </button>
            ))}
            <button
              onClick={() => setUseCustomTimer(true)}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                useCustomTimer ? 'border-accent bg-accent/20 text-foreground' : 'border-panel-border bg-black/20 text-muted'
              }`}
            >
              Custom
            </button>
          </div>
          {useCustomTimer && (
            <div className="mt-2">
              <TextInput
                type="number"
                min={15}
                max={3600}
                placeholder="Seconds"
                value={customTimer}
                onChange={(e) => setCustomTimer(e.target.value)}
              />
            </div>
          )}
        </div>
      </Panel>

      {(wolfCount > wolfCap || (useCustomTimer && (!customTimer || Number(customTimer) < 15))) && (
        <p className="text-center text-sm text-wolf">Adjust your settings above before creating the game.</p>
      )}
      {error && <p className="text-center text-sm text-wolf">{error}</p>}

      <BigButton onClick={handleCreate} disabled={submitting || wolfCount > wolfCap}>
        {submitting ? 'Creating…' : 'Create Game'}
      </BigButton>
    </main>
  );
}

function StepperButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-panel-border bg-white/5 text-2xl font-bold active:scale-95"
    >
      {children}
    </button>
  );
}
