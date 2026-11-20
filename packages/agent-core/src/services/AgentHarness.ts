import {
  AgentRuntime,
  InMemory,
  type Identifiers,
  type Thread,
} from "@yielded/agent";
import { Context, Effect, Layer, Predicate } from "effect";
import type { Toolkit } from "effect/ai";

import {
  RunFailure,
  RunReport,
  RunSummary,
  type RunRequest,
} from "#domain/run.ts";

import { type HarnessAgent, makeHarnessAgent } from "./HarnessAgent.ts";
import { HarnessConfig } from "./HarnessConfig.ts";

// The failure union depends on the toolkit's handler errors, so it is read
// structurally: every yielded and Effect AI failure is a tagged error.
const toRunFailure = (runId: Identifiers.RunId) => (error: unknown) =>
  new RunFailure({
    errorTag:
      Predicate.hasProperty(error, "_tag") && typeof error._tag === "string"
        ? error._tag
        : "UnknownError",
    message:
      Predicate.hasProperty(error, "message") &&
      typeof error.message === "string"
        ? error.message
        : String(error),
    runId,
  });

// `InMemory.scoped` replaces the run's ThreadHistory with a disposable one
// owned by the shared in-memory Store.
type Requirements<Tools extends Toolkit.Any> =
  | AgentRuntime.AgentRuntimeRequirements<HarnessAgent<Tools>>
  | Thread.Store;

export class AgentHarness extends Context.Service<
  AgentHarness,
  {
    readonly run: (request: RunRequest) => Effect.Effect<RunReport, RunFailure>;
  }
>()("@repo/agent-core/services/AgentHarness") {
  /**
   * Run the harness agent for `toolkit` on yielded's in-memory runtime. Each
   * run owns a disposable Thread (`InMemory.scoped`), so a long-lived host
   * keeps no history after a run settles. The layer captures the model,
   * handler, and history services once; `run` has no requirements.
   */
  static readonly layer = <Tools extends Toolkit.Any>(toolkit: Tools) =>
    Layer.effect(
      AgentHarness,
      Effect.gen(function* () {
        const agent = makeHarnessAgent(toolkit);
        const config = yield* HarnessConfig;
        const context = yield* Effect.context<Requirements<Tools>>();

        const execute = Effect.fn("AgentHarness.execute")(function* (
          request: RunRequest,
        ) {
          const handle = yield* AgentRuntime.start(agent, request.goal, {
            runId: request.runId,
            turnAllowance: config.maxTurns,
          });
          const result = yield* handle.await;
          const events = yield* handle.events;
          const summary = new RunSummary({
            answer: result.output,
            runId: result.runId,
            threadId: result.threadId,
            turns: result.turns,
          });
          return new RunReport({ events, summary });
        });

        const run = Effect.fn("AgentHarness.run")(
          (request: RunRequest): Effect.Effect<RunReport, RunFailure> =>
            InMemory.scoped(execute(request)).pipe(
              Effect.mapError(toRunFailure(request.runId)),
              Effect.provideContext(context),
            ),
        );

        return AgentHarness.of({ run });
      }),
    );
}
