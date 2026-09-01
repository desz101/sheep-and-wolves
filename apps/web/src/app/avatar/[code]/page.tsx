'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AVATAR_KEYS } from '@sw/shared';
import * as api from '@/lib/api';
import { loadSession } from '@/lib/session';
import { avatarSrc } from '@/lib/avatars';
import { useLanguage } from '@/lib/i18n';

export default function AvatarPickerPage() {
  const params = useParams<{ code: string }>();
  const code = (Array.isArray(params.code) ? params.code[0] : params.code)?.toUpperCase() ?? '';
  const router = useRouter();
  const { t } = useLanguage();

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const toGame = useCallback(() => router.replace(`/game/${code}`), [router, code]);

  // Seed the carousel from the player's current (server-assigned) avatar, and
  // bail out early if there's no session or the game already started.
  useEffect(() => {
    const session = loadSession(code);
    if (!session) {
      router.replace(`/join?code=${code}`);
      return;
    }
    let cancelled = false;
    api
      .fetchState(code, session.playerId, session.playerToken)
      .then(({ body }) => {
        if (cancelled) return;
        if (body.status !== 'LOBBY') {
          toGame();
          return;
        }
        const me = body.players.find((p) => p.isSelf);
        const at = me ? (AVATAR_KEYS as readonly string[]).indexOf(me.avatar) : -1;
        setIndex(at >= 0 ? at : Math.floor(Math.random() * AVATAR_KEYS.length));
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIndex(Math.floor(Math.random() * AVATAR_KEYS.length));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, router, toGame]);

  const move = useCallback((delta: number) => {
    setIndex((i) => (i + delta + AVATAR_KEYS.length) % AVATAR_KEYS.length);
  }, []);

  const choose = useCallback(async () => {
    const session = loadSession(code);
    if (!session) {
      router.replace(`/join?code=${code}`);
      return;
    }
    setSaving(true);
    try {
      await api.setAvatar(code, session.playerId, session.playerToken, AVATAR_KEYS[index]);
    } catch {
      // A failed save just means they keep the random one the server gave them.
    }
    toGame();
  }, [code, index, router, toGame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'Enter') choose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, choose]);

  const key = AVATAR_KEYS[index];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 pb-10 pt-6">
      <div className="flex justify-end">
        <button
          onClick={toGame}
          className="px-2 py-1 text-lg font-semibold text-muted underline underline-offset-4 transition hover:text-foreground"
        >
          {t.avatarPicker.skip}
        </button>
      </div>

      <h1 className="mt-8 text-center text-3xl font-black tracking-tight">{t.avatarPicker.title}</h1>

      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div className="flex w-full items-center justify-center gap-1">
          <button
            aria-label={t.avatarPicker.prev}
            onClick={() => move(-1)}
            className="flex h-14 w-12 shrink-0 items-center justify-center text-4xl font-light text-muted transition hover:text-foreground active:scale-90"
          >
            ‹
          </button>

          <button
            onClick={choose}
            disabled={!ready || saving}
            aria-label={t.avatarPicker.choose}
            className="relative aspect-square w-56 max-w-[68vw] shrink-0 overflow-hidden rounded-full border border-panel-border bg-panel shadow-xl shadow-black/40 transition active:scale-[0.97] disabled:opacity-60"
          >
            {ready && (
              <img
                key={key}
                src={avatarSrc(key)}
                alt=""
                className="h-full w-full animate-fade-up object-cover"
                draggable={false}
              />
            )}
          </button>

          <button
            aria-label={t.avatarPicker.next}
            onClick={() => move(1)}
            className="flex h-14 w-12 shrink-0 items-center justify-center text-4xl font-light text-muted transition hover:text-foreground active:scale-90"
          >
            ›
          </button>
        </div>

        <p className="text-sm text-muted">{saving ? t.avatarPicker.saving : t.avatarPicker.tapToChoose}</p>

        <div className="flex max-w-[16rem] flex-wrap justify-center gap-1.5">
          {AVATAR_KEYS.map((k, i) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-accent' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
