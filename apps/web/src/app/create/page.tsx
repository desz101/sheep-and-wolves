'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_PLAYERS, MIN_PLAYERS, TIMER_PRESETS_SECONDS, maxWolvesForPlayers } from '@sw/shared';
import { ApiError, createGame } from '@/lib/api';
import { saveSession } from '@/lib/session';
import { BigButton, Panel, SectionLabel, TextInput } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

export default function CreatePage() {
  const router = useRouter();
  const { t } = useLanguage();
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

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    try {
      const { body } = await createGame({ hostName, maxPlayers, wolfCount, roundTimerSeconds: effectiveTimer });
      saveSession(body);
      router.push(`/avatar/${body.gameCode}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pb-10 pt-8">
      <h1 className="text-center text-3xl font-black tracking-tight">{t.create.pageTitle}</h1>

      <Panel className="flex flex-col gap-5 p-6">
        <div>
          <SectionLabel>{t.create.yourName}</SectionLabel>
          <TextInput
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder={t.create.namePlaceholder}
            maxLength={24}
          />
        </div>

        <div>
          <SectionLabel>{t.create.howManyPlaying}</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <StepperButton onClick={() => setMaxPlayers((n) => Math.max(MIN_PLAYERS, n - 1))}>−</StepperButton>
            <span className="text-3xl font-black tabular-nums">{maxPlayers}</span>
            <StepperButton onClick={() => setMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}>+</StepperButton>
          </div>
        </div>

        <div>
          <SectionLabel>{t.create.howManyWolves}</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <StepperButton onClick={() => setWolfCount((n) => Math.max(1, n - 1))}>−</StepperButton>
            <span className="text-3xl font-black tabular-nums">{wolfCount}</span>
            <StepperButton onClick={() => setWolfCount((n) => Math.min(wolfCap, n + 1))}>+</StepperButton>
          </div>
          <p className="mt-1 text-center text-xs text-muted">{t.create.maxWolves(wolfCap, maxPlayers)}</p>
        </div>

        <div>
          <SectionLabel>{t.create.discussionTimer}</SectionLabel>
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
                {t.create.timerLabels[secs]}
              </button>
            ))}
            <button
              onClick={() => setUseCustomTimer(true)}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                useCustomTimer ? 'border-accent bg-accent/20 text-foreground' : 'border-panel-border bg-black/20 text-muted'
              }`}
            >
              {t.create.custom}
            </button>
          </div>
          {useCustomTimer && (
            <div className="mt-2">
              <TextInput
                type="number"
                min={15}
                max={3600}
                placeholder={t.create.secondsPlaceholder}
                value={customTimer}
                onChange={(e) => setCustomTimer(e.target.value)}
              />
            </div>
          )}
        </div>
      </Panel>

      {(wolfCount > wolfCap || (useCustomTimer && (!customTimer || Number(customTimer) < 15))) && (
        <p className="text-center text-sm text-wolf">{t.create.adjustSettings}</p>
      )}
      {error && <p className="text-center text-sm text-wolf">{error}</p>}

      <BigButton onClick={handleCreate} disabled={submitting || wolfCount > wolfCap}>
        {submitting ? t.create.creating : t.create.createGame}
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
