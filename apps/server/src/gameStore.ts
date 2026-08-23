import crypto from 'crypto';
import { Game } from '@sw/shared';

// The server process is the single source of truth. Games live in memory for
// the lifetime of the process; a physical in-room party game is expected to
// run start-to-finish against one running server instance. Clients don't hold
// a persistent connection -- they poll with a bearer-style playerToken, so
// there's no per-connection state to track here beyond the games and tokens
// themselves.

interface TokenEntry {
  gameCode: string;
  playerId: string;
}

class GameStore {
  private games = new Map<string, Game>();
  private tokens = new Map<string, TokenEntry>();

  createToken(gameCode: string, playerId: string): string {
    const token = crypto.randomBytes(24).toString('hex');
    this.tokens.set(token, { gameCode, playerId });
    return token;
  }

  resolveToken(token: string): TokenEntry | undefined {
    return this.tokens.get(token);
  }

  get(gameCode: string): Game | undefined {
    return this.games.get(gameCode);
  }

  set(game: Game): void {
    this.games.set(game.gameCode, game);
  }

  delete(gameCode: string): void {
    this.games.delete(gameCode);
    for (const [token, entry] of this.tokens.entries()) {
      if (entry.gameCode === gameCode) this.tokens.delete(token);
    }
  }

  has(gameCode: string): boolean {
    return this.games.has(gameCode);
  }
}

export const gameStore = new GameStore();
