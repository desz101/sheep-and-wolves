'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, joinGame } from '@/lib/api';
import { saveSession } from '@/lib/session';
import { BigButton, Panel, SectionLabel, TextInput } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [gameCode, setGameCode] = useState(searchParams.get('code')?.toUpperCase() ?? '');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!gameCode.trim()) {
      setError(t.join.enterCode);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { body } = await joinGame(gameCode, name);
      saveSession(body);
      router.push(`/avatar/${body.gameCode}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-4 pb-10">
      <h1 className="text-center text-3xl font-black tracking-tight">{t.join.pageTitle}</h1>

      <Panel className="flex flex-col gap-5 p-6">
        <div>
          <SectionLabel>{t.join.gameCode}</SectionLabel>
          <TextInput
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="SHEEP4827"
            maxLength={8}
            autoCapitalize="characters"
            className="text-center text-2xl font-black tracking-[0.2em]"
          />
        </div>
        <div>
          <SectionLabel>{t.join.yourName}</SectionLabel>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.join.namePlaceholder}
            maxLength={24}
          />
        </div>
      </Panel>

      {error && <p className="text-center text-sm text-wolf">{error}</p>}

      <BigButton onClick={handleJoin} disabled={submitting}>
        {submitting ? t.join.joining : t.join.joinGame}
      </BigButton>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
