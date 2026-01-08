FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mathstream/worker build
RUN pnpm --filter @mathstream/worker deploy --prod /app/deploy

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/deploy ./

CMD ["node", "dist/index.js"]
