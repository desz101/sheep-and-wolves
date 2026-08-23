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
  updated_at timestamptz not null default now()
);

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
