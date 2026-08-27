'use client';

import { useVoice } from '@/lib/VoiceContext';
import { useLanguage } from '@/lib/i18n';

export function VoiceChatBar() {
  const { status, muted, errorMessage, available, join, leave, toggleMute } = useVoice();
  const { t } = useLanguage();

  if (!available) return null;

  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={join}
          className="w-full rounded-xl border border-panel-border bg-white/5 px-4 py-2.5 text-sm font-bold active:scale-[0.99]"
        >
          🎙️ {t.voice.join}
        </button>
        {status === 'error' && errorMessage && <p className="text-center text-xs text-wolf">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-panel-border bg-white/5 px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm font-bold">
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'connecting' ? 'bg-yellow-500' : muted ? 'bg-muted' : 'bg-accent-2 animate-pulse'
          }`}
        />
        {status === 'connecting' ? t.voice.connecting : muted ? t.voice.muted : t.voice.live}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          disabled={status !== 'connected'}
          className="text-sm font-bold underline underline-offset-4 disabled:opacity-40"
        >
          {muted ? t.voice.unmute : t.voice.mute}
        </button>
        <button onClick={leave} className="text-sm font-bold text-wolf underline underline-offset-4">
          {t.voice.leave}
        </button>
      </div>
    </div>
  );
}
