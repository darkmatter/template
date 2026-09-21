# Foundry contracts example

This directory is a small Foundry project that demonstrates the Solidity style
expected for Ethereum examples in this template.

## Layout

- `src/Counter.sol` — Ownable-style counter with custom errors and events.
- `test/Counter.t.sol` — Forge tests for initial state, owner checks, setting,
  and incrementing the counter.
- `foundry.toml` — Foundry project configuration.

The tests are self-contained and do not require a live chain or external
contract libraries.

## Install Foundry

Install the Foundry toolchain if `forge` is not already available:

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Build and test

From the repository root:

```sh
forge build --root contracts
forge test --root contracts
```
