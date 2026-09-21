# Alloy web3 example

Small Rust example for reading Ethereum JSON-RPC data with Alloy from the
workspace Cargo graph.

The binary reads:

- `ETH_RPC_URL` — HTTP JSON-RPC endpoint. Defaults to local Anvil at
  `http://127.0.0.1:8545`.
- `COUNTER_ADDRESS` — optional address of the companion Foundry `Counter`
  contract. When set, the binary calls `number()` through a `sol!`-generated
  interface.

Run against local Anvil:

```sh
anvil
cargo run -p alloy-web3-example
```

Run against another endpoint:

```sh
ETH_RPC_URL=https://ethereum-rpc.publicnode.com \
  cargo run -p alloy-web3-example
```

If you deploy `contracts/src/Counter.sol`, pass its address:

```sh
ETH_RPC_URL=http://127.0.0.1:8545 \
COUNTER_ADDRESS=0x0000000000000000000000000000000000000000 \
  cargo run -p alloy-web3-example
```

Validation does not require a live network:

```sh
cargo test -p alloy-web3-example
```
