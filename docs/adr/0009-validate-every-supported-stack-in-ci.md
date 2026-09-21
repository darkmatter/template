# 0009 — Validate every supported stack in CI

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

The repository is deliberately multi-stack: Bun/Effect TypeScript apps and
packages, a Rust Cargo workspace, Nix flake outputs, container/Compose
configuration, and now Solidity examples documented for local Foundry
validation. `.github/workflows/ci.yaml` runs on PRs and pushes to `main` and
checks Bun install/prepare, TypeScript boundaries and typechecks, Vitest,
oxlint, oxfmt, Cargo check/test/fmt, `nix flake check`, and Docker Compose
configuration.

`AGENTS.md` mirrors the same validation list and tells contributors to start
narrow, then run the full suite. It also notes that Foundry is not installed in
the workflow, so `forge test --root contracts` is a local validation command
when Solidity examples change.

## Decision

Treat CI as the canonical validation gate for every supported stack that is
available in the workflow:

- Bun install with ignored lifecycle scripts, followed by explicit prepare.
- TypeScript boundary/type checks, tests, lint, and formatting.
- Rust workspace check, test, and formatting.
- Nix flake checks.
- Docker Compose configuration validation.

Keep additional local-only validation documented when CI does not install the
tool, as with Foundry.

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
- **Add Foundry to CI immediately.** Rejected for now because the workflow does
  not install Forge. The repo documents local `forge test --root contracts`
  until a reliable CI install path is added.
