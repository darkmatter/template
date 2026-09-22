# 0001 — Keep ops as the operational boundary

- **Status:** accepted
- **Date:** 2026-08-09
- **Deciders:** Cooper Maruyama

## Context

This template carries application source, local development support,
deployment primitives, container configuration, secrets, observability, and
policy examples in one repository. Those concerns need stable homes so
adopting projects do not inherit a junk drawer.

`ops/README.md` and `AGENTS.md` define `ops/` as the operational boundary. It
owns deployment and runtime concerns, not source-adjacent application
configuration.

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

## Why

The template needs a directory boundary that adopters can copy before they know
which deployment platform, environment count, or operational maturity they will
end up with. Putting operational concerns under `ops/` gives those concerns a
stable address without pulling application-owned configuration away from the
code that uses it.

The boundary also gives agents and humans a shared routing rule: source-adjacent
files stay with source, while deployment, secrets, observability, policy, and
runtime-environment assembly stay under the operational surface.

## Trade-offs

Operators and agents have one predictable place to look for deployment and
runtime concerns. Application directories stay focused on source and local app
configuration.

The boundary requires judgment. A file can be operationally relevant without
belonging in `ops/`; contributors must decide whether the file configures the
application itself or the operational environment around it.
