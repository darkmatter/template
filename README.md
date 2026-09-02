# Effect agent harness demo

A production-shaped monorepo whose demo is a deliberately small agent harness.
The interesting part is the code architecture: Effect schemas describe every
boundary, services state capabilities, layers assemble implementations, and
tests swap the model and tools without mocks or global state.

The repository does not ship a model credential or pretend that arbitrary
process execution is safe. The AI provider is an adapter seam, and the Rust
worker is a bounded process supervisor—not a security sandbox.

## Tour

| Path                       | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `apps/cli/`                | Effect CLI for local and operator-driven harness runs           |
| `apps/harnessd/`           | Typed HTTP API and long-lived Bun runtime boundary              |
| `apps/native/`             | Tauri shell with one managed Effect runtime at the UI boundary  |
| `apps/web/`                | Small Bun status server and architecture landing page           |
| `packages/agent-core/`     | Stable schemas, errors, services, event journal, and agent loop |
| `packages/agent-demo/`     | Shared provider-free model, tool, and runnable demo layer       |
| `packages/agent-runtime/`  | Isolated `effect/unstable/ai` and supervised-shell adapters     |
| `packages/agent-testkit/`  | Scripted model and deterministic tool layers                    |
| `packages/infra/`          | Alchemy stack composition for the deployable web surface        |
| `packages/sandbox-client/` | Effect Schema contract shared with the Rust worker              |
| `crates/agent-sandboxd/`   | NDJSON process supervisor with deadlines and output bounds      |

Start with [`packages/agent-core/src/services/agent-harness.ts`](packages/agent-core/src/services/agent-harness.ts),
then read [`packages/agent-testkit/test/agent-harness.test.ts`](packages/agent-testkit/test/agent-harness.test.ts).
The test is the shortest executable explanation of the design.

## Use it

```sh
nix develop
bun install
x test
x dev
```

Open <http://localhost:3000>. The status API is `/api/status`; metrics are at
`/api/metrics`.

Run the deterministic harness from the terminal:

```sh
bun run cli run --events "Explain the harness boundaries"
```

Or start the daemon and submit the same run over its schema-described API:

```sh
bun run harnessd
curl -sS http://127.0.0.1:4319/runs \
  -H 'content-type: application/json' \
  -d '{"goal":"Explain the harness boundaries"}'
```

The daemon publishes its OpenAPI document at
<http://127.0.0.1:4319/openapi.json>.

Validate both language stacks:

```sh
bun run check
bun run test
bun run lint
bun run fmt:check
cargo check --workspace
cargo test --workspace
```

## Design notes

- `agent-core` imports no provider SDK, desktop framework, or process API.
- CLI, daemon, and desktop consume the same `DemoHarnessLayer`; none owns a
  second orchestration loop.
- `AgentHarness.layerNoDeps` captures its dependencies once and exposes an
  operation with no hidden environment requirement.
- Domain failures use schema-backed tagged errors and remain recoverable.
- The in-memory journal uses `Ref`, `PubSub`, and `Stream`, bounding retained
  histories while returning each terminal snapshot atomically; persistence can
  replace its layer without changing the loop.
- The Effect AI beta surface is quarantined in `agent-runtime` so version drift
  cannot spread through the domain.
- Tauri owns callback execution through one `ManagedRuntime`; libraries only
  describe effects.
- Alchemy owns infrastructure composition, not the application agent runtime.

See [the architecture guide](docs/architecture.md) for dependency direction and
[the canonical patterns note](docs/10-effect-solutions.md) for the version-pinned
Effect and Alchemy decisions.

## Operations

`ops/` remains the repository's operational boundary for containers,
environments, deployment, SOPS material, observability, and policy. See
[`ops/README.md`](ops/README.md). The web config can add an encrypted SOPS
document behind environment config through `alchemy-sops`; decrypted values
never enter the status payload.

## License

Private reference repository.
