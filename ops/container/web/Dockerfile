FROM oven/bun:1.4.2-alpine

WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/tooling/package.json ./packages/tooling/package.json
COPY packages/web-core/package.json ./packages/web-core/package.json
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY apps/web ./apps/web
COPY ops/secrets ./ops/secrets
COPY packages/tooling ./packages/tooling
COPY packages/web-core ./packages/web-core

USER bun
EXPOSE 3000
CMD ["bun", "apps/web/src/server.ts"]
