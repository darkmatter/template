# Agent Instructions

## Tooling

- Enter the Nix shell before project commands: `nix develop`.
- Materialize dependencies explicitly with `bun install --frozen-lockfile`; the shell hook must stay dependency-free.
- Run `x typecheck` and `x test` before handing off TypeScript changes.
- The `prepare` script patches TypeScript-Go through `@effect/tsgo`; `tsc` is the single type-check path. Do not add a separate `tsgo` command or an unpatched `tsc` alternative.

## Effect

[Effect Solutions](https://www.effect.solutions/) is the canonical live reference for effectful TypeScript. Apply these rules to I/O, services, configuration, resource lifecycles, external clients, process boundaries, and tests; keep trivial pure domain transformations as ordinary TypeScript.

- Sequence effects with `Effect.gen`; name public or reusable effectful operations with `Effect.fn`; compose retries, timeouts, spans, and logging through `.pipe(...)`.
- Define dependencies with `Context.Service`, unique `@app/...` identifiers, readonly service members, and named `Layer` implementations. Keep dependencies in layers, not service-method environment types or mutable process state.
- Treat `Schema` as the source of truth at data boundaries: define runtime validation, serialization, and static types once. Brand semantic primitives and use tagged variants with exhaustive matching where applicable.
- Model recoverable domain failures with `Schema.TaggedErrorClass<Self>()("Tag", fields)` and recover by tag. Reserve defects for broken invariants or unrecoverable startup failures; wrap unknown third-party failures with `Schema.Defect`.
- Read configuration through typed `Config` services/layers, validate with `Config.schema`, redact secrets, and provide deterministic test layers.

Follow the upstream chapters for [basics](https://www.effect.solutions/basics), [services and layers](https://www.effect.solutions/services-and-layers), [data modeling](https://www.effect.solutions/data-modeling), [errors](https://www.effect.solutions/error-handling), [configuration](https://www.effect.solutions/config), and [testing](https://www.effect.solutions/testing). The current upstream Project Structure and Service `use` pattern chapters are exploratory, not local policy.

## Tests

- Use `@effect/vitest` for Effect programs. `it.effect` is the default; reserve `it.live` for genuine live-clock behavior.
- Use the adapter's `assert` helpers, provide layers explicitly, and use `TestClock` for deterministic time.
- Keep tests behavioral. Do not mock Effect plumbing or test incidental implementation details.
