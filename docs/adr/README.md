# Architecture Decision Records

Standing decisions about how this template pattern is structured and maintained.
Use ADRs for choices that cross-cut apps, packages, operational layout,
validation, or future template work — not for one-off implementation notes or
local examples.

## Current records

| ADR | Status | Decision |
| --- | --- | --- |
| [0001](0001-keep-ops-as-the-operational-boundary.md) | accepted | Keep `ops/` as the operational boundary |
| [0002](0002-use-bun-tsgo-oxc-and-prelude.md) | accepted | Use Bun, tsgo, Oxc, and Prelude |
| [0003](0003-store-deploy-time-secrets-with-sops.md) | accepted | Store deploy-time secrets with SOPS |
| [0004](0004-compose-infrastructure-with-alchemy.md) | accepted | Compose infrastructure with Alchemy |
| [0005](0005-model-the-harness-with-effect.md) | accepted | Model the harness with Effect |
| [0006](0006-keep-provider-and-process-adapters-at-the-edges.md) | accepted | Keep provider and process adapters at the edges |
| [0007](0007-use-rust-for-bounded-process-supervision.md) | accepted | Use Rust for bounded process supervision |
| [0008](0008-enforce-package-boundaries.md) | accepted | Enforce package boundaries |
| [0009](0009-validate-every-supported-stack-in-ci.md) | accepted | Validate every supported stack in CI |

## Format

One file per decision: `NNNN-kebab-case-title.md`. Numbers are zero-padded to
four digits and assigned in decision order.

Each ADR has the same shape (loosely [Nygard][nygard], [MADR][madr]):

```markdown
# NNNN — Title

- **Status:** proposed | accepted | superseded by ADR-XXXX | deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** github handles or names

## Context

What's the situation that forced a decision? What constraints are in play?
Write this for a teammate who will never see the original discussion. Do not
recap process history. State the situation so a first-time reader can apply the
decision.

## Decision

What did we decide. State it plainly.

## Why

Why this decision was made. Explain the rationale, including the meaningful
alternatives that were rejected.

## Trade-offs

What follows from this — both the upside and the costs we're accepting.
```

[nygard]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[madr]: https://adr.github.io/madr/

## When to write an ADR

- A naming, layout, or directory convention that contributors should follow.
- A choice between two reasonable approaches where the rationale will fade from
  memory.
- A constraint that is load-bearing for safety, secrets, validation, or
  distribution.
- A reversal — supersede the prior ADR rather than rewriting it.

## When NOT to write an ADR

- Implementation details inside a single app, package, crate, or contract.
- Temporary project state or task notes that do not need to survive review.
- Things still under debate — leave a `proposed` ADR draft, but do not accept
  it until the decision is real.
