# Effect-first TypeScript template

**Status:** Approved design  
**Date:** 2026-08-06

## Context

The template exposes `x test`, but it currently runs Bun's native test runner. That runner cannot execute the `@effect/vitest` integration. The template also has no TypeScript package contract or durable guidance for how Effectful application code should be structured.

[Effect Solutions](https://www.effect.solutions/) is the chosen live, canonical reference for idiomatic Effect TypeScript. The template must standardize its stable concepts without copying its documentation or pinning its documentation CLI as an application dependency.

## Goals

- Make Vitest the test runner behind `x test` and make `@effect/vitest` work in a fresh generated repository.
- Make Effect Solutions the core reference for effectful TypeScript in generated repositories.
- Give agents and humans concise, local, enforceable rules with links to the current upstream guide.
- Seed strict TypeScript-Go diagnostics, Effect's TypeScript-Go integration, and a deterministic test contract.
- Preserve ordinary TypeScript for pure domain transformations; do not force Effect into trivial pure code.
- Keep dependency versions compatible and reproducible through Bun's lockfile.

## Non-goals

- Vendor or fork Effect Solutions documentation.
- Add the `effect-solutions` CLI as a project dependency. Its own Effect version line is independent of the application and would be documentation-only dependency surface.
- Prescribe HTTP, CLI, or database implementations before the generated project has those boundaries.
- Treat the guide's draft chapters as mandatory standards.
- Generate a fake application merely to demonstrate every Effect feature.

## Authority and policy boundary

A new root `AGENTS.md` will make the live [Effect Solutions guide](https://www.effect.solutions/) the primary implementation reference for **effectful application code**:

- external I/O and platform APIs;
- services, dependency injection, and resource lifecycles;
- configuration and secret handling;
- external data boundaries and typed errors; and
- Effect-based tests.

Pure calculations and immutable domain transformations remain ordinary TypeScript. This boundary keeps Effects explicit at application edges rather than turning a simple utility into needless infrastructure.

The local policy will link to the applicable upstream chapters and codify these stable rules:

1. Sequence effects with `Effect.gen`; name public or reusable effectful operations with `Effect.fn`; add retries, timeouts, spans, and related cross-cutting behavior with `.pipe(...)`.
2. Model dependencies with `Context.Service`, unique `@app/...` identifiers, readonly service members, and named `Layer` implementations. Keep dependencies in layers rather than in service-method environment types.
3. Use `Schema` as the single source of truth at data boundaries: schemas define runtime validation, serialization, and static types. Brand semantic primitives and use tagged variants with exhaustive matching where applicable.
4. Represent recoverable domain failures with `Schema.TaggedErrorClass<Self>()("Tag", fields)`, recover by tag, use defects only for broken invariants or unrecoverable startup failures, and wrap unknown third-party failures with `Schema.Defect`.
5. Load configuration through typed `Config` services/layers, validate with `Config.schema`, redact secrets, and supply deterministic test layers instead of mutable process state.
6. Use `@effect/vitest` for Effect programs: `it.effect` is the default; use its `assert` helpers in Effect tests; `it.live` is reserved for genuine live-clock behavior; test layers are provided explicitly; TestClock is used for deterministic time.

The current upstream **Project Structure** and **Service `use` pattern** chapters are marked draft. `AGENTS.md` will point to them as exploratory references, not normative rules. HTTP and CLI guidance is conditional on a project actually having those boundaries.

## Template artifacts

### Runtime and developer contract

Add a root `package.json` with an ESM package contract and these categories:

- `effect@beta` as the runtime dependency and `@effect/vitest@beta` as a development dependency. They must stay on the same Effect v4 beta line; unqualified `effect` resolves the incompatible v3 `latest` tag.
- `vitest@^4.1.0`, `@effect/tsgo`, and TypeScript 7 as development dependencies. `@effect/tsgo` is Effect's TypeScript-Go integration and is resolved with the native TypeScript compiler through the committed Bun lockfile.
- `prepare` runs `effect-tsgo patch` so the native TypeScript compiler receives Effect diagnostics after every install.
- `test` runs `vitest run`; `test:watch` runs `vitest`; `typecheck` runs `tsc --noEmit -p tsconfig.json` through the TypeScript-Go compiler patched by `effect-tsgo`.

Use Bun to resolve these dependencies and commit `bun.lock`. `bun run` resolves both pinned package scripts and local `node_modules/.bin` executables; do not use `bunx` as the main test path because it may fall back to an unpinned auto-install rather than the lockfile.

### TypeScript and test configuration

Add `tsconfig.json` with exactly these template-level compiler options:

- `"target": "ES2022"`, `"module": "NodeNext"`, and `"moduleDetection": "force"` for the bare Bun/Node ESM template;
- `"verbatimModuleSyntax": true` and `"rewriteRelativeImportExtensions": true`;
- `"strict": true`, `"exactOptionalPropertyTypes": true`, `"noUnusedLocals": true`, and `"noImplicitOverride": true`;
- `"skipLibCheck": true` and `"noEmit": true`; and
- the `@effect/language-service` plugin provided by `@effect/tsgo`, plus the local `./node_modules/@effect/tsgo/schema.json` schema.

This single-package template intentionally omits `incremental`, `composite`, `declaration`, `declarationMap`, and `sourceMap`: it only type-checks and does not emit declarations or maintain project-reference state. Bundled and monorepo projects can extend this baseline with the guide's project-specific settings.

Do not set a restrictive `include` list: TypeScript's default program discovery must type-check future application `.ts` files while excluding `node_modules`.

Add `vitest.config.ts` that explicitly includes `tests/**/*.test.ts`, matching the upstream testing guide.

Add `tests/effect.test.ts`, a minimal passing `it.effect` test using `assert` that verifies Effect's test context/TestClock. It proves the adapter and demonstrates the preferred test form without inventing application behavior.

### Nix and command surface

- Add Bun to the default Nix development shell.
- Change the existing `x test` command from `bun test` to `bun run test`.
- Add a `typecheck` entry to `nix/prelude.nix` with `exec = "bun run typecheck"` and a type-check description; leave the existing `x check = nix flake check` entry unchanged.
- Add a `.gitignore` entry for `node_modules/`.
- Extend `nix/README.md`'s existing `Getting Started` section with frozen Bun installation, test/type-check commands, and the Effect Solutions reference.

## Verification

The implementation is complete only when all of the following succeed:

1. `nix develop -c bun --version` proves the Nix development shell exposes Bun.
2. `nix develop -c bun install --frozen-lockfile` resolves the committed graph without modifying `bun.lock` and completes its `effect-tsgo patch` prepare hook.
3. `nix develop -c x typecheck` reaches the package `tsc --noEmit -p tsconfig.json` script and succeeds against the strict configuration with Effect diagnostics enabled.
4. `nix develop -c x test` runs Vitest, discovers the configured Effect test, and passes it.
5. `nix flake check` accepts the updated Nix template configuration.

## Sources

- [Effect Solutions](https://www.effect.solutions/)
- [Basics](https://www.effect.solutions/basics)
- [Services & Layers](https://www.effect.solutions/services-and-layers)
- [Data Modeling](https://www.effect.solutions/data-modeling)
- [Error Handling](https://www.effect.solutions/error-handling)
- [Config](https://www.effect.solutions/config)
- [Testing](https://www.effect.solutions/testing)
- [TypeScript Configuration](https://www.effect.solutions/tsconfig)

- [Effect TypeScript-Go](https://github.com/Effect-TS/tsgo)
