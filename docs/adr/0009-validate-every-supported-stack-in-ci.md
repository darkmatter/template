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

## Consequences

Template changes are verified across the same surfaces future projects inherit.
The explicit prepare step keeps CI deterministic even with
`--ignore-scripts`, and the separate Rust/Nix/Compose checks prevent TypeScript
success from hiding other breakage.

The cost is a broader and sometimes heavier validation matrix. Contributors
need the right local tools or must rely on CI for unavailable checks.

## Alternatives considered

- **Only run TypeScript checks in CI.** Rejected because Rust, Nix, and Compose
  are part of the template contract.
- **Let package install scripts patch tools implicitly.** Rejected because CI
  installs with `--ignore-scripts`; patching must be an explicit step.
- **Require every optional local tool in CI immediately.** Rejected because some
  template examples or adopter-specific tools may not have a reliable install
  path in the shared workflow. Document local checks until they become part of
  the supported CI surface.
