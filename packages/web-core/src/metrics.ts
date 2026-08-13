import { Context, Effect, Layer, Ref } from "effect";

export interface Snapshot {
  readonly requestCount: number;
}

export class Metrics extends Context.Service<
  Metrics,
  {
    readonly record: Effect.Effect<number>;
    readonly snapshot: Effect.Effect<Snapshot>;
    readonly prometheus: Effect.Effect<string>;
  }
>()("ops-demo/Metrics") {
  static readonly layer = Layer.effect(
    Metrics,
    Effect.gen(function* () {
      const count = yield* Ref.make(0);

      return Metrics.of({
        record: Ref.updateAndGet(count, (n) => n + 1),
        snapshot: Effect.map(Ref.get(count), (requestCount) => ({
          requestCount,
        })),
        prometheus: Effect.map(Ref.get(count), (requestCount) =>
          [
            "# HELP ops_demo_requests_total Requests handled by the demo application.",
            "# TYPE ops_demo_requests_total counter",
            `ops_demo_requests_total ${requestCount}`,
            "",
          ].join("\n"),
        ),
      });
    }),
  );
}
