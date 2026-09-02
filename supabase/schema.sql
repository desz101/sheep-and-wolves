-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- for the project at https://frdjrmowinwbhglatufa.supabase.co. (create table ...
-- if not exists, so re-running it is harmless if you already ran an earlier
-- version of this file.)
--
-- The whole Game object is stored as a single jsonb blob per row -- the "api"
-- Edge Function (supabase/functions/api, via supabase/functions/_shared/gameStore.ts)
-- is the only thing that reads or writes these tables, and still owns all
-- authorization exactly as the old in-memory Map / Express server did.

create table if not exists games (
  game_code text primary key,
  state jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- `version` backs optimistic concurrency control (see gameStore.ts's
-- getWithVersion/setIfVersion): every write is a conditional
-- `UPDATE ... WHERE version = $expected`, so a write based on state that's
-- gone stale (another request updated the row first) fails instead of
-- silently overwriting the newer write. This matters here specifically
-- because *every* poll (every open tab, every ~1.5s) does a full
-- read-modify-write of the same row via touchPlayer, so without a version
-- check, concurrent requests routinely clobber each other's changes --
-- e.g. a player join getting silently erased by an unrelated poll's write
-- landing right after it.
alter table games add column if not exists version integer not null default 1;

create table if not exists tokens (
  token text primary key,
  game_code text not null references games(game_code) on delete cascade,
  player_id text not null
);

create index if not exists tokens_game_code_idx on tokens(game_code);

-- RLS is enabled with NO policies added on purpose: the anon/publishable key
-- (the one safe to ship in a browser) gets zero access to these tables. Only
-- the service_role key -- a server-only secret that bypasses RLS entirely --
-- can read or write them. That's what keeps this equivalent to the old
-- in-memory model, where only the Express process could ever see game state;
-- without this, anyone holding the publishable key could call the Supabase
-- REST API directly and read/mutate any game, bypassing every check in
-- engine.ts (host-only actions, vote validation, hidden roles, etc).
alter table games enable row level security;
alter table tokens enable row level security;

-- ---------------------------------------------------------------------------
-- Retention purge (recommended — the privacy policy at /privacy promises game
-- records, including the host IP/user-agent stored in games.state, are deleted
-- "on a rolling basis"). Nothing in the app deletes game rows, so without this
-- they — and the IPs in them — accumulate forever.
--
-- Run once in the SQL editor to enable a nightly cleanup. Deleting a games row
-- cascades to its tokens. Tune the intervals to your needs.
--
--   create extension if not exists pg_cron;
--
--   create or replace function purge_stale_games() returns void language sql as $$
--     delete from games
--     where updated_at < now() - interval '30 days'
--        or (state->>'status' in ('GAME_OVER', 'CANCELLED')
--            and updated_at < now() - interval '2 days');
--   $$;
--
--   select cron.schedule('purge-stale-games', '17 4 * * *', 'select purge_stale_games()');
-- ---------------------------------------------------------------------------
