# Salon Pay Records: one Node process, one SQLite file, one photo directory.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL=/data/salon.db \
    PHOTO_DIR=/data/photos \
    MIGRATIONS_DIR=/app/drizzle \
    BODY_SIZE_LIMIT=2M
# Litestream streams the SQLite file to object storage (optional; set LITESTREAM_* to enable)
ARG LITESTREAM_VERSION=0.3.13
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
 && curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-$(dpkg --print-architecture).tar.gz" | tar -xz -C /usr/local/bin \
 && apt-get purge -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/static/fonts ./static/fonts
COPY deploy/litestream.yml /etc/litestream.yml
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh && mkdir -p /data/photos
VOLUME ["/data"]
EXPOSE 8080
CMD ["/app/start.sh"]
