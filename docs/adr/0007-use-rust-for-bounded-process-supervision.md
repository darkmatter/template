# 0007 — Use Rust for bounded process supervision

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** Cooper Maruyama

## Context

The template's Effect harness architecture includes a Rust process boundary:
`docs/architecture.md` shows `sandbox-client` talking to
`agent-sandboxd (Rust process boundary)`. The same doc states that
`crates/agent-sandboxd` accepts one tagged NDJSON command per line, drains
stdout and stderr while retaining bounded prefixes, enforces a deadline, and
kills the process group on Unix. It also explicitly warns that the supervisor is
not filesystem, network, syscall, or tenant isolation.

`packages/sandbox-client` owns the TypeScript schema contract, while
`crates/agent-sandboxd/src/protocol.rs` implements the tagged JSON wire format
in Rust with bounded output fields and timeout metadata.

## Decision

Use Rust for the bounded process supervisor crate in the existing top-level
Cargo workspace. Communicate with TypeScript through a small schema-backed
NDJSON protocol owned by `packages/sandbox-client` and implemented by
`crates/agent-sandboxd`.

Treat the Rust daemon as a process supervisor, not a security sandbox. Any
future production isolation must be layered outside or above it.

## Why

Process supervision is a sharp runtime edge: output can grow without bound,
children can outlive their caller, and Unix process groups need careful cleanup.
A small Rust daemon gives that edge a focused implementation while the
TypeScript harness talks to it through a typed protocol.

Keeping the daemon in the existing Cargo workspace makes Rust validation and
dependency policy straightforward for adopters. Calling it a supervisor rather
than a sandbox keeps its security guarantees honest.

## Trade-offs

The process edge can use Rust's process-control and Unix process-group behavior
while the TypeScript harness keeps a typed protocol boundary. Output and
deadline limits are enforced close to the child process.

The cost is a second language stack and a protocol boundary that must stay in
sync. Contributors must not overstate the safety properties of the daemon just
because it is named like a sandbox.
