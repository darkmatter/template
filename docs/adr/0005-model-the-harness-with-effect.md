# 0005 — Model the harness with Effect

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

Commit `3597f9a feat: transform template into Effect agent harness demo`
established the current application architecture. `docs/architecture.md`
describes the dependency rule as "stable policy points inward; integrations
point in from the edges." `docs/10-effect-solutions.md` records the pinned
Effect version and conventions: services extend `Context.Service`, domain data
uses `Schema.Class`, protocol variants use `Schema.TaggedClass` and
`Schema.Union`, recoverable failures use schema-backed tagged errors, and
layers acquire dependencies once.

The code follows this shape: `packages/agent-core` owns request, model, event,
error, journal, and harness services; `AgentHarness.layerNoDeps` captures its
model, tool runner, journal, and config dependencies; tests replace services
with layers rather than mocking modules.

## Decision

Model the agent harness as an Effect-native domain:

- Domain messages and payloads are schema-backed classes and tagged unions.
- Capabilities are `Context.Service` interfaces.
- Layers assemble implementations and capture dependencies before public
  operations are exposed.
- The main harness loop remains a small, sequential `Effect.gen` state machine.
- Recoverable domain failures are typed errors rather than unstructured thrown
  exceptions.

## Consequences

The core harness can be tested with deterministic layers and without provider
credentials. Public operations avoid hidden environment requirements, and
schema-backed contracts make app, daemon, CLI, and testkit boundaries explicit.

The cost is that contributors must understand Effect services, layers, schema
classes, and the pinned beta API. Simpler ad hoc async functions may look easier
locally but would lose the substitution and boundary guarantees.

## Alternatives considered

- **Use plain TypeScript classes and promises.** Rejected because the harness
  needs typed dependencies, recoverable failures, and test-layer substitution.
- **Use an actor or workflow framework for the loop.** Rejected because the
  current bounded sequential state machine is clearer as ordinary control flow
  inside `Effect.gen`.
- **Let each app implement its own loop.** Rejected because the CLI, daemon,
  and native shell must share one orchestration model.
