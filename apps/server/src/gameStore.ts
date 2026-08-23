import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Game } from '@sw/shared';

// Game state now lives in Supabase Postgres instead of an in-memory Map, so it
// survives a server restart -- but the shape of this module (get/set/has/delete,
// createToken/resolveToken) is unchanged, and it's still the ONLY thing that
// talks to the database. engine.ts and index.ts don't know or care that the
// backing store changed.
//
// Uses the service_role key deliberately: this key bypasses Row Level Security,
// which is fine (and required) here because the Express server is the sole,
// trusted gatekeeper for every read/write -- the same trust boundary the old
// in-memory Map had implicitly. It must never be sent to a browser. See
// supabase/schema.sql for the corresponding RLS setup.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see apps/server/.env.example).');
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
}

interface TokenRow {
  game_code: string;
  player_id: string;
}

class GameStore {
  async createToken(gameCode: string, playerId: string): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex');
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

  async get(gameCode: string): Promise<Game | undefined> {
    const { data, error } = await supabase
      .from('games')
      .select('state')
      .eq('game_code', gameCode)
      .maybeSingle<GameRow>();
    if (error) throw error;
    return data?.state;
  }

  async set(game: Game): Promise<void> {
    const { error } = await supabase
      .from('games')
      .upsert({ game_code: game.gameCode, state: game, updated_at: new Date().toISOString() });
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

  async delete(gameCode: string): Promise<void> {
    const { error: tokenError } = await supabase.from('tokens').delete().eq('game_code', gameCode);
    if (tokenError) throw tokenError;
    const { error: gameError } = await supabase.from('games').delete().eq('game_code', gameCode);
    if (gameError) throw gameError;
  }
}

export const gameStore = new GameStore();
