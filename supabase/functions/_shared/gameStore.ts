import { createClient } from 'npm:@supabase/supabase-js@2';
import { randomHex } from './util.ts';
import type { Game } from './types.ts';

// Same role this module played in apps/server/src/gameStore.ts: the ONLY thing
// that talks to Postgres. engine.ts doesn't know or care that it's now running
// inside an Edge Function instead of a long-lived Express process.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are NOT secrets you need to set --
// Supabase injects both into every Edge Function's environment automatically.
// The service_role key deliberately bypasses Row Level Security, which is safe
// here because this function is the sole, trusted gatekeeper for every
// read/write (same trust boundary the old in-memory Map had implicitly). See
// supabase/schema.sql for the corresponding RLS setup (enabled, no policies --
// so the publishable/anon key a browser might hold has zero access).

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing. Supabase sets both automatically for every ' +
      'Edge Function, so seeing this means something is unusually wrong with the project/runtime.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface TokenEntry {
  gameCode: string;
  playerId: string;
}

interface GameRow {
  state: Game;
  version: number;
}

interface TokenRow {
  game_code: string;
  player_id: string;
}

class GameStore {
  async createToken(gameCode: string, playerId: string): Promise<string> {
    const token = randomHex(24);
    const { error } = await supabase.from('tokens').insert({ token, game_code: gameCode, player_id: playerId });
    if (error) throw error;
    return token;
  }

  async resolveToken(token: string): Promise<TokenEntry | undefined> {
    const { data, error } = await supabase
      .from('tokens')
      .select('game_code, player_id')
      .eq('token', token)
      .maybeSingle<TokenRow>();
    if (error) throw error;
    if (!data) return undefined;
    return { gameCode: data.game_code, playerId: data.player_id };
  }

  /**
   * Fetches a game together with the row version it was read at. Pair with
   * `setIfVersion` for any read-modify-write -- see `withGame` in engine.ts,
   * which is the only caller and handles the retry-on-conflict loop.
   */
  async getWithVersion(gameCode: string): Promise<GameRow | undefined> {
    const { data, error } = await supabase
      .from('games')
      .select('state, version')
      .eq('game_code', gameCode)
      .maybeSingle<GameRow>();
    if (error) throw error;
    return data ?? undefined;
  }

  /**
   * Writes `game` only if the row's version still matches `expectedVersion`
   * (i.e. nothing else wrote to this game since it was read), bumping the
   * version on success. Returns false on a conflict -- the caller re-reads
   * and retries rather than blindly overwriting a newer write.
   */
  async setIfVersion(game: Game, expectedVersion: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('games')
      .update({ state: game, version: expectedVersion + 1, updated_at: new Date().toISOString() })
      .eq('game_code', game.gameCode)
      .eq('version', expectedVersion)
      .select('game_code');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  /** Unconditional insert -- only safe for creating a brand-new game row (see createGame). */
  async insert(game: Game): Promise<void> {
    const { error } = await supabase.from('games').insert({ game_code: game.gameCode, state: game, version: 1 });
    if (error) throw error;
  }

  async has(gameCode: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('games')
      .select('game_code', { count: 'exact', head: true })
      .eq('game_code', gameCode);
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}

export const gameStore = new GameStore();
