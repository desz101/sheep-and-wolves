'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientEvents, ErrorPayload, JoinAckPayload, ServerEvents } from '@sw/shared';
import { getSocket } from '@/lib/socket';
import { saveSession } from '@/lib/session';
import { BigButton, Panel, SectionLabel, TextInput } from '@/components/ui';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameCode, setGameCode] = useState(searchParams.get('code')?.toUpperCase() ?? '');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    if (!gameCode.trim()) {
      setError('Enter a game code.');
      return;
    }
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
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
    socket.emit(ClientEvents.JoinGame, { gameCode, name });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-4 pb-10">
      <h1 className="text-center text-3xl font-black tracking-tight">Join a Game</h1>

      <Panel className="flex flex-col gap-5 p-6">
        <div>
          <SectionLabel>Game Code</SectionLabel>
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
          <SectionLabel>Your Name</SectionLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Desz" maxLength={24} />
        </div>
      </Panel>

      {error && <p className="text-center text-sm text-wolf">{error}</p>}

      <BigButton onClick={handleJoin} disabled={submitting}>
        {submitting ? 'Joining…' : 'Join Game'}
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
