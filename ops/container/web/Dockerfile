# The local compose stacks build this image. Production ships the Nix-built
# image.nix beside it, which runs the same build output on the same
# production dependencies; change both together.
# Match packageManager: older Bun cannot read the lockfile format.
FROM oven/bun:1.4.4-alpine AS manifests
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/cli/package.json ./apps/cli/package.json
COPY apps/harnessd/package.json ./apps/harnessd/package.json
COPY apps/native/package.json ./apps/native/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/agent-core/package.json ./packages/agent-core/package.json
COPY packages/agent-demo/package.json ./packages/agent-demo/package.json
COPY packages/agent-runtime/package.json ./packages/agent-runtime/package.json
COPY packages/agent-testkit/package.json ./packages/agent-testkit/package.json
COPY packages/infra/package.json ./packages/infra/package.json
COPY packages/sandbox-client/package.json ./packages/sandbox-client/package.json
COPY packages/tooling/package.json ./packages/tooling/package.json
COPY packages/web-core/package.json ./packages/web-core/package.json

# The build needs dev dependencies (the shared tsconfig in @repo/tooling).
FROM manifests AS build
RUN bun install --frozen-lockfile --ignore-scripts
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/src ./apps/web/src
COPY packages/tooling ./packages/tooling
COPY packages/web-core ./packages/web-core
# Waku's Node adapter build; --bun runs its node-shebang CLI on Bun.
RUN cd apps/web && bun --bun run build

# The server bundles @repo/web-core; it imports only production packages.
FROM manifests
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY --from=build /app/apps/web/dist ./apps/web/dist
WORKDIR /app/apps/web
USER bun
EXPOSE 3000
CMD ["bun", "dist/serve-node.js"]
