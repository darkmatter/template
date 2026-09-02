# Getting started

Enter the pinned development environment and install the Bun workspace:

```sh
nix develop
bun install
```

Inside the shell, `x` lists the project commands and `docs` opens these notes.

## Read the demo

The useful reading order is:

1. `packages/agent-core/src/domain/model.ts` — schema-backed decisions.
2. `packages/agent-core/src/services/agent-harness.ts` — the orchestration loop.
3. `packages/agent-testkit/test/agent-harness.test.ts` — layer substitution.
4. `packages/agent-demo/src/layer.ts` — provider-free app composition.
5. `apps/cli/src/command.ts` — the terminal process boundary.
6. `apps/harnessd/src/api.ts` — the typed HTTP boundary.
7. `packages/agent-runtime/src/effect-ai-model.ts` — unstable API isolation.
8. `apps/native/src/app.ts` — the callback/runtime boundary.
9. `crates/agent-sandboxd/src/supervisor.rs` — the process boundary.

## Run and validate

```sh
x dev
x test
x check
x lint
cargo test --workspace
```

Exercise the shared demo layer through the terminal or daemon edge:

```sh
bun run cli run --events "Explain the harness"
bun run harnessd
```

In another terminal, submit an HTTP run:

```sh
curl -sS http://127.0.0.1:4319/runs \
  -H 'content-type: application/json' \
  -d '{"goal":"Explain the harness"}'
```

Open <http://localhost:3000> for the architecture page. The web app is an
operational shell around the demo; a provider-backed agent is intentionally not
preconfigured.

Always run Vitest through `bun run test`, never `bun test`. Format TypeScript,
JSON, and Nix with `x fmt`; format Rust with `cargo fmt --all`.
