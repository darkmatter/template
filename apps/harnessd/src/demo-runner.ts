import {
  AgentHarness,
  type RunFailure,
  RunReport,
  RunRequest,
} from "@repo/agent-core";
import { Context, Effect, Layer, Semaphore } from "effect";

import { RunRejected } from "#api.ts";
import { RunIds } from "#run-ids.ts";

const toRunRejected = (failure: RunFailure) =>
  new RunRejected({ kind: failure.errorTag, reason: failure.message });

export class DemoRunner extends Context.Service<
  DemoRunner,
  {
    readonly run: (goal: string) => Effect.Effect<RunReport, RunRejected>;
  }
>()("@agent-demo/harnessd/DemoRunner") {
  static readonly layerNoDeps = Layer.effect(
    DemoRunner,
    Effect.gen(function* () {
      const harness = yield* AgentHarness;
      const runIds = yield* RunIds;
      const gate = yield* Semaphore.make(64);

      const runOne = Effect.fn("DemoRunner.runOne")(function* (goal: string) {
        const runId = yield* runIds.next;
        return yield* harness
          .run(new RunRequest({ goal, runId }))
          .pipe(Effect.mapError(toRunRejected));
      });
      const run = Effect.fn("DemoRunner.run")((goal: string) =>
        gate.withPermit(runOne(goal)),
      );

      return DemoRunner.of({ run });
    }),
  );
}
