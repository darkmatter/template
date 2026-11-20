# Darkmatter Effect Agent Harness Template

Bun + Effect agent harness with a Tauri desktop shell, a bounded Rust process
supervisor, and a deliberately structured operational surface. This is the org
reference for clean Effect-native TypeScript and the preferred toolchain (Bun,
tsgo, Vite+ for oxlint/oxfmt/Vitest, Nix flake-parts + Prelude).

## Repository layout

| Path                                | Purpose                                                          |
| ----------------------------------- | ---------------------------------------------------------------- |
| `apps/cli/`                         | Effect CLI and terminal rendering boundary                       |
| `apps/harnessd/`                    | Typed harness HTTP API and long-lived Bun server                 |
| `apps/web/`                         | Status/architecture page (`@agent-demo/web`) — Waku + Alchemy    |
| `apps/native/`                      | Tauri shell and managed Effect runtime boundary                  |
| `packages/agent-core/`              | Harness agent on `@yielded/agent`, run schemas, `AgentHarness`   |
| `packages/agent-demo/`              | Provider-free model and tool layers shared by runnable apps      |
| `packages/agent-runtime/`           | Supervised `Shell` tool and its harness layer                    |
| `packages/agent-testkit/`           | Scripted model and deterministic test layers                     |
| `packages/sandbox-client/`          | Schema contract for the Rust supervisor                          |
| `packages/web-core/`                | Framework-independent status and metrics helpers                 |
| `packages/tooling/`                 | Shared TypeScript and Oxc configuration                          |
| `crates/agent-sandboxd/`            | Bounded NDJSON process supervisor                                |
| `crates/cloudflare-worker-example/` | Rust (workers-rs) Cloudflare Worker deployed by `packages/infra` |
| `flake.nix`                         | Root flake — stays at root because Nix discovers flakes there    |
| `nix/flake/`                        | Thin public Nix-output layer (apps, checks, devShells, packages) |
| `nix/demo/`                         | Nix package and smoke-check implementation                       |
| `nix/prelude.nix`                   | Prelude command catalogue (`x` menu, MOTD, docs)                 |
| `nix/bun.nix`                       | Generated Bun dependency lock for Nix builds (`bun2nix`)         |
| `ops/`                              | Operational surface — see [ops/README.md](ops/README.md)         |
| `docs/`                             | Architecture and getting-started docs                            |
| `.github/workflows/`                | CI pipeline                                                      |

### `ops/` boundary

`ops/` owns the operational life of the repository. It is not a catch-all
for source-adjacent configuration. A Vite config, package manifest, or
application schema still belongs beside the application that uses it.

| Directory            | Owns                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `ops/bin/`           | Human-invoked operational commands                                |
| `ops/container/`     | Container build recipes (Dockerfiles, bases)                      |
| `ops/compose/`       | Local multi-service Docker Compose stacks                         |
| `ops/config/`        | Runtime configuration for dependencies (Nginx, PostgreSQL, Redis) |
| `ops/deploy/`        | Reusable deployment primitives (Kubernetes base, Terraform)       |
| `ops/environments/`  | Environment-specific assembly (dev, staging, production)          |
| `ops/secrets/`       | SOPS-encrypted secret material and rules                          |
| `ops/observability/` | Dashboards, alerts, metrics, tracing, logging                     |
| `ops/nix/`           | Operational host/profile Nix configuration                        |
| `ops/policies/`      | Guardrails evaluated by automation                                |

## Tooling

- Run installs and scripts with Bun from the repository root.
- Use `.ts` for Bun-owned source. Do not add new `.mjs` application files.
- Typecheck with `tsc` / tsgo: `bun run check`. Do not use `tsc` from an
  unpatched TypeScript 5 install. The root `prepare` script patches tsgo
  and the oxlint shipped by `vite-plus` via
  `effect-tsgo patch --no-typescript --oxlint`. Keep `@effect/tsgo` on a
  version that supports `vite-plus`'s oxlint.
- The root `vite.config.ts` is the only lint, format, and test config
  (`lint`, `fmt`, `test` blocks). See ADR 0010.
- Tests use Vitest through Vite+: run `bun run test`, never `bun test`.
- Lint with `bun run lint` (`vp lint`). Format with `x fmt` (`vp fmt` for
  TypeScript/JSON/Markdown/YAML, `nix fmt` for Nix).
- Effect/TSGO style warnings are advisory outside intentionally Effect-owned
  code. Keep the tsconfig plugin name as `@effect/language-service`.
- The linter warns at 300 lines per file (blank lines and comments skipped).
  Split files that exceed this.
- `vp fmt` is configured at 80 print width and sorts `package.json` keys.
  Prettier is disabled in Zed — oxfmt is the only formatter.
- The root `bun run check` runs root `tsc` then every workspace package's
  `typecheck` script through Bun's workspace filter.
- Rust uses the root Cargo workspace. Run `cargo check --workspace` and
  `cargo test --workspace` after changing the supervisor or its protocol.
- `crates/cloudflare-worker-example` compiles to wasm only through
  `worker-build`, which the Alchemy stack runs on deploy. Run Alchemy from the
  Nix devshell, which provides `worker-build` and `lld`. See the crate README.

### Nix devshell

Enter the development shell with `nix develop` (or `direnv allow` for
automatic entry). Inside the shell:

- `x` — interactive command picker
- `x dev` — run the Waku web app under `alchemy dev` (local `workerd`, :3000)
- `x cli` — run the deterministic harness CLI
- `x harnessd` — run the typed harness daemon
- `x check` — tsgo typecheck
- `x test` — Vitest
- `x lint` — `vp lint` (oxlint)
- `x fmt` — `vp fmt` + treefmt (alejandra)
- `x install` — `bun install`
- `x ops:container-config` — validate the local Compose stack

The `justfile` provides `just` wrappers that enforce devshell entry
(`just check`, `just test`, `just dev`, `just fmt`, `just container-up`).

After changing `package.json` dependencies, regenerate the Nix lock:
`bun run generate:bun-nix` (runs `bun2nix -o nix/bun.nix -c ../`).

## Preferred libraries

This template is the preferred-libs home for Darkmatter TypeScript apps. Encode
shared versions in the root `catalog` and depend on them with `catalog:` from
workspaces.

- Prefer Bun workspaces, Turborepo boundaries, TypeScript 7, `@effect/tsgo`,
  Nix, and `bun2nix` for TypeScript monorepos.
- Prefer Effect v4, `@effect/platform-bun` / `@effect/platform-node`, Effect
  Schema, services, and layers for runtime boundaries.
- Prefer `@yielded/agent` for agents: define them with `Agent.make`, native
  Effect AI tools and models, and run them with `AgentRuntime`. Keep
  `@yielded/agent*` packages on one release; that release must peer on the
  catalog's `effect`.
- Prefer `effect-orpc` for typed RPC surfaces and keep the `@orpc/*` peer
  packages on compatible `>=1.13` versions.
- Prefer Postgres for application data. The default app data path should use
  `kysely` + `pg` and/or `@effect/sql-pg`; do not present D1 or SQLite as the
  default store. D1 may remain only as an optional Cloudflare-local or legacy
  demo resource when a stack already contains it.
- Prefer Alchemy and `alchemy-sops` for deployable infrastructure examples,
  with Cloudflare resources where they are already in scope.
- React 19, shadcn, and Radix are optional UI choices for apps that already
  need UI components; do not expand this harness into a full UI stack solely to
  demonstrate them.

## Package conventions

- Package configs should depend on `@repo/tooling` and extend
  `@repo/tooling/tsconfig`.
- Put shared versions in the root `catalog` in `package.json` and use
  `catalog:` in package manifests. Use `workspace:*` and `@repo/*` imports
  for internal packages.
- Prefer package `#` imports over parent-relative `../` within a package.
  Each package declares `"imports": { "#*": "./src/*" }` and a `paths`
  entry in its `tsconfig.json`.
- Workspace packages: `apps/*` and `packages/*`.
- Each workspace package declares a `turbo.json` with one of `app`,
  `service`, `internal`, or `leaf`. `turbo boundaries` enforces the graph:
  only apps may depend on apps, services may not depend on apps, internal
  packages may depend only on internal and leaf, and leaf packages may not
  depend on other tagged packages.
- The root `package.json` `engines` requires Node >= 24; `packageManager`
  is `bun@1.3.14`.

## Application architecture

The demo is an Effect-native agent harness built on `@yielded/agent`, the
preferred framework for Darkmatter agents (ADR 0012). `packages/agent-core`
defines the harness agent with `Agent.make` (goal in, text out, turn and
duration policy) and runs it with `AgentRuntime.start`. `AgentHarness.layer`
captures the model, tool handlers, config, and history store so its public
operation has no hidden environment requirement. Do not hand-roll a model/tool
loop, journal, or event schema: use yielded's runtime and `RunEvent`.

Tools are native Effect AI `Tool`/`Toolkit` values and models are Effect AI
`LanguageModel` layers; provider SDK layers stay at composition roots.
`packages/sandbox-client` owns the tagged wire protocol implemented by
`crates/agent-sandboxd`. The Rust daemon supervises processes but is not a
security sandbox.

`packages/agent-demo` supplies one deterministic, schema-validated tool
round-trip without provider credentials. `apps/cli`, `apps/harnessd`, and
`apps/native` consume this same layer; application entrypoints must not copy or
reimplement the harness.

`apps/native` creates one `ManagedRuntime` for UI callback execution and
disposes it with the application lifecycle. `apps/web` remains the operational
shell: a [Waku](https://waku.gg) app whose dynamic front page renders the live
status, with `/api/status` and Prometheus-ready `/api/metrics` as Waku API
routes (`src/pages/_api/`).

Web support helpers live in `packages/web-core`:

- `AppConfig` — Effect service reading `HOST`, `PORT`, `APP_ENV`,
  `APP_RELEASE`, and the optional redacted `DEMO_MESSAGE`.
- `Metrics` — in-memory request counter with Prometheus text export.
- `Status` — typed status payload encoded via `Schema`.

`apps/web/src/runtime.ts` builds one `ManagedRuntime` from these layers and
reads config through Waku's `getEnv`, so the same code runs in two places:

- **Cloudflare** — `apps/web/alchemy.run.ts` owns the app's Alchemy stack
  (`Cloudflare.Website.Waku`). `bun run dev` is `alchemy dev`;
  `bun run deploy` deploys a stage. The stack binds `APP_ENV` (from the stage),
  `APP_RELEASE`, and `DEMO_MESSAGE` as Worker env; `DEMO_MESSAGE` may come
  from the SOPS document named by `APP_SOPS_FILE` at deploy time.
- **Self-hosted** — `bun run build` is Waku's Node adapter build;
  `bun run start` serves `dist/serve-node.js` on Bun from `HOST`/`PORT`.
  The Nix package, container images, and Kubernetes base run this output.

Do not set `unstable_adapter` in a `waku.config.ts`: Alchemy owns the adapter
for Cloudflare, and the plain build uses Waku's Node default.

Standing structural choices are recorded in
[Architecture Decision Records](docs/adr/).

### Environments

`APP_ENV` accepts: `development`, `test`, `staging`, `production`.
`ops/environments/` composes the Kubernetes base from `ops/deploy/` per
environment with its own namespace, hostname, replicas, runtime config, and
image reference. Production uses a digest rather than a mutable image tag.

## Testing

- Unit tests live next to the code they test. They use `@effect/vitest` with
  `it.effect` and fresh layers; do not wrap `it.effect` in `Effect.scoped`.
- `packages/agent-testkit` runs the real harness and yielded runtime with
  yielded's `ScriptedModel` and a deterministic `Echo` tool.
- The Nix smoke check (`nix/demo/check.nix`) builds the web app and verifies
  its status API and front page end-to-end.
- Test files match `**/*.test.ts`. Vitest excludes `.direnv/**`.
- Add regression tests for behavior changes.

## Secrets

- Secrets are SOPS-encrypted with `age` in `ops/secrets/`.
- `.sops.yaml` defines creation rules; `encrypted_regex` encrypts only
  `data` and `stringData` fields.
- Never commit an age private key, a decrypted file, or a plaintext
  `.env` file.
- Environment compositions should reference secrets through their
  deployment/GitOps controller, not by copying values into
  `ops/environments/`.
- `.gitignore` excludes `.env`, `.env.*`, and `*.agekey`.

## CI

`.github/workflows/ci.yaml` runs on every PR and push to `main`:

1. `bun install --frozen-lockfile --ignore-scripts`
2. `bun run prepare` (patches tsgo + oxlint)
3. `bun run check`
4. `bun run test`
5. `bun run lint`
6. `bun run fmt:check`
7. `cargo check --workspace`, `cargo test --workspace`, and Rust formatting
8. `nix flake check`
9. `docker compose -f ops/compose/local.yaml config`

All steps must pass. The `--ignore-scripts` install flag means no
postinstall scripts run in CI — the `prepare` step handles patching.
Foundry is not installed by this workflow; run `forge test --root contracts`
locally when Solidity examples change.

## Validation

Start narrow (the package or file you changed), then run the full suite:

```sh
bun run check
bun run test
bun run lint
bun run fmt:check
cargo check --workspace
cargo test --workspace
forge test --root contracts
nix flake check
docker compose -f ops/compose/local.yaml config
```

- Never commit decrypted SOPS values or plaintext credentials.
- Preserve unrelated worktree changes and do not commit unless asked.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
