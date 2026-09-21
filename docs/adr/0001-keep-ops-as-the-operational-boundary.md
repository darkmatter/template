# 0001 — Keep ops as the operational boundary

- **Status:** accepted
- **Date:** 2026-08-09
- **Deciders:** Cooper Maruyama

## Context

The repository started as an ops-oriented monorepo demo (`a497521 Initial ops
monorepo demo`) and then moved Nix implementation details out of the root
surface (`d91033d Move Nix implementation to nix`). The current `ops/README.md`
and `AGENTS.md` both say `ops/` owns the operational life of the repository and
is not a catch-all for source-adjacent application configuration.

Without a durable boundary, deployment manifests, local Compose files, runtime
dependency configuration, policies, and secrets could drift into app or package
directories, while app-specific source configuration could be misplaced under
`ops/`.

## Decision

Keep operational concerns under `ops/`:

- `ops/bin/` for human-invoked operational commands.
- `ops/container/` for container build recipes.
- `ops/compose/` for local multi-service stacks.
- `ops/config/` for runtime configuration for dependencies.
- `ops/deploy/` for reusable deployment primitives.
- `ops/environments/` for environment-specific assembly.
- `ops/secrets/` for encrypted secret material and rules.
- `ops/observability/` for dashboards, alerts, metrics, tracing, and logging.
- `ops/nix/` for operational host/profile Nix configuration.
- `ops/policies/` for automation guardrails.

Application schemas, package manifests, Vite configs, and other source-adjacent
configuration stay beside the application or package that consumes them.

## Consequences

Operators and agents have one predictable place to look for deployment and
runtime concerns. Application directories stay focused on source and local app
configuration.

The boundary requires judgment. A file can be operationally relevant without
belonging in `ops/`; contributors must decide whether the file configures the
application itself or the operational environment around it.

## Alternatives considered

- **Put all configuration under `ops/`.** Rejected because application-owned
  config becomes harder to maintain when it is separated from the code that
  consumes it.
- **Let each app own its own operational surface.** Rejected because cross-app
  deployment, secrets, observability, and policy conventions would fragment.
