# Deployment

This app has two pieces, both serverless — nothing to keep running 24/7:

- **`apps/web`** (Next.js frontend) → **AWS Amplify Hosting**
- **`supabase/functions/api`** (the game API) → **Supabase Edge Functions**, backed by
  **Supabase Postgres** for game state

There used to be a third piece — a persistent Node/Express process (`apps/server`) — but
it's gone: the game logic no longer relies on in-memory `setTimeout`s (round timers are
now resolved lazily, on the next request that touches a game — see `supabase/functions/_shared/engine.ts`),
so every request is self-contained and can run as a short-lived function instead of a
long-running server.

## 1. Database — Supabase Postgres

1. In the Supabase SQL editor for your project, run `supabase/schema.sql` once. It creates
   two tables (`games`, `tokens`) with Row Level Security enabled and **no policies** — so
   the publishable/anon key has zero access to them. Only the `service_role` key (which
   Supabase injects into every Edge Function automatically, see below) can read or write.
   This is deliberate: without it, anyone holding the publishable key could call Supabase's
   REST API directly and bypass every check in `engine.ts` (host-only actions, vote
   validation, hidden roles).

## 2. Game API — Supabase Edge Functions

1. Install the Supabase CLI and log in:
   ```bash
   npm install -g supabase
   supabase login
   ```
2. From the repo root, link this project to your Supabase project:
   ```bash
   supabase link --project-ref frdjrmowinwbhglatufa
   ```
3. Set the one secret the function needs beyond what Supabase already injects
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatic for every Edge Function —
   don't set those yourself):
   ```bash
   supabase secrets set CLIENT_ORIGIN=https://sheepandwolves.app
   ```
4. Deploy:
   ```bash
   supabase functions deploy api
   ```
   This gives you a stable URL: `https://frdjrmowinwbhglatufa.supabase.co/functions/v1/api`.
5. Re-run `supabase functions deploy api` whenever `supabase/functions/` changes — there's
   no auto-deploy-on-push unless you wire up a CI pipeline (e.g. a GitHub Action) for it.

## 3. Frontend — AWS Amplify Hosting

`amplify.yml` at the repo root already configures the npm-workspaces monorepo build.
In the Amplify Console:

1. **New app → Host web app** → connect the `sheep-and-wolves` GitHub repo, branch `main`.
2. Check **"My app is a monorepo"** and enter `apps/web` as the app root. (This must match
   the `appRoot` in `amplify.yml` — Amplify sets the `AMPLIFY_MONOREPO_APP_ROOT` env var
   for you when you fill this in here.)
3. Amplify should auto-detect the Next.js SSR compute platform (`WEB_COMPUTE`) since the
   app has a dynamic route (`/game/[code]`). Leave build settings as detected — `amplify.yml`
   takes precedence over anything in the console anyway.
4. Add an environment variable:
   - `NEXT_PUBLIC_SERVER_URL` → `https://frdjrmowinwbhglatufa.supabase.co/functions/v1/api`
     (the Edge Function URL from step 2 above). Trigger a **new build** after setting this,
     not just a redeploy — `NEXT_PUBLIC_*` values are baked into the JS bundle at build
     time, so an existing build won't pick up a change to this variable.
5. Add your custom domain (`sheepandwolves.app`) under **Hosting → Custom domains**, and
   make sure `CLIENT_ORIGIN` (step 2.3 above) matches it — a mismatch here shows up as CORS
   errors in the browser console, not a clear error message.

## 4. After both are live

- Confirm the frontend's `NEXT_PUBLIC_SERVER_URL` points at the real Edge Function URL, not
  the `http://localhost:54321/...` local dev default (see below) — pointing at "localhost"
  from a deployed page means the *visitor's own machine*, not any server you control, which
  fails as a CORS/network error in the browser console rather than a clear message.
- Open the site on a phone, host a game, and confirm players on other devices can join —
  this exercises the full create → join → play path end to end.

## Local development

- `npm run dev` — runs `packages/shared`'s watcher and the Next.js dev server. It talks to
  whatever `NEXT_PUBLIC_SERVER_URL` in `apps/web/.env.local` points at, defaulting to
  `http://localhost:54321/functions/v1/api` (the Supabase CLI's local API gateway) if unset.
- `npm run dev:functions` (`supabase functions serve`) — runs the Edge Functions locally
  via the Supabase CLI. Needs Docker running, and either `supabase start` (a full local
  Supabase stack) or `--env-file` pointed at your remote project's credentials if you'd
  rather develop against real data.
