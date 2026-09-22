# 0008 — Enforce package boundaries

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

The template is a monorepo with apps, services, internal packages, leaf
packages, and tests. Dependency direction has to be executable; otherwise,
reusable domain packages can quietly start depending on app composition roots.

The root `turbo.json` defines boundary tags for `app`, `service`, `internal`,
and `leaf`. Workspace package `turbo.json` files tag each app/package, and the
root `package.json` check script runs both `depcruise apps packages tests` and
`turbo boundaries`.

`AGENTS.md` describes the intended graph: only apps may depend on apps,
services may not depend on apps, internal packages may depend only on internal
and leaf packages, and leaf packages may not depend on other tagged packages.

## Decision

Use package tags plus dependency-cruiser/Turbo checks to enforce monorepo
dependency direction. Every workspace app or package declares its boundary tag
in a package-local `turbo.json`, and the root check command validates the graph.

New packages should use workspace/package imports (`@repo/*` and package `#`
imports) and fit the existing app/service/internal/leaf model rather than
creating informal cross-package dependencies.

## Why

Package boundaries are part of the template's architecture, so they need to be
checked the same way types and tests are checked. Tags give each workspace a
role, and dependency-cruiser/Turbo turn those roles into an executable graph.

That enforcement lets adopters scale the monorepo without relying on review
memory. App entrypoints remain composition roots, reusable packages stay
reusable, and path aliases stay an import convenience rather than the only
boundary mechanism.

## Trade-offs

The intended architecture is checked automatically instead of living only in
docs. Core and leaf packages stay reusable, services cannot reach into apps,
and app composition remains at the top of the graph.

The cost is a small amount of package metadata and occasional boundary friction.
When a dependency is rejected, contributors must either move code to the right
package or introduce a deliberate new boundary convention.
