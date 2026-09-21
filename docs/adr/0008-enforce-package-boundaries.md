# 0008 — Enforce package boundaries

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

Commits `43aef5f feat: enforce package boundaries with dependency-cruiser` and
`c8c2fe0 feat: add turbo boundaries and align oxlint with agents` made package
dependency direction executable. The root `turbo.json` defines boundary tags
for `app`, `service`, `internal`, and `leaf`. Workspace package `turbo.json`
files tag each app/package, and the root `package.json` check script runs both
`depcruise apps packages tests` and `turbo boundaries`.

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

## Consequences

The intended architecture is checked automatically instead of living only in
docs. Core and leaf packages stay reusable, services cannot reach into apps,
and app composition remains at the top of the graph.

The cost is a small amount of package metadata and occasional boundary friction.
When a dependency is rejected, contributors must either move code to the right
package or introduce a deliberate new boundary convention.

## Alternatives considered

- **Document boundaries without enforcing them.** Rejected because dependency
  drift is easy in a monorepo and hard to spot in review.
- **Use only TypeScript path aliases.** Rejected because aliases improve import
  ergonomics but do not express allowed dependency direction.
- **Allow packages to depend freely on apps.** Rejected because app entrypoints
  are composition roots, not reusable libraries.
