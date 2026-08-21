# Darkmatter Production-Ready Template

Bun + Effect web application with a deliberately structured operational
surface. This is the org reference for the preferred TypeScript toolchain
(Bun, tsgo, oxlint/oxfmt) and a Nix flake-parts + Prelude devshell, without
treating `ops/` as a junk drawer.

## Repository layout

| Path                 | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `apps/web/`          | Demo web app (`@ops-demo/web`) — Effect/Bun HTTP server          |
| `packages/web-core/` | Framework-independent domain logic (`@repo/web-core`)            |
| `packages/tooling/`  | Shared TypeScript and Oxc configuration (`@repo/tooling`)        |
| `flake.nix`          | Root flake — stays at root because Nix discovers flakes there    |
| `flake/`             | Thin public Nix-output layer (apps, checks, devShells, packages) |
| `nix/demo/`          | Nix package and smoke-check implementation                       |
| `nix/prelude.nix`    | Prelude command catalogue (`x` menu, MOTD, docs)                 |
| `ops/`               | Operational surface — see [ops/README.md](ops/README.md)         |
| `tests/`             | Cross-package smoke tests                                        |
| `docs/`              | Architecture and getting-started docs                            |
| `.github/workflows/` | CI pipeline                                                      |

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
  and oxlint via `effect-tsgo patch --no-typescript --oxlint`.
- Tests use Vitest: run `bun run test`, never `bun test`.
- Lint with oxlint (`bun run lint`). Format with oxfmt / `nix fmt`.
- Effect/TSGO style warnings are advisory outside intentionally Effect-owned
  code. Keep the tsconfig plugin name as `@effect/language-service`.
- oxlint enforces a 150-line max per file (blank lines and comments skipped).
  Split files that exceed this.
- oxfmt is configured at 80 print width and sorts `package.json` keys.
  Prettier is disabled in Zed — oxfmt is the only formatter.
- The root `bun run check` runs `tsc` then per-package `tsc --noEmit` for
  `@ops-demo/web` and `@repo/web-core`. New packages with a `typecheck`
  script should be added to this chain.

### Nix devshell

Enter the development shell with `nix develop` (or `direnv allow` for
automatic entry). Inside the shell:

- `x` — interactive command picker
- `x dev` — run the Effect/Bun demo server
- `x check` — tsgo typecheck
- `x test` — Vitest
- `x lint` — oxlint
- `x fmt` — treefmt (alejandra + oxfmt)
- `x install` — `bun install`
- `x ops:container-config` — validate the local Compose stack

The `justfile` provides `just` wrappers that enforce devshell entry
(`just check`, `just test`, `just dev`, `just fmt`, `just container-up`).

After changing `package.json` dependencies, regenerate the Nix lock:
`bun run generate:bun-nix` (runs `bun2nix -o bun.nix`).

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
- The root `package.json` `engines` requires Node >= 24; `packageManager`
  is `bun@1.3.14`.

## Application architecture

The application is intentionally small. `apps/web` serves a static front
page, a `/api/status` endpoint, and Prometheus-compatible `/api/metrics`
through Effect and Bun (`@effect/platform-bun`).

Domain helpers live in `packages/web-core` so they can be tested without
the HTTP server:

- `AppConfig` — Effect service reading `HOST`, `PORT`, `APP_ENV`,
  `APP_RELEASE`, and the optional redacted `DEMO_MESSAGE`; the web adapter can
  add a SOPS document behind environment config through `APP_SOPS_FILE`.
- `Metrics` — in-memory request counter with Prometheus text export.
- `Status` — typed status payload encoded via `Schema`.

The server composes these layers with `HttpRouter.serve` and launches via
`BunRuntime.runMain(Layer.launch(MainLive))`. Static files are served from
`APP_PUBLIC_DIR` (defaults to the packaged `public/` directory).

### Environments

`APP_ENV` accepts: `development`, `test`, `staging`, `production`.
`ops/environments/` composes the Kubernetes base from `ops/deploy/` per
environment with its own namespace, hostname, replicas, runtime config, and
image reference. Production uses a digest rather than a mutable image tag.

## Testing

- Unit tests live next to the code they test (`packages/web-core/test/`).
  They use `@effect/vitest` with `it.effect` and test layers.
- Smoke tests live in `tests/` and spawn the real server to verify the
  status API and front page end-to-end.
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
7. `nix flake check`
8. `docker compose -f ops/compose/local.yaml config`

All steps must pass. The `--ignore-scripts` install flag means no
postinstall scripts run in CI — the `prepare` step handles patching.

## Validation

Start narrow (the package or file you changed), then run the full suite:

```sh
bun run check
bun run test
bun run lint
bun run fmt:check
nix flake check
docker compose -f ops/compose/local.yaml config
```

- Never commit decrypted SOPS values or plaintext credentials.
- Preserve unrelated worktree changes and do not commit unless asked.
