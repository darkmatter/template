# Agent harness architecture

The dependency rule is simple: stable policy points inward; integrations point
in from the edges.

```text
apps/cli ─────┐
apps/harnessd ├──> agent-demo ──> agent-core <── agent-testkit
apps/native ──┘                       ^
                                      │
agent-runtime ────────────────────────┘
      │
sandbox-client
      │
agent-sandboxd (Rust process boundary)

apps/web ──> web-core (operational landing page)
```

## One run

1. `AgentHarness.run` records `RunStarted`.
2. `AgentModel.decide` returns the `UseTool | Finish` schema union.
3. A tool request is journaled before `ToolRunner.execute` crosses an adapter.
4. The result is journaled and becomes the next model context.
5. A final answer records `RunCompleted`; exceeding the configured bound fails
   with `StepLimitExceeded`.

The loop uses ordinary `if` and `for` control flow inside `Effect.gen`. The
types carry the semantics; extra combinators would make this particular state
machine harder to read.

## Boundaries

`packages/agent-core` owns serializable domain concepts and capability
interfaces. Its service implementations acquire dependencies while building
their layers, so `run`, `append`, and `execute` do not leak implementation
requirements to callers.

`packages/agent-runtime` is intentionally less stable. It translates an Effect
AI tool call to the core `ModelDecision`, validates unknown tool input once,
and maps provider or transport failures into domain errors. No other package
imports `effect/unstable/ai`.

`packages/agent-testkit` proves that layers are the substitution mechanism. A
scripted model and fake tool runner exercise the real harness and journal under
`@effect/vitest` without network access.

`packages/agent-demo` is distinct from the testkit: it is a provider-free,
runtime-safe composition shared by the three user-facing harness entrypoints.
Its model requests one schema-validated `DescribeHarness` tool, consumes the
typed result, and finishes. This makes the complete loop inspectable without a
credential or network call.

The demo journal is process-memory and bounds retained histories to 256 while
pinning active runs. A terminal append returns its immutable history atomically,
so a response cannot race cache eviction. `harnessd` caps concurrent runs at 64
and reports these limitations from `/status`; durable storage would replace the
journal layer rather than change the HTTP handlers or loop.

`crates/agent-sandboxd` accepts one tagged NDJSON command per line. It drains
stdout and stderr while retaining bounded prefixes, enforces a deadline, and
kills the process group on Unix. It does not provide filesystem, network,
syscall, or tenant isolation; a production system would run it inside a real
sandbox and add an allowlist above `ToolRunner`.

## Composition roots

- Bun provides HTTP and config services at `apps/web/src/server.ts`.
- `apps/cli` owns argument parsing, terminal rendering, and Bun process exit.
- `apps/harnessd` owns the typed HTTP API, OpenAPI document, daemon config, and
  long-lived Bun server layer.
- The native app creates one `ManagedRuntime` and disposes it with the window.
- `packages/infra/alchemy.run.ts` declares cloud resources inside an Alchemy
  stack. Infrastructure does not reach into the harness domain.

The existing `ops/`, Nix, container, and environment layout continues to own
the operational life of the demo rather than becoming source-adjacent config.
