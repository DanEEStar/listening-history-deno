# syntax=docker/dockerfile:1
# Keep the default aligned with mise.toml. Override with --build-arg NODE_VERSION=... .
ARG NODE_VERSION=24.14.1
FROM node:${NODE_VERSION}-bookworm-slim AS builder

WORKDIR /app
ENV NUXT_TELEMETRY_DISABLED=1 \
    NITRO_PRESET=node-server

COPY package.json package-lock.json ./
# Keep the dependency layer cacheable without running nuxt prepare before sources exist.
# Native dependencies use their platform-specific optional packages; no install hooks needed.
RUN npm ci --ignore-scripts --no-audit --no-fund

# Explicit inputs keep operational scripts, local env files, and secrets out of all layers.
COPY nuxt.config.ts tsconfig.json database.types.ts database.generated.types.ts ./
COPY app ./app
COPY server ./server
COPY shared ./shared
COPY public ./public
RUN npm run postinstall && npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Nitro's standalone output includes the production dependencies and public assets.
COPY --from=builder --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
