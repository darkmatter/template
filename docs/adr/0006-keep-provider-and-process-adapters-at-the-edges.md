# 0006 — Keep provider and process adapters at the edges

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

The template's stable harness domain must survive provider SDK churn, unstable
AI APIs, process execution details, and application-shell differences.
`docs/architecture.md` says `packages/agent-runtime` is less stable, translates
Effect AI tool calls to core `ModelDecision` values, and is the only package
that imports `effect/unstable/ai`. It also says `packages/agent-demo` supplies
a provider-free runtime-safe composition shared by the CLI, daemon, and native
app.

The code reflects this boundary: `packages/agent-runtime/src/effect-ai-model.ts`
imports `effect/unstable/ai`, maps provider output into `UseTool` or `Finish`,
and converts provider failures into `ModelFailure`. Core domain files define
schemas and services without provider SDK imports.

## Decision

Keep provider SDKs, unstable AI APIs, shell/process adapters, Bun HTTP servers,
Tauri runtime management, and deployment-specific integration at the edges.
Stable packages define domain contracts and capability interfaces; adapters
translate external behavior into those contracts.

Provider-free demos and test layers should exercise the real harness without
network access or credentials.

## Why

The template needs a stable domain that can outlive provider APIs, desktop
runtime details, HTTP server choices, and shell execution mechanisms. Keeping
those concerns at the edges lets the core model stay small and reusable while
adapters absorb SDK shape, version drift, transport errors, and credentials.

This edge pattern also keeps examples and tests useful without live providers.
Provider-free layers can exercise the real harness, while production adapters
translate external behavior into the same domain contracts.

## Trade-offs

Version drift and provider-specific behavior are quarantined. The same harness
can run from CLI, daemon, native UI, tests, and demos because each edge supplies
the required services through layers.

The cost is adapter code and translation boundaries. New integrations must map
into the domain model instead of reaching through it, even when a direct SDK
call would be shorter.
