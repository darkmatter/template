# 0010 — Run Oxc and Vitest through Vite+

- **Status:** accepted
- **Date:** 2026-10-08
- **Deciders:** Cooper Maruyama

## Context

New Darkmatter projects are created with `vp create @darkmatter`, the
[Vite+](https://viteplus.dev) project generator. Vite+ converts every project
it scaffolds: it adds `vite-plus`, writes a root `vite.config.ts`, and rewrites
lint, format, and test scripts to `vp lint`, `vp fmt`, and `vp test`. A
template that is not already a Vite+ project is rewritten on the way out and
can fail to install, because `vite-plus` pins its own oxlint version.

[ADR 0002](0002-use-bun-tsgo-oxc-and-prelude.md) chose Bun, tsgo, Oxc (oxlint
and oxfmt), and Prelude. That choice stands. This record changes only how Oxc
and Vitest are installed and configured.

## Decision

The template is a Vite+ project. `vite-plus` supplies oxlint, oxfmt, and
Vitest. The root `vite.config.ts` is the single configuration for linting
(`lint`), formatting (`fmt`), and tests (`test`). Package scripts call `vp`:
`bun run lint`, `bun run fmt`, and `bun run test` remain the commands to use.

`@effect/tsgo` must support the oxlint version that `vite-plus` pins, because
the `prepare` script patches that oxlint. Upgrade them together.

Nix treefmt formats Nix files only. `vp fmt` formats everything else, since
oxfmt run outside Vite+ cannot read `vite.config.ts`.

## Why

`vp create` then finds nothing to convert: it only renames the package, sets
`create.defaultTemplate`, and reformats, so a new project starts from what CI
validates here. Vitest 5, which `vite-plus` requires, also needs Effect
`4.0.0-rc.113` or later for `@effect/vitest`. One config file removes the
separate `oxlint.config.ts`, `.oxfmtrc.json`, and Vitest config, which could
drift apart.

## Trade-offs

Oxc and Vitest versions now move with `vite-plus` releases rather than being
pinned one by one. The Effect lint presets still come from `@effect/tsgo`, so a
`vite-plus` upgrade that bumps oxlint needs a matching `@effect/tsgo` upgrade.
`nix fmt` alone no longer formats TypeScript; `x fmt` runs both formatters.
