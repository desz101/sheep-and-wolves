# Build context must be the MONOREPO ROOT (not apps/server), e.g.:
#   docker build -f apps/server/Dockerfile -t sheep-and-wolves-server .
# This is required so npm workspaces can resolve the @sw/shared package.

FROM node:22-alpine AS builder
WORKDIR /repo
COPY . .
RUN npm ci
RUN npm run build -w packages/shared
RUN npm run build -w apps/server

FROM node:22-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/packages/shared ./packages/shared
COPY --from=builder /repo/apps/server/package.json ./apps/server/package.json
COPY --from=builder /repo/apps/server/dist ./apps/server/dist

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
