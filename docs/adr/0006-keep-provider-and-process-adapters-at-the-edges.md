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

- **Import provider SDKs directly in `agent-core`.** Rejected because stable
  policy would inherit unstable provider versioning and credential concerns.
- **Copy the harness loop into each application.** Rejected because app-specific
  loops would drift and make tests less meaningful.
- **Make demos depend on live provider credentials.** Rejected because examples
  and smoke tests should run deterministically without secrets.

## Trade-offs

Version drift and provider-specific behavior are quarantined. The same harness
can run from CLI, daemon, native UI, tests, and demos because each edge supplies
the required services through layers.

The cost is adapter code and translation boundaries. New integrations must map
into the domain model instead of reaching through it, even when a direct SDK
call would be shorter.
