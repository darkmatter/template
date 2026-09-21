# 0010 — Include Rust web3 and Foundry examples

- **Status:** accepted
- **Date:** 2026-09-21
- **Deciders:** Darkmatter

## Context

Commit `4b1ef18 feat(web3): add Alloy and Foundry examples` added this
template's first Ethereum-oriented reference examples. The repository already
had a top-level Cargo workspace with `crates/agent-sandboxd`, and `AGENTS.md`
requires extending the existing `crates/` workspace rather than inventing a
second Rust root.

The added example follows that structure: `crates/alloy-web3-example` is a
workspace member that uses Alloy to read chain metadata and optionally call the
companion Counter contract through a `sol!` interface. The Solidity side lives
under `contracts/` as a focused Foundry project with `foundry.toml`,
`src/Counter.sol`, forge tests, and a README. The docs list both paths in the
repository layout and add `forge test --root contracts` to validation guidance.

## Decision

Keep Rust web3 examples in the existing top-level Cargo workspace under
`crates/`. Keep Solidity examples in a root `contracts/` Foundry project.

Use Alloy for Rust/Ethereum interaction examples and Foundry for Solidity
contract examples. Examples should be small, explicit, and runnable without
secrets for tests; live RPC calls remain optional and environment-configured.

## Consequences

The template now shows preferred Rust/Ethereum style alongside the Effect/TS
harness and Rust supervisor. Contributors can see where Rust crates belong, how
to add workspace dependencies, how to keep network-free tests, and how Solidity
examples are validated with Forge.

The cost is another toolchain surface. Foundry is documented but not installed
by CI yet, so Solidity validation is a local required check when contracts
change.

## Alternatives considered

- **Create a separate Rust or web3 root.** Rejected because the repository
  already has a top-level Cargo workspace and `crates/` convention.
- **Use a live public contract only.** Rejected because tests and examples
  should remain understandable without depending on public RPC availability.
- **Generate bindings from Foundry artifacts in CI.** Rejected for now because
  the example stays simpler and less brittle with a checked-in `sol!`
  interface.
