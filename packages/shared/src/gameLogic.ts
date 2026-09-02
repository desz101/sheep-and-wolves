import { Role, Winner } from './types';
import { GAME_CODE_ALPHABET, GAME_CODE_LENGTH, QUESTION_DECK } from './constants';

/** Fisher-Yates shuffle, returns a new array. */
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

/** Assigns roles to a list of player ids. Returns a map of id -> role. */
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

/**
 * Draws the next question. If the deck is empty, reshuffles a fresh deck
 * (excluding the question that was just used, when possible, to avoid an
 * immediate repeat) so questions don't repeat until the whole set is used.
 */
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

/**
 * Draws `count` distinct questions for the question-asker to choose between.
 * Refills from a fresh shuffled deck when it runs low, and keeps the
 * just-asked question off the menu when there are still enough others.
 */
export function drawQuestions(
  deck: string[],
  lastQuestion: string | null,
  count: number
): { questions: string[]; remainingDeck: string[] } {
  let workingDeck = deck.slice();
  if (workingDeck.length < count) {
    const refill = freshQuestionDeck().filter((q) => !workingDeck.includes(q));
    workingDeck = workingDeck.concat(refill);
  }
  const withoutLast = workingDeck.filter((q) => q !== lastQuestion);
  const pool = withoutLast.length >= count ? withoutLast : workingDeck;
  const questions = pool.slice(0, count);
  const remainingDeck = workingDeck.filter((q) => !questions.includes(q));
  return { questions, remainingDeck };
}

export interface TallyResult {
  tally: { playerId: string; count: number }[];
  maxVotes: number;
  leaders: string[]; // playerIds tied for the most votes
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

/**
 * Checks win conditions given remaining alive counts by role.
 * Sheep win when wolves === 0. Wolves win when wolves > sheep.
 *
 * Special case: 1 sheep vs 1 wolf is also a wolf win, not a continuation.
 * With exactly two players left, each one's only legal vote target is the
 * other, so a normal vote is a guaranteed 1-1 tie every time -- the
 * tiebreaker would just re-run the same forced tie forever. Rather than let
 * the game hang, the standoff resolves in the wolves' favor immediately.
 */
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
