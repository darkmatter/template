# 0002 — Use Bun, tsgo, Oxc, and Prelude

- **Status:** accepted
- **Date:** 2026-08-13
- **Deciders:** Cooper Maruyama

## Context

This template is TypeScript-heavy and includes multiple apps, packages, CI
checks, generated Nix inputs, and agent-facing commands. Adopting projects need
one non-interactive command vocabulary and one formatting/linting toolchain.

The root `package.json` uses Bun workspaces, `bun@1.3.14`, `tsc`/tsgo
typechecking, oxlint, and oxfmt. `AGENTS.md` records the standing rules: run
scripts with Bun, use `bun run check`, use Vitest via `bun run test`, lint with
oxlint, format with oxfmt, and avoid unpatched TypeScript 5 for the template
typecheck.

The Nix devshell includes Bun and exposes Prelude commands (`x check`,
`x test`, `x lint`, `x fmt`) so people and agents do not need to remember raw
tool invocations.

## Decision

Use Bun as the JavaScript runtime and package manager for this template. Use
tsgo through the template's patched TypeScript setup for typechecking, oxlint
for linting, and oxfmt/treefmt for formatting. Expose the common workflows
through Prelude commands in the Nix devshell.

Package scripts remain the canonical non-interactive command surface for CI and
agents. The devshell command picker is a convenience layer over those scripts,
not a second source of truth.

## Why

- **Use npm/pnpm with stock TypeScript and ESLint.** Rejected because this
  template already optimizes for Bun workspaces, tsgo, and Oxc-family tooling.
- **Make Nix commands the only interface.** Rejected because CI and agents need
  direct, non-interactive package scripts that work outside an interactive
  command picker.

## Trade-offs

The template has one fast TypeScript toolchain and one command vocabulary across
apps, packages, CI, and agents. The `prepare` script owns patching tsgo and
oxlint so CI can install with `--ignore-scripts`.

The cost is tighter coupling to Bun, Oxc, and the specific Effect/TypeScript
beta toolchain. Contributors cannot freely substitute npm, Jest, Prettier, or
plain upstream `tsc` without changing the template contract.
