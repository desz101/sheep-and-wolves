// Ported verbatim from packages/shared/src/gameLogic.ts.

import { Role, Winner } from './types.ts';
import { GAME_CODE_ALPHABET, GAME_CODE_LENGTH, QUESTION_DECK } from './constants.ts';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    code += GAME_CODE_ALPHABET[Math.floor(Math.random() * GAME_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeGameCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function assignRoles(playerIds: string[], wolfCount: number): Record<string, Role> {
  const shuffled = shuffle(playerIds);
  const wolves = new Set(shuffled.slice(0, wolfCount));
  const roles: Record<string, Role> = {};
  for (const id of playerIds) {
    roles[id] = wolves.has(id) ? 'wolf' : 'sheep';
  }
  return roles;
}

export function freshQuestionDeck(): string[] {
  return shuffle(QUESTION_DECK);
}

export function drawQuestion(
  deck: string[],
  lastQuestion: string | null
): { question: string; remainingDeck: string[] } {
  let workingDeck = deck;
  if (workingDeck.length === 0) {
    workingDeck = freshQuestionDeck();
    if (workingDeck[0] === lastQuestion && workingDeck.length > 1) {
      [workingDeck[0], workingDeck[1]] = [workingDeck[1], workingDeck[0]];
    }
  }
  const [question, ...rest] = workingDeck;
  return { question, remainingDeck: rest };
}

export interface TallyResult {
  tally: { playerId: string; count: number }[];
  maxVotes: number;
  leaders: string[];
}

export function tallyVotes(votes: Record<string, string>, eligiblePlayerIds: string[]): TallyResult {
  const counts = new Map<string, number>();
  for (const id of eligiblePlayerIds) counts.set(id, 0);
  for (const targetId of Object.values(votes)) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }
  const tally = Array.from(counts.entries()).map(([playerId, count]) => ({ playerId, count }));
  const maxVotes = tally.reduce((m, t) => Math.max(m, t.count), 0);
  const leaders = maxVotes > 0 ? tally.filter((t) => t.count === maxVotes).map((t) => t.playerId) : [];
  return { tally, maxVotes, leaders };
}

export function checkWinner(aliveSheep: number, aliveWolves: number): Winner | null {
  if (aliveWolves === 0) {
    return { team: 'sheep', reason: 'All of the wolves have been eliminated.' };
  }
  if (aliveSheep === 1 && aliveWolves === 1) {
    return { team: 'wolf', reason: "It's down to one sheep and one wolf -- the wolf wins the standoff." };
  }
  if (aliveWolves > aliveSheep) {
    return { team: 'wolf', reason: 'The wolves now outnumber the sheep.' };
  }
  return null;
}

export function validateGameConfig(maxPlayers: number, wolfCount: number, roundTimerSeconds: number): string | null {
  if (!Number.isInteger(maxPlayers) || maxPlayers < 3 || maxPlayers > 30) {
    return 'Player count must be between 3 and 30.';
  }
  if (!Number.isInteger(wolfCount) || wolfCount < 1) {
    return 'There must be at least 1 wolf.';
  }
  if (wolfCount >= maxPlayers - wolfCount) {
    return 'Wolves must start outnumbered by sheep.';
  }
  if (!Number.isInteger(roundTimerSeconds) || roundTimerSeconds < 15 || roundTimerSeconds > 3600) {
    return 'Round timer must be between 15 seconds and 60 minutes.';
  }
  return null;
}
