# Agent harness architecture

The dependency rule is simple: stable policy points inward; integrations point
in from the edges. The agent loop itself is not ours: `@yielded/agent` runs it.

```text
apps/cli ─────┐
apps/harnessd ├──> agent-demo ──> agent-core <── agent-testkit
apps/native ──┘                       ^   │
                                      │   └──> @yielded/agent (runtime)
agent-runtime ────────────────────────┘
      │
sandbox-client
      │
agent-sandboxd (Rust process boundary)

apps/web ──> web-core (operational landing page)
```

## One run

1. `AgentHarness.run` starts the harness agent with `AgentRuntime.start`,
   passing the request's run ID and the configured turn allowance.
2. The yielded runtime renders the goal as the user message, asks the Effect AI
   `LanguageModel` for a turn, validates any tool call against the native
   `Tool` schema, and runs the toolkit handler.
3. Each step becomes a versioned yielded `RunEvent` (`RunStarted`,
   `ToolCallDeclared`, `ToolCallSucceeded`, `TurnCompleted`, `RunCompleted`,
   …).
4. A final text reply is decoded through the agent's output schema and returned
   as a `RunReport`: the run's events plus a summary. Exhausting the turn
   budget fails with `AgentPolicyError`, reported as `RunFailure`.

## Boundaries

`packages/agent-core` owns the harness agent definition (`makeHarnessAgent`:
goal in, text out, a turn and duration policy), its run schemas, and the
`AgentHarness` service. The service is generic over the toolkit only; its layer
captures the model, tool handlers, config, and history store, so `run` has no
environment requirement. Failures are reported as one `RunFailure` carrying the
failed error's `_tag` and `message`, because the full failure union depends on
the toolkit's handler errors.

Tools are native Effect AI `Tool`/`Toolkit` values and models are Effect AI
`LanguageModel` layers. They are the domain vocabulary, so any package that
declares a tool imports `effect/ai`. Provider SDKs (OpenAI, Anthropic, …) stay
at the composition root that supplies the model layer.

`packages/agent-runtime` holds the supervised `Shell` tool and
`ShellHarnessLayer`, the harness for that toolkit. An application supplies an
Effect AI provider model, `HarnessConfig`, `InMemory.layer`, and the `Sandbox`
client.

`packages/agent-testkit` proves that layers are the substitution mechanism. It
runs the real harness and yielded runtime with an `Echo` tool and yielded's
`ScriptedModel`, without network access.

`packages/agent-demo` is distinct from the testkit: it is a provider-free,
runtime-safe composition shared by the three user-facing harness entrypoints.
Its deterministic model reads the prompt. With no `DescribeHarness` result yet
it requests the tool for the goal; with one it answers from that result.

Every run owns a disposable yielded Thread (`InMemory.scoped`), so a
long-lived host keeps no conversation after a run settles. `harnessd` caps
concurrent runs at 64 and reports these limits from `/status`. Durable history
would replace `InMemory.layer` with a yielded persistent history or durable
host without changing the HTTP handlers.

`crates/agent-sandboxd` accepts one tagged NDJSON command per line. It drains
stdout and stderr while retaining bounded prefixes, enforces a deadline, and
kills the process group on Unix. It does not provide filesystem, network,
syscall, or tenant isolation; a production system would run it inside a real
sandbox and authorize `Shell` calls through yielded's tool authorization hook.

## Composition roots

- `apps/web/src/runtime.ts` holds one `ManagedRuntime` for the Waku app's
  server components and API routes; Waku owns HTTP, on a Cloudflare Worker or
  its Node adapter.
- `apps/cli` owns argument parsing, terminal rendering, and Bun process exit.
- `apps/harnessd` owns the typed HTTP API, OpenAPI document, daemon config, and
  long-lived Bun server layer.
- The native app creates one `ManagedRuntime` and disposes it with the window.
- `packages/infra/alchemy.run.ts` declares the harness's shared cloud
  resources inside an Alchemy stack; `apps/web/alchemy.run.ts` is the web
  app's own stack. Infrastructure does not reach into the harness domain.

The existing `ops/`, Nix, container, and environment layout continues to own
the operational life of the demo rather than becoming source-adjacent config.
