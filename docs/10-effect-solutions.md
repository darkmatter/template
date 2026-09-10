# Canonical Effect and Alchemy choices

This repository pins `effect@4.0.0-beta.102`. Current Effect v4 documentation
has moved into release-candidate builds, so the exact beta source and its guide
are the compile-time authority. In particular, this version spells schema
errors `Schema.TaggedErrorClass`; newer examples use `Schema.TaggedError`.

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

The patterns were cross-checked against the exact beta guide and examples in
the official Effect repository, plus the Effect Solutions example catalogue.
The unstable AI import is isolated because its versioning promise is different
from the stable core.

## Alchemy conventions used here

Alchemy is a resource graph and deployment composition root in this demo. The
stack is intentionally small: construct `Scope`, call `Stack`, declare named
resources, and return their outputs. Resource Effects receive provider and state
through layers assembled by Alchemy; application code does not invoke the
Alchemy runtime.

The repository uses `alchemy@2.0.0-beta.70` because it is the version matched by
the installed `alchemy-sops` peer range and because the checked examples for
that tag use the same D1 migration option as this stack.

Alchemy's experimental agent resource is not used: the agent lives in Effect,
while Alchemy declares only deployable infrastructure.

## Primary references

- <https://www.effect.website/docs/v4/requirements-management/services/>
- <https://www.effect.website/docs/v4/requirements-management/layers/>
- <https://www.effect.website/docs/v4/schema/classes/>
- <https://www.effect.website/docs/v4/code-style/guidelines/>
- <https://github.com/Effect-TS/effect/blob/de2a9a69099993087e57c64df58537c765ac0224/LLMS.md>
- <https://alchemy.run/infrastructure-as-code/stack/>
- <https://alchemy.run/infrastructure-as-code/resource/>
