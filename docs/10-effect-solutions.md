# Canonical Effect and Alchemy choices

This repository pins `effect@4.0.2`, the stable Effect v4 line. Modules that
were under `effect/unstable/*` during the beta are stable subpaths now
(`effect/ai`, `effect/cli`, `effect/http`, `effect/http-api`), and constructors
are capitalized (`Config.String`, `Flag.Boolean`, `Schema.TaggedError`).

## Effect conventions used here

- Services extend `Context.Service` and use package-qualified identifiers.
- Primary layers are lowercase (`layer`, `layerMemory`, `layerDemo`,
  `layerNoDeps`), not legacy `Live` or `Default` classes.
- A layer acquires dependencies once and captures them in named `Effect.fn`
  operations. Public operations normally have `R = never`.
- Domain data uses `Schema.Class`; protocol variants use `Schema.TaggedClass`
  and `Schema.Union`; recoverable boundary failures use tagged schema errors.
- Configuration stays in `Config` and provider layers. Domain code never reads
  `process.env`.
- Execution happens at application edges: `BunRuntime.runMain` for the server
  and one lifecycle-managed `ManagedRuntime` for desktop callbacks.
- `@effect/vitest` runs Effects directly with a fresh test scope. Test layers
  replace capabilities without mocking modules.
- Generator control flow is preferred when it makes the state machine clearer.

The patterns were cross-checked against the official Effect repository and the
Effect Solutions example catalogue. The AI import stays isolated in
`agent-runtime` so provider changes do not spread into the domain.

## Alchemy conventions used here

Alchemy is a resource graph and deployment composition root in this demo. The
stack is intentionally small: construct `Scope`, call `Stack`, declare named
resources, and return their outputs. Resource Effects receive provider and state
through layers assembled by Alchemy; application code does not invoke the
Alchemy runtime.

The repository uses `alchemy@2.0.0-beta.81`. `alchemy-sops@0.9.0` still declares
an exact `alchemy@2.0.0-beta.70` peer, so installs warn about it; the SOPS
config test covers the integration until `alchemy-sops` widens that range. The
existing D1 resource in `packages/infra` is retained as a Cloudflare-local demo
artifact, not as the preferred application data store.

Alchemy's experimental agent resource is not used: the agent lives in Effect,
while Alchemy declares only deployable infrastructure.

## Preferred library conventions

Darkmatter TypeScript apps should treat this template's root catalog as the
preferred-libs reference. New typed RPC surfaces should use `effect-orpc`
(`1.0.0` and later support Effect v4), with compatible `@orpc/server`,
`@orpc/client`, `@orpc/contract`, and `@orpc/shared` peers.
The harness daemon keeps its stable Effect HTTP API and adds a small
`apps/harnessd/src/orpc.ts` example showing `eos.provide(...).errors(...).effect`
with `ORPCTaggedError`.

Postgres is the preferred data store for app persistence. Use `kysely` + `pg`
for query builders and/or `@effect/sql-pg` for Effect-native SQL services.
Do not model D1 or SQLite as the default path for new Darkmatter apps; keep them
only for existing Cloudflare-local demos or explicit legacy compatibility.

## Primary references

- <https://www.effect.website/docs/v4/requirements-management/services/>
- <https://www.effect.website/docs/v4/requirements-management/layers/>
- <https://www.effect.website/docs/v4/schema/classes/>
- <https://www.effect.website/docs/v4/code-style/guidelines/>
- <https://github.com/utopyin/effect-orpc>
- <https://github.com/Effect-TS/effect/blob/de2a9a69099993087e57c64df58537c765ac0224/LLMS.md>
- <https://alchemy.run/infrastructure-as-code/stack/>
- <https://alchemy.run/infrastructure-as-code/resource/>
