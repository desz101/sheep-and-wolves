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
   - `NEXT_PUBLIC_SERVER_URL` → the game server's URL from step 2 below (e.g.
     `https://xxxxxxxx.us-east-1.awsapprunner.com`). You'll need to deploy the server first
     to know this value, then come back and set it, then redeploy the frontend.
5. Add your custom domain (`sheepishwolves.com`) under **Hosting → Custom domains**.

## 2. Game server — AWS App Runner (recommended)

App Runner is the simplest AWS-native fit: it runs containers as a persistent service,
supports WebSockets, gives you HTTPS out of the box, and needs no VPC/load balancer setup.
`apps/server/Dockerfile` is ready to go.

1. **App Runner → Create service → Source: Repository** (or push the image to ECR first,
   either works — repository is less setup).
2. Point it at the `sheep-and-wolves` GitHub repo, branch `main`.
3. Deployment settings: **Dockerfile**, path `apps/server/Dockerfile`. Set the
   **build context to the repo root** (not `apps/server`) — the Dockerfile needs sibling
   access to `packages/shared` and the root `package-lock.json` to resolve npm workspaces.
4. Port: `4000` (matches `EXPOSE 4000` in the Dockerfile; App Runner reads this automatically
   from the image, or set it explicitly if asked).
5. Environment variables:
   - `CLIENT_ORIGIN` → your Amplify app's URL (e.g. `https://sheepishwolves.com`) — this
     locks down Socket.IO's CORS to only your frontend instead of `*`.
   - `PORT` → `4000` (only needed if App Runner doesn't infer it from the Dockerfile).
6. Health check path: `/health` (already implemented in `apps/server/src/index.ts`).
7. Once deployed, copy the service URL and go back to step 1.4 above to wire it into the
   frontend's `NEXT_PUBLIC_SERVER_URL`, then trigger a redeploy of the Amplify app.

**Alternatives to App Runner**, if you'd rather use something else: ECS Fargate (more
control, more setup), Lightsail Containers (cheaper, simpler, less scalable), or EC2 with
Elastic Beanstalk. All of them can use the same `apps/server/Dockerfile`.

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
