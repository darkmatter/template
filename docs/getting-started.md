# Getting started

Bun + Effect reference monorepo. The demo app lives in `apps/web`. Shared
domain logic lives in `packages/web-core`. Operational configuration lives
in `ops/`.

## Enter the shell

```sh
nix develop
```

Inside the shell, `x` lists every project command, `docs` opens this viewer,
and `x <name>` runs a command by key.

## Install and validate

```sh
bun install
x check
x test
x lint
```

Use Vitest via `bun run test` (never `bun test`).

## Run the app

```sh
x dev
```

Open <http://localhost:3000>. The status API is `/api/status`; Prometheus
metrics are `/api/metrics`.

## Format

```sh
x fmt
```

That runs `nix fmt` (alejandra + oxfmt via treefmt).
