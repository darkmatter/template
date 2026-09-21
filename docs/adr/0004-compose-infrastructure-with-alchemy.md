# 0004 — Compose infrastructure with Alchemy

- **Status:** accepted
- **Date:** 2026-08-23
- **Deciders:** Cooper Maruyama

## Context

The template includes deployable infrastructure alongside the application
harness. Infrastructure code needs a resource graph and deployment composition
root without becoming the application runtime itself.

`packages/infra/alchemy.run.ts` declares a named `AgentHarness` stack, receives
Cloudflare provider/state layers, composes storage, queue, and dashboard
resources, and returns deployable outputs. `docs/10-effect-solutions.md`
records that `alchemy@2.0.0-beta.70` is pinned to match the installed
`alchemy-sops` peer range.

The application harness itself lives in Effect packages and apps. The docs
explicitly say Alchemy's experimental agent resource is not used: Alchemy
declares deployable infrastructure while the agent remains in Effect.

## Decision

Use Alchemy as the infrastructure resource graph and deployment composition
root. Keep Alchemy code in `packages/infra/`, where it declares cloud resources
and outputs, and keep application runtime orchestration in the Effect harness
packages and apps.

Alchemy provider/state concerns should be assembled in infrastructure code.
Application packages should consume configuration and service boundaries rather
than invoking the Alchemy runtime.

## Consequences

Infrastructure is described in TypeScript and can share the repo's toolchain
without becoming application domain code. The deployable web surface can evolve
without moving the harness loop into a cloud resource declaration.

The cost is an additional beta dependency and a clear separation contributors
must preserve: Alchemy is for resource composition, not for replacing the
Effect-native agent architecture.

## Alternatives considered

- **Put deployment resources in app entrypoints.** Rejected because app runtime
  code would become harder to test and reason about.
- **Use Alchemy's agent resource for the harness.** Rejected because the
  repository's agent loop is the Effect domain model; Alchemy only owns
  deployable infrastructure.
- **Avoid infrastructure-as-code in the template.** Rejected because the repo is
  intended to demonstrate an operationally shaped app, not only local code.
