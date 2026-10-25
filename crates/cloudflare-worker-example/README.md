# Cloudflare Worker example

A Cloudflare Worker written in Rust with
[workers-rs](https://github.com/cloudflare/workers-rs), deployed by the
Alchemy stack in `packages/infra`.

Routes:

- `GET /` returns the `GREETING` variable.
- `GET /artifacts` lists up to ten keys from the `ARTIFACTS` R2 bucket (the
  stack's `ArtifactStore`).

## How it deploys

Alchemy does not compile Rust. `packages/infra/src/rust-worker.ts` declares a
`Command.Build` that runs `worker-build --release` in this directory, then a
`Cloudflare.Worker` with `bundle: false` that uploads the output unchanged:
`build/index.js` as the entry and `build/index_bg.wasm` as a wasm module.
The build is skipped when `src/`, `Cargo.toml`, and `Cargo.lock` are
unchanged.

`worker-build`, the `wasm32-unknown-unknown` standard library (bundled with
nixpkgs `rustc`), and `lld` come from the Nix devshell. Run Alchemy from
inside it:

```sh
nix develop
cd packages/infra
bun run deploy --stage <stage>
```

Bindings are declared in the stack's `env` and read in Rust with
`env.var("GREETING")` and `env.bucket("ARTIFACTS")`.

## Local development

`bun run dev` in `packages/infra` builds the crate once and serves the Worker
from local workerd at `http://localhost:1337`. It does not watch Rust
sources. Rebuild after an edit and the running Worker reloads:

```sh
cd crates/cloudflare-worker-example
worker-build --release
```

Use a different stage for `alchemy dev` than for a deployed environment.
Dev replaces that stage's cloud Worker with the local one and deletes the
deployed Worker.

## Validation

`cargo check --workspace` and `cargo test --workspace` compile this crate for
the host, which catches Rust errors without the wasm toolchain. The wasm
build itself runs only through `worker-build`.
