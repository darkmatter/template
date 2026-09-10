import { RunId } from "@repo/agent-core";
import { Context, Effect, Layer, Ref } from "effect";

export class RunIds extends Context.Service<
  RunIds,
  { readonly next: Effect.Effect<RunId> }
>()("@agent-demo/harnessd/RunIds") {
  static readonly layerMemory = Layer.effect(
    RunIds,
    Effect.gen(function* () {
      const sequence = yield* Ref.make(0);
      const next = Ref.updateAndGet(sequence, (value) => value + 1).pipe(
        Effect.map((value) => RunId.make(`harnessd-${value}`)),
      );

      return RunIds.of({ next });
    }),
  );
}
