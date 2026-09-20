import {
  AgentHarness,
  type AgentError,
  RunReport,
  RunRequest,
} from "@repo/agent-core";
import { Context, Effect, Layer, Semaphore } from "effect";

import { RunRejected } from "#api.ts";
import { RunIds } from "#run-ids.ts";

const failureReason = (error: AgentError): string => {
  switch (error._tag) {
    case "StepLimitExceeded":
      return `The run exceeded its ${error.limit}-step budget.`;
    case "ModelFailure":
    case "ToolDenied":
    case "ToolFailure":
      return error.reason;
  }
};

const toRunRejected = (error: AgentError) =>
  new RunRejected({
    kind: error._tag,
    reason: failureReason(error),
  });

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
        const id = yield* runIds.next;
        return yield* harness
          .run(new RunRequest({ goal, id }))
          .pipe(Effect.mapError(toRunRejected));
      });
      const run = Effect.fn("DemoRunner.run")((goal: string) =>
        gate.withPermit(runOne(goal)),
      );

      return DemoRunner.of({ run });
    }),
  );
}
