import { AgentHarness, type RunFailure, RunRequest } from "@repo/agent-core";
import { DemoHarnessLayer } from "@repo/agent-demo";
import { Identifiers } from "@yielded/agent";
import { Context, Effect, Layer, Ref, Schema } from "effect";

const increment = (value: number) => value + 1;

export class DemoReply extends Schema.Class<DemoReply>("native/DemoReply")({
  message: Schema.String,
  turn: Schema.Natural,
}) {}

export class DemoAgent extends Context.Service<
  DemoAgent,
  {
    readonly respond: (goal: string) => Effect.Effect<DemoReply, RunFailure>;
  }
>()("@agent-demo/native/DemoAgent") {
  static readonly layerDemo = Layer.effect(
    DemoAgent,
    Effect.gen(function* () {
      const harness = yield* AgentHarness;
      const turns = yield* Ref.make(0);

      const respond = Effect.fn("DemoAgent.respond")(function* (goal: string) {
        const turn = yield* Ref.updateAndGet(turns, increment);
        const report = yield* harness.run(
          new RunRequest({
            goal,
            runId: Identifiers.RunId.make(`desktop-${turn}`),
          }),
        );

        return new DemoReply({ message: report.summary.answer, turn });
      });

      return DemoAgent.of({ respond });
    }),
  ).pipe(Layer.provide(DemoHarnessLayer));
}
