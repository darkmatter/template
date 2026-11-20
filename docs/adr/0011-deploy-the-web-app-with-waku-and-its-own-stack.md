# 0011 — Deploy the web app with Waku and its own Alchemy stack

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Cooper Maruyama

## Context

Darkmatter web apps are React Server Component apps built with
[Waku](https://waku.gg) and deployed to Cloudflare with Alchemy's
`Cloudflare.Website.Waku`, with each app owning an `alchemy.run.ts` beside
its source. `apps/web` is the template's example of that shape.

[ADR 0004](0004-compose-infrastructure-with-alchemy.md) keeps Alchemy code in
`packages/infra/`. A web app declared there shares a stack with D1, R2, a
queue, and a Rust Worker, so `alchemy dev` for the page would provision and
build all of them. The page binds none of those resources.

The same page is also self-hosted: the Nix package, the container images, and
the Kubernetes base run it as a long-lived server with `/api/status` and
`/api/metrics`.

## Decision

`apps/web` is a Waku app. It owns its Alchemy stack in
`apps/web/alchemy.run.ts`, deployed with `Cloudflare.Website.Waku`;
`bun run dev` there is `alchemy dev`. `packages/infra` keeps the harness's
shared Cloudflare resources. An app that binds those resources may reference
that stack's outputs instead of moving into it.

The self-hosted path runs the same source through Waku's Node adapter
(`waku build`, then `dist/serve-node.js` on Bun). The app reads configuration
through Waku's `getEnv`, so both paths share one runtime. Deploy-time secrets
such as `DEMO_MESSAGE` are resolved in `alchemy.run.ts` and bound as Worker
secrets; the Worker never decrypts SOPS.

## Why

An app-owned stack gives the page a fast local loop and an independent deploy,
matching how Darkmatter's other Waku sites are laid out. Keeping one source
tree for Cloudflare and the self-hosted server preserves the operational
surface the template demonstrates without a second implementation.

## Trade-offs

There are now two Alchemy stacks; contributors pick the stack by app.
`alchemy dev` needs a Cloudflare profile, so `bun run web` remains the
credential-free way to run the page. Waku's Alchemy adapter pins an exact Waku
release, which in turn pins React, so those versions move together.
