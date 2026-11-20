# 0012 — Build agents with `@yielded/agent`

- **Status:** accepted; supersedes the hand-written loop in 0005 and the
  `effect/ai` quarantine in 0006
- **Date:** 2026-11-09
- **Deciders:** Cooper Maruyama

## Context

`@yielded/agent` is Darkmatter's preferred framework for building agents. It is
Effect-native: an agent is an `Agent.make` definition (input and output
schemas, instructions, a native Effect AI `Toolkit`, and a run policy), and
`AgentRuntime` runs the model/tool loop, validates tool calls and final output,
enforces turn, tool-call, and duration budgets, and emits versioned `RunEvent`s.
Models are Effect AI `LanguageModel` layers and history comes from a layer
(`InMemory.layer`, a persistent history, or a durable host).

The harness previously owned its own loop (`AgentHarness` iterating over an
`AgentModel.decide` → `ToolRunner.execute` protocol), its own decision, tool,
and event schemas, and an in-memory journal. ADR 0005 recorded that loop, and
ADR 0006 allowed only `packages/agent-runtime` to import `effect/ai`, which
translated Effect AI tool calls into that protocol.

## Decision

Build harness agents with `@yielded/agent`:

- `packages/agent-core` defines the harness agent with `Agent.make` and runs it
  with `AgentRuntime`. It owns only what is specific to this harness: the goal
  and report schemas, the turn and system-prompt config, and the
  `AgentHarness` service whose layer captures the model, tool handlers, and
  history store.
- Tools are native Effect AI `Tool`/`Toolkit` values; models are Effect AI
  `LanguageModel` layers; events are yielded `RunEvent`s. Packages that declare
  tools or models import `effect/ai`. Provider SDK layers stay at the
  composition root that supplies the model.
- Tests replace the model with yielded's `ScriptedModel` from
  `@yielded/agent-testing` and run the real runtime.
- Each `@yielded/agent*` package uses one release, chosen in the root catalog,
  whose `effect` peer range includes the catalog's `effect`.

## Why

An agent loop, its tool protocol, and its event log are framework concerns.
Owning them meant a second, smaller copy of what the preferred framework
already provides, without its budgets, approvals, tool authorization,
compaction, or durable hosts. With yielded, apps choose those capabilities by
adding layers and run options instead of extending a private loop.

Effect AI's `Tool`, `Toolkit`, and `LanguageModel` are the framework's
vocabulary, so quarantining them behind a translation layer would recreate the
private protocol. Provider churn is still contained: it lives in provider
packages such as `@effect/ai-openai`, supplied only where a model is chosen.

## Trade-offs

The harness gains yielded's validated loop, budgets, and event schema, and new
agents follow the same conventions as other Darkmatter agents.

`@yielded/agent` is a beta and moves quickly. Its `RunEvent` schema is now part
of the harness HTTP response. Each release peers on a specific Effect minor,
so upgrading yielded and Effect happens together across the monorepo. Because the
harness service is generic over its toolkit, it reports failures as one
`RunFailure` with yielded's error tag and message instead of a closed union of
error classes.
