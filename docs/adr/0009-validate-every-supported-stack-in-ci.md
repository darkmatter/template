# 0009 — Validate every supported stack in CI

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

This template is deliberately multi-stack: Bun/Effect TypeScript apps and
packages, a Rust Cargo workspace, Nix flake outputs, and container/Compose
configuration. Adopters need confidence that changes preserve every supported
stack, not only the TypeScript application surface.

`.github/workflows/ci.yaml` runs on PRs and pushes to `main` and checks Bun
install/prepare, TypeScript boundaries and typechecks, Vitest, oxlint, oxfmt,
Cargo check/test/fmt, `nix flake check`, and Docker Compose configuration.

`AGENTS.md` mirrors the same validation list and tells contributors to start
narrow, then run the full suite.

## Decision

Treat CI as the canonical validation gate for every supported stack that is
available in the workflow:

- Bun install with ignored lifecycle scripts, followed by explicit prepare.
- TypeScript boundary/type checks, tests, lint, and formatting.
- Rust workspace check, test, and formatting.
- Nix flake checks.
- Docker Compose configuration validation.

Keep additional local-only validation documented when CI does not install the
tool.

## Why

The template is useful only if its supported surfaces keep working together.
TypeScript success alone does not prove that Rust protocol code, Nix outputs,
or Compose configuration still work, so CI validates each supported stack
explicitly.

The workflow also makes setup behavior explicit. Installing with ignored
lifecycle scripts and then running `prepare` keeps patching visible and
repeatable. Local-only checks remain documented until they are stable enough to
become part of the shared CI surface.

## Trade-offs

Template changes are verified across the same surfaces future projects inherit.
The explicit prepare step keeps CI deterministic even with
`--ignore-scripts`, and the separate Rust/Nix/Compose checks prevent TypeScript
success from hiding other breakage.

The cost is a broader and sometimes heavier validation matrix. Contributors
need the right local tools or must rely on CI for unavailable checks.
