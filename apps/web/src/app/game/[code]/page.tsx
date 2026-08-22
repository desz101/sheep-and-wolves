'use client';

import { useParams } from 'next/navigation';
import { GameProvider } from '@/lib/GameContext';
import { GameScreen } from '@/components/GameScreen';

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const gameCode = (Array.isArray(params.code) ? params.code[0] : params.code)?.toUpperCase() ?? '';

  return (
    <GameProvider gameCode={gameCode}>
      <GameScreen />
    </GameProvider>
  );
}
