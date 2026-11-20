# darkmatter/template

Living reference repository for Darkmatter's engineering, toolchain, and operational conventions.

This repository (`darkmatter/template`, workspace `effect-agent-harness-demo`)
encodes how Darkmatter structures, builds, tests, secures, and deploys software.
Instead of maintaining an unverified style guide or empty starter boilerplate,
every convention is applied here to a small, working polyglot system—an Effect
agent harness, a Waku web app, a Tauri desktop shell, and a Rust process
supervisor—and gated end-to-end in CI.

The example domain is deliberately small and honest about its boundaries: no
model credentials are required to run or test the repo, AI providers sit behind
adapter layers at the composition roots, and the Rust worker is a bounded
process supervisor rather than a security sandbox. Copy or slice the structure,
toolchain, and boundaries; replace the example domain with your own.

## Table of Contents

- [Conventions applied and why](#conventions-applied-and-why)
  - [Repository root and the `ops/` boundary](#repository-root-and-the-ops-boundary)
  - [Deep modules and enforced package boundaries](#deep-modules-and-enforced-package-boundaries)
  - [One TypeScript toolchain: Bun, tsgo, and Vite+](#one-typescript-toolchain-bun-tsgo-and-vite)
  - [Effect-native core with adapters at composition roots](#effect-native-core-with-adapters-at-composition-roots)
  - [Rust at sharp runtime boundaries](#rust-at-sharp-runtime-boundaries)
  - [Declarative infrastructure with Alchemy, Waku, and Postgres](#declarative-infrastructure-with-alchemy-waku-and-postgres)
  - [Checked-in encrypted secrets with SOPS and age](#checked-in-encrypted-secrets-with-sops-and-age)
  - [Hermetic Nix environments, layered entrypoints, and multi-stack CI](#hermetic-nix-environments-layered-entrypoints-and-multi-stack-ci)
  - [Durable context ownership: `AGENTS.md` and ADRs](#durable-context-ownership-agentsmd-and-adrs)
- [Repository layout](#repository-layout)
- [Install](#install)
- [Usage](#usage)
- [Verification](#verification)
- [Contributing](#contributing)
- [License](#license)

## Conventions applied and why

### Repository root and the `ops/` boundary

- **Applied in:** [`ops/`](ops/README.md),
  [`ops/policies/repo-root/allowed`](ops/policies/repo-root/allowed),
  [`.config/`](.config/dependency-cruiser.cjs),
  [ADR 0001](docs/adr/0001-keep-ops-as-the-operational-boundary.md)
- **Convention:** `ops/` owns the operational life of the repository: operator
  commands (`ops/bin/`), container recipes (`ops/container/`), local Compose
  stacks (`ops/compose/`), dependency configs (`ops/config/`), deployment
  primitives (`ops/deploy/`), environment assembly (`ops/environments/`),
  encrypted secrets (`ops/secrets/`), observability (`ops/observability/`),
  machine Nix profiles (`ops/nix/`), and automated guardrails
  (`ops/policies/`). Source-adjacent configuration (`package.json`,
  `tsconfig.json`, `waku.config.ts`, `alchemy.run.ts`, schemas) stays beside the
  app or package that consumes it. `ops/policies/repo-root/allowed` (`bun run lint:root`)
  allowlists top-level files; tool configs that do not require the root live in
  `.config/`.
- **Why:** Repositories accumulate operational files across environments long
  after the source layout settles. Separating "what configures the code" from
  "what operates the system" gives humans and agents a single routing rule and
  prevents both app directories and the repo root from turning into a junk
  drawer.

### Deep modules and enforced package boundaries

- **Applied in:** [`.config/dependency-cruiser.cjs`](.config/dependency-cruiser.cjs),
  [`packages/tooling/src/organization.ts`](packages/tooling/src/organization.ts),
  [`packages/agent-core/src/index.ts`](packages/agent-core/src/index.ts),
  [ADR 0008](docs/adr/0008-enforce-package-boundaries.md)
- **Convention:** Every workspace under `packages/*` is a deep module whose sole
  public surface is `src/index.ts` (exported as `.`). Apps (`apps/*`), sibling
  packages, and even a package's own `test/` suite import packages exclusively
  through their entry points—never `src/` internals. `dependency-cruiser` runs
  inside `bun run check` to enforce the graph: nothing outside `apps/` imports
  `apps/`, `internal` packages (`sandbox-client`, `web-core`) cannot depend on
  `service` packages (`agent-*`, `infra`), the `tooling` leaf depends on no
  workspace package, `test/` fixtures stay private to tests, and circular
  dependencies fail the build. Intra-package imports use `#*` (`"./src/*"`)
  instead of `../`, and Oxlint enforces role-based file casing (`PascalCase` in
  `models/`, `services/`, `adapters/`, `components/`; `kebab-case` in
  `workflows/`, `policies/`, `utils/`).
- **Why:** Architectural boundaries that exist only in documentation decay.
  Enforcing entry-point privacy and dependency direction in `bun run check`
  keeps interfaces narrow, lets internals change without cascading edits, and
  forces tests to exercise observable public behavior rather than private
  helpers.

### One TypeScript toolchain: Bun, tsgo, and Vite+

- **Applied in:** [`package.json`](package.json),
  [`vite.config.ts`](vite.config.ts),
  [`packages/tooling/src/tsconfig.json`](packages/tooling/src/tsconfig.json),
  [ADR 0002](docs/adr/0002-use-bun-tsgo-oxc-and-prelude.md),
  [ADR 0010](docs/adr/0010-run-oxc-and-vitest-through-vite-plus.md)
- **Convention:** Bun (`packageManager` pinned in `package.json`) manages
  workspaces, installs, and script execution. Shared dependency versions are
  pinned once at the workspace root (with `overrides` aligning peer-coupled
  `@effect/*`, `vite`, and `vitest` packages across transitive trees), while
  internal packages link via `workspace:*` (`@repo/*`). Typechecking uses
  TypeScript 7 (`tsgo`) patched with `@effect/tsgo` via `bun run prepare`.
  [`vite.config.ts`](vite.config.ts) is the single configuration file for
  linting (`vp lint` / Oxlint), formatting (`vp fmt` / Oxfmt at 80 columns with
  sorted `package.json` keys), and testing (`vp test run` / Vitest—never
  `bun test`).
- **Why:** Native Go and Rust tooling keeps typecheck, lint, and format passes
  fast enough for humans and agents to run continuously. Consolidating Oxlint,
  Oxfmt, and Vitest into `vite.config.ts` eliminates three drifting config files
  and ensures new repositories scaffolded with `vp create` match what CI
  validates here.

### Effect-native core with adapters at composition roots

- **Applied in:**
  [`packages/agent-core/`](packages/agent-core/src/services/AgentHarness.ts),
  [`packages/agent-demo/`](packages/agent-demo/src/index.ts),
  [`packages/agent-testkit/`](packages/agent-testkit/test/agent-harness.test.ts),
  [`apps/harnessd/src/orpc.ts`](apps/harnessd/src/orpc.ts),
  [`docs/10-effect-solutions.md`](docs/10-effect-solutions.md),
  [ADR 0005](docs/adr/0005-model-the-harness-with-effect.md),
  [ADR 0006](docs/adr/0006-keep-provider-and-process-adapters-at-the-edges.md),
  [ADR 0012](docs/adr/0012-build-agents-with-yielded-agent.md)
- **Convention:** Domain packages use `Effect` v4: `Schema.Class` and
  `Schema.TaggedClass` for data and wire contracts, `Context.Service` with
  package-qualified identifiers for capabilities, lowercase static layers
  (`layer`, `layerMemory`), and `Config` providers (`node/no-process-env` is an
  error in `vite.config.ts`). Layers capture their dependencies once so public
  operations expose `R = never`. Agents are built on `@yielded/agent`
  (`Agent.make`, `AgentRuntime`, and native `effect/ai` `Tool`, `Toolkit`, and
  `LanguageModel`) rather than hand-rolled model loops, and typed RPC surfaces
  use `effect-orpc` (`eos` + `ORPCTaggedError`). Provider SDKs, HTTP servers,
  CLI parsing, and UI callbacks stay at `apps/*` composition roots
  (`BunRuntime.runMain` for CLI and daemon; one lifecycle-bound `ManagedRuntime`
  for Tauri and Waku), all consuming the shared `DemoHarnessLayer`. Tests run
  real Effects via `@effect/vitest` (`it.effect`) and swap layers
  (`ScriptedModel`) without module mocks.
- **Why:** Modeling capabilities, configuration, and recoverable errors in
  Effect turns architectural seams into compiler-checked contracts without
  leaking environment requirements to callers. Quarantining SDKs and I/O
  runtimes at the edges lets CLI, HTTP, desktop, and deterministic tests execute
  the exact same core logic without live credentials or network access.

### Rust at sharp runtime boundaries

- **Applied in:**
  [`crates/agent-sandboxd/`](crates/agent-sandboxd/src/supervisor.rs),
  [`packages/sandbox-client/`](packages/sandbox-client/src/index.ts),
  [ADR 0007](docs/adr/0007-use-rust-for-bounded-process-supervision.md)
- **Convention:** Subprocess execution lives in a focused Rust crate
  (`agent-sandboxd`) behind a tagged NDJSON schema contract owned by
  `packages/sandbox-client`. The daemon enforces wall-clock deadlines, retains
  bounded stdout/stderr prefixes, and kills Unix process groups cleanly—and is
  named and documented as a process supervisor, not a security sandbox.
- **Why:** Unbounded child output, orphaned subprocesses, and Unix process-group
  teardown are sharp OS edges better handled in Rust, while TypeScript keeps a
  typed protocol boundary. Stating the non-goal (isolation belongs in an outer
  sandbox) keeps security assumptions honest.

### Declarative infrastructure with Alchemy, Waku, and Postgres

- **Applied in:** [`apps/web/alchemy.run.ts`](apps/web/alchemy.run.ts),
  [`packages/infra/alchemy.run.ts`](packages/infra/alchemy.run.ts),
  [`ops/README.md`](ops/README.md),
  [ADR 0004](docs/adr/0004-compose-infrastructure-with-alchemy.md),
  [ADR 0011](docs/adr/0011-deploy-the-web-app-with-waku-and-its-own-stack.md)
- **Convention:** Deployable infrastructure is declared in TypeScript with
  [Alchemy](https://alchemy.run) as a resource composition root, never inside
  application domain code. Shared harness resources live in `packages/infra`,
  while `apps/web` owns an independent `Cloudflare.Website.Waku` stack beside
  its source and builds the same Waku app through its Node adapter for
  self-hosted Bun, Nix, Docker, and Kubernetes targets. Postgres (`kysely` +
  `pg` or `@effect/sql-pg`; shared dev cluster via Bytebase, dedicated
  CloudNativePG in production) is the default application data store; D1 in
  `packages/infra` is strictly a Cloudflare-local demo resource.
- **Why:** App-owned Alchemy stacks keep `alchemy dev` fast and deployments
  independent without provisioning unrelated queues or Workers. Running one Waku
  codebase across Cloudflare Workers and self-hosted containers avoids
  maintaining two web servers, and defaulting to Postgres avoids coupling
  application persistence to edge-only SQLite constraints.

### Checked-in encrypted secrets with SOPS and age

- **Applied in:** [`.sops.yaml`](.sops.yaml),
  [`ops/secrets/`](ops/secrets/README.md),
  [`apps/web/src/worker-env.ts`](apps/web/src/worker-env.ts),
  [ADR 0003](docs/adr/0003-store-deploy-time-secrets-with-sops.md)
- **Convention:** Deploy-time and bootstrap secrets are committed encrypted in
  `ops/secrets/` using SOPS and `age` recipients declared in `.sops.yaml`
  (`encrypted_regex` encrypts secret fields while keeping keys reviewable).
  Plaintext `.env*` files, decrypted outputs, and `*.agekey` private keys are
  gitignored. Composition roots resolve secrets at deploy or startup time (via
  `alchemy-sops` for Workers or KSOPS in Kubernetes) and never expose decrypted
  values in domain code or status payloads.
- **Why:** Every repository should run and deploy from git without out-of-band
  `.env` handoffs, while keeping credentials encrypted at rest, diffable in pull
  requests, and confined to application edges.

### Hermetic Nix environments, layered entrypoints, and multi-stack CI

- **Applied in:** [`flake.nix`](flake.nix), [`nix/bun.nix`](nix/bun.nix),
  [`nix/prelude.nix`](nix/prelude.nix), [`justfile`](justfile),
  [`ops/container/web/image.nix`](ops/container/web/image.nix),
  [`.github/workflows/ci.yaml`](.github/workflows/ci.yaml),
  [ADR 0002](docs/adr/0002-use-bun-tsgo-oxc-and-prelude.md),
  [ADR 0009](docs/adr/0009-validate-every-supported-stack-in-ci.md)
- **Convention:** `flake.nix` (`flake-parts`) provides the hermetic devshell,
  `nix/bun.nix` (`bun2nix`) locks Bun dependencies for offline Nix builds, and
  `ops/container/web/image.nix` streams the production OCI image without a
  Docker daemon. It is the only image recipe: the local Compose stacks run the
  same image, loaded with `just container-image`. `package.json` scripts are the canonical non-interactive
  command surface for CI and agents; Prelude (`x`) and `just` wrap those exact
  scripts for interactive discovery and devshell enforcement. CI installs with
  `--frozen-lockfile --ignore-scripts`, runs explicit `bun run prepare`, and
  validates TypeScript, Rust, `nix flake check` (including template slices and
  an end-to-end web smoke test), and Compose config on every change.
- **Why:** Keeping `package.json` as the single command contract with thin human
  wrappers prevents drift between interactive shells, headless agents, and CI.
  Disabling lifecycle scripts during install makes patching explicit, and
  checking every stack on every PR ensures Rust, Nix, containers, and flake
  slices never rot behind a green TypeScript test run.

### Durable context ownership: `AGENTS.md` and ADRs

- **Applied in:** [`AGENTS.md`](AGENTS.md), [`docs/adr/`](docs/adr/README.md),
  [`docs/architecture.md`](docs/architecture.md)
- **Convention:** Always-on operational rules for agents and contributors stay
  concise in `AGENTS.md`. Cross-cutting architectural, security, and toolchain
  choices live as numbered, append-mostly records in `docs/adr/`, superseded
  explicitly (see [ADR 0011](docs/adr/0011-deploy-the-web-app-with-waku-and-its-own-stack.md)
  and [ADR 0012](docs/adr/0012-build-agents-with-yielded-agent.md)) rather than
  silently rewritten when conventions change.
- **Why:** Agents need short, high-signal rules in every session, while humans
  and future maintainers need the durable "why" behind non-obvious constraints
  so settled trade-offs are not repeatedly re-litigated.

## Repository layout

| Path                                | Purpose                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `apps/cli/`                         | Effect CLI entrypoint and terminal rendering boundary                                                                           |
| `apps/harnessd/`                    | Typed HTTP API, OpenAPI server, and `effect-orpc` example on Bun                                                                |
| `apps/native/`                      | Tauri desktop shell with one lifecycle-managed Effect runtime                                                                   |
| `apps/web/`                         | Waku status/metrics app with its own Cloudflare Alchemy stack                                                                   |
| `packages/agent-core/`              | `@yielded/agent` definition, run schemas, and `AgentHarness`                                                                    |
| `packages/agent-demo/`              | Deterministic, credential-free model and tool layer for apps                                                                    |
| `packages/agent-runtime/`           | Supervised `Shell` tool and harness layer for provider runs                                                                     |
| `packages/agent-testkit/`           | `ScriptedModel` and deterministic `Echo` tool test layers                                                                       |
| `packages/infra/`                   | Shared Cloudflare resource graph composed with Alchemy                                                                          |
| `packages/sandbox-client/`          | Effect Schema NDJSON contract shared with the Rust supervisor                                                                   |
| `packages/web-core/`                | Framework-independent config, status, and Prometheus helpers                                                                    |
| `packages/tooling/`                 | Shared `tsconfig`, Oxc config, and filename organization rules                                                                  |
| `crates/agent-sandboxd/`            | Bounded Rust NDJSON process supervisor                                                                                          |
| `crates/alloy-web3-example/`        | Alloy HTTP provider and `sol!` contract interface example                                                                       |
| `crates/cloudflare-worker-example/` | Rust (`workers-rs`) Cloudflare Worker deployed by `packages/infra`                                                              |
| `contracts/`                        | Foundry Solidity project with `Counter` contract and forge tests                                                                |
| `flake.nix`, `nix/`                 | Flake-parts outputs, Prelude menu (`x`), `bun2nix` lock, slices                                                                 |
| `ops/`                              | Containers, Compose, K8s overlays, SOPS secrets, observability                                                                  |
| `docs/`                             | [Architecture guide](docs/architecture.md), [Effect/Alchemy notes](docs/10-effect-solutions.md), and [ADRs](docs/adr/README.md) |
| `AGENTS.md`                         | Always-on contributor and coding-agent rules for this repository                                                                |

To trace the Effect and boundary conventions in code, start with
[`packages/agent-core/src/services/HarnessAgent.ts`](packages/agent-core/src/services/HarnessAgent.ts)
and
[`packages/agent-core/src/services/AgentHarness.ts`](packages/agent-core/src/services/AgentHarness.ts),
then read
[`packages/agent-testkit/test/agent-harness.test.ts`](packages/agent-testkit/test/agent-harness.test.ts).
The test is the shortest executable explanation of the design.

## Install

### Work in this repository

Enter the pinned Nix devshell (or run `direnv allow`) and install workspace
dependencies:

```sh
nix develop
bun install
```

### Bootstrap a new project from a template slice

To scaffold a new repository from a maintained library slice without copying
demo apps or deployment stacks, run in an empty directory:

```sh
nix flake init -t github:darkmatter/template#nix-ts-lib
# Or: #nix-rust-lib / #nix-polyglot-lib
```

| Template               | Source slice                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `nix-ts-lib` (default) | `agent-core`, `agent-demo`, `agent-runtime`, `agent-testkit`, `sandbox-client`, `web-core`, and shared `tooling` packages |
| `nix-rust-lib`         | Workspace `Cargo.toml`/`Cargo.lock` and the Rust crates under `crates/`                                                   |
| `nix-polyglot-lib`     | Both slices above                                                                                                         |

[`nix/templates.nix`](nix/templates.nix) selects tracked paths directly from
this repository rather than maintaining duplicate template copies, and
[`nix/flake/default.nix`](nix/flake/default.nix) adapts the devshell to the
languages present (omitting `apps/` and app-only Prelude commands such as `x`
and `bun run dev`). Stage the files first so Nix and `ops/policies/repo-root`
can see them, then verify the slice you chose:

```sh
git init && git add .
nix develop

# TypeScript / polyglot slices:
bun install --frozen-lockfile --ignore-scripts && bun run prepare
bun run check && bun run test && bun run lint && bun run fmt:check

# Rust / polyglot slices:
cargo check --workspace && cargo test --workspace
```

To audit or bring an existing repository up to these conventions, invoke the
`darkmatter-repo-setup` agent skill, which reads `darkmatter/template` as its
canonical reference.

## Usage

Inside `nix develop`, run `x` for the interactive Prelude command picker (`just`
wraps the same commands from outside or inside the shell):

```sh
x dev
```

`x dev` runs `alchemy dev` for `apps/web`, serving the Waku app locally in
`workerd` on <http://localhost:3000> with `/api/status` and `/api/metrics`
(first run prompts for `alchemy login`). To build and run the same app on Bun
without a Cloudflare profile—matching the container and Kubernetes path—run:

```sh
bun run web
```

Run the deterministic agent harness from the CLI:

```sh
bun run cli run --events "Explain the harness boundaries"
```

Or start the long-lived HTTP daemon and submit the same run over its
schema-validated API (OpenAPI spec at <http://127.0.0.1:4319/openapi.json>):

```sh
bun run harnessd
curl -sS http://127.0.0.1:4319/runs \
  -H 'content-type: application/json' \
  -d '{"goal":"Explain the harness boundaries"}'
```

To layer encrypted configuration into `apps/web` after replacing the throwaway
recipient in [`.sops.yaml`](.sops.yaml) with your team `age` key (see
[`ops/secrets/README.md`](ops/secrets/README.md)):

```sh
export APP_SOPS_FILE="$PWD/ops/secrets/demo.sops.yaml"
bun run dev
```

## Verification

Run the full check suite across TypeScript, Rust, Solidity, Nix, and Compose
before claiming changes work:

```sh
bun run check
bun run lint:root
bun run test
bun run lint
bun run fmt:check
cargo check --workspace
cargo test --workspace
cargo fmt --all -- --check
forge test --root contracts
nix flake check
docker compose -f ops/compose/local.yaml config
```

After changing `package.json` dependencies, regenerate [`nix/bun.nix`](nix/bun.nix)
with `bun run generate:bun-nix`.

## Contributing

Changes to `template` change the baseline that new and audited Darkmatter
repositories inherit:

- Update the working code, automated check or policy, and [`AGENTS.md`](AGENTS.md)
  together when a convention changes.
- Record durable cross-cutting decisions in [`docs/adr/`](docs/adr/README.md);
  supersede accepted ADRs rather than rewriting history in place.
- Never commit decrypted SOPS files, plaintext `.env` files, or `age` private
  keys.

## License

UNLICENSED — Private Darkmatter reference repository.
