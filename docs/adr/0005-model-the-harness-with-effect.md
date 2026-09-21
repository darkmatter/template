# 0005 — Model the harness with Effect

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

The template demonstrates an agent harness that should remain inspectable,
testable, and independent of any one provider or application shell.
`docs/architecture.md` describes the dependency rule as "stable policy points
inward; integrations point in from the edges." `docs/10-effect-solutions.md`
records the pinned Effect version and conventions: services extend
`Context.Service`, domain data uses `Schema.Class`, protocol variants use
`Schema.TaggedClass` and `Schema.Union`, recoverable failures use
schema-backed tagged errors, and layers acquire dependencies once.

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

## Why

Effect gives the harness typed services, layer-based dependency injection,
schema-backed data, and recoverable errors as one programming model. Those
pieces matter together: apps can share one orchestration loop, tests can swap
capabilities with deterministic layers, and boundary payloads remain explicit.

The harness loop is intentionally small enough to stay as ordinary control flow
inside `Effect.gen`. The types and layers carry the architectural contract,
while the loop itself stays readable for adopters studying the template.

## Trade-offs

The core harness can be tested with deterministic layers and without provider
credentials. Public operations avoid hidden environment requirements, and
schema-backed contracts make app, daemon, CLI, and testkit boundaries explicit.

The cost is that contributors must understand Effect services, layers, schema
classes, and the pinned beta API. Simpler ad hoc async functions may look easier
locally but would lose the substitution and boundary guarantees.
