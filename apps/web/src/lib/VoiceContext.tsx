'use client';

import { createContext, useContext } from 'react';
import { useVoiceChat, VoiceChatState } from './voice';

const VoiceContext = createContext<VoiceChatState | null>(null);

// One voice session per game page, shared between the mic control (VoiceChatBar)
// and anything that wants to know who's currently speaking (PlayerList) --
// without this they'd each open their own LiveKit connection.
export function VoiceProvider({ gameCode, children }: { gameCode: string; children: React.ReactNode }) {
  const voice = useVoiceChat(gameCode);
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceChatState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
