'use client';

import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoice } from '@/lib/VoiceContext';
import { useLanguage } from '@/lib/i18n';

export function VoiceChatBar() {
  const { status, muted, errorMessage, available, audioBlocked, join, leave, toggleMute, enableAudio } = useVoice();
  const { t } = useLanguage();

  if (!available) return null;

  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={join}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-panel-border bg-white/5 px-4 py-2.5 text-sm font-bold active:scale-[0.99]"
        >
          <Mic className="h-4 w-4" strokeWidth={2} />
          {t.voice.join}
        </button>
        {status === 'error' && errorMessage && <p className="text-center text-xs text-wolf">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Fixed top-center: the button players reach for constantly, kept
          reachable regardless of scroll position instead of buried in the
          voice bar below. */}
      <button
        onClick={toggleMute}
        disabled={status !== 'connected'}
        aria-label={muted ? t.voice.unmute : t.voice.mute}
        className={`fixed left-1/2 top-4 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition active:scale-95 disabled:opacity-40 ${
          muted ? 'border-wolf/40 bg-wolf/20 text-wolf' : 'border-panel-border bg-panel/80 text-foreground'
        }`}
      >
        {muted ? <MicOff className="h-5 w-5" strokeWidth={2} /> : <Mic className="h-5 w-5" strokeWidth={2} />}
      </button>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-panel-border bg-white/5 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold">
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'connecting' ? 'bg-yellow-500' : muted ? 'bg-muted' : 'bg-accent-2 animate-pulse'
            }`}
          />
          {status === 'connecting' ? t.voice.connecting : muted ? t.voice.muted : t.voice.live}
        </span>
        <button onClick={leave} className="text-sm font-bold text-wolf underline underline-offset-4">
          {t.voice.leave}
        </button>
      </div>
      {status === 'connected' && audioBlocked && (
        <button
          onClick={enableAudio}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300 active:scale-[0.99]"
        >
          <Volume2 className="h-4 w-4" strokeWidth={2} />
          {t.voice.audioBlocked}
        </button>
      )}
    </div>
  );
}
