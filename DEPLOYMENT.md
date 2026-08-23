# Deployment

This app has two independently deployed pieces:

- **`apps/web`** (Next.js frontend) → **AWS Amplify Hosting**
- **`apps/server`** (Socket.IO game server) → **a separate AWS compute service**

They're split because Amplify Hosting's compute model is per-request (Lambda-backed),
while the game server needs a **persistent, always-running Node process**: it holds
game state in memory and manages `setTimeout`-based round timers per game. A
Lambda-style invocation model can't do that.

## 1. Frontend — AWS Amplify Hosting

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
   - `NEXT_PUBLIC_SERVER_URL` → the game server's URL from step 2 below (an ECS Express
     Mode service URL). You'll need to deploy the server first to know this value, then
     come back and set it, then trigger a **new build** of the frontend (not just a
     redeploy — this value is baked into the JS bundle at build time).
5. Add your custom domain (`sheepandwolves.app`) under **Hosting → Custom domains**.

## 2. Game server — Amazon ECS Express Mode

AWS App Runner stopped accepting new customers on April 30, 2026. AWS's official
successor is **ECS Express Mode** (launched re:Invent 2025) — same idea as App Runner
(persistent Fargate container, auto HTTPS via an Application Load Balancer, which
natively supports WebSockets), but it's part of ECS instead of a standalone product, so
it's not going anywhere.

The one real difference: **Express Mode deploys from a pre-built image in Amazon ECR, not
directly from a GitHub repo.** `apps/server/Dockerfile` is already validated (builds and
runs correctly — confirmed locally with `docker build` + `docker run` + a `/health` check).

### Push the image to ECR

Run these from your own terminal (needs AWS CLI configured with your credentials and
Docker running):

```bash
# One-time: create the ECR repository
aws ecr create-repository --repository-name sheep-and-wolves-server --region <your-region>

# Get your account ID and log Docker in to ECR
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.<your-region>.amazonaws.com

# Build (from the repo root -- context matters, see apps/server/Dockerfile)
docker build -f apps/server/Dockerfile -t sheep-and-wolves-server .

# Tag and push
docker tag sheep-and-wolves-server:latest $ACCOUNT_ID.dkr.ecr.<your-region>.amazonaws.com/sheep-and-wolves-server:latest
docker push $ACCOUNT_ID.dkr.ecr.<your-region>.amazonaws.com/sheep-and-wolves-server:latest
```

Replace `<your-region>` with the AWS region you want to deploy in (e.g. `us-east-1`).

Repeat the `build` / `tag` / `push` steps whenever `apps/server` or `packages/shared`
changes — there's no auto-redeploy-on-push the way App Runner or Amplify have, unless you
later wire up a CI pipeline (e.g. a GitHub Action) to do this automatically.

### Create the Express Mode service

1. **ECS Console → Express mode → Create service**
2. **Image**: paste the ECR image URI from the push above
   (`<account-id>.dkr.ecr.<region>.amazonaws.com/sheep-and-wolves-server:latest`)
3. **Container port**: `4000`
4. **Health check path**: `/health` (already implemented in `apps/server/src/index.ts`)
5. **Environment variables**:
   - `CLIENT_ORIGIN` → your Amplify app's URL (e.g. `https://sheepandwolves.app`) — this
     locks down Socket.IO's CORS to only your frontend instead of `*`.
6. Deploy. Express Mode gives you a public HTTPS URL when it's done.
7. Copy that URL and go back to step 1.4 above to wire it into the frontend's
   `NEXT_PUBLIC_SERVER_URL`, then trigger a new build of the Amplify app (not just a
   redeploy — `NEXT_PUBLIC_*` values are baked in at build time).

**Alternatives**, if you'd rather not deal with ECR: Lightsail Containers (simpler, still
takes a Dockerfile-built image, cheaper for small hobby-scale traffic) or EC2 with a plain
`docker run`. Both work with the same `apps/server/Dockerfile`.

## 3. After both are live

- Confirm the frontend's `NEXT_PUBLIC_SERVER_URL` points at the server's real URL (not
  `localhost:4000`, which is only the local dev default in `apps/web/.env.local`).
- Confirm the server's `CLIENT_ORIGIN` matches the frontend's real domain, not `*`.
- Open the site on a phone, host a game, and confirm players on other devices can join —
  this exercises the full WebSocket path end to end.

## Known tradeoff

The server's Docker image copies the full workspace `node_modules` into the final layer
for simplicity, which means it also ships `apps/web`'s dependencies (Next.js, React, etc.)
that the server never uses at runtime. This bloats the image size but keeps the Dockerfile
simple and easy to reason about. If image size or cold-start time ever becomes a real
problem, the fix is to prune per-workspace dependencies (e.g. a dedicated lockfile for
`apps/server`, or a tool like `turbo prune`) — not worth the complexity until it's a
measured issue.
