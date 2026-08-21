import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { AppConfig, StatusSchema } from "./config.ts";
import { Metrics } from "./metrics.ts";

export type StatusPayload = typeof StatusSchema.Type;

export class Status extends Context.Service<
  Status,
  {
    readonly current: Effect.Effect<StatusPayload>;
  }
>()("ops-demo/Status") {
  static readonly layer = Layer.effect(
    Status,
    Effect.gen(function* () {
      const config = yield* AppConfig;
      const metrics = yield* Metrics;
      const encode = Schema.encodeUnknownEffect(StatusSchema);

      return Status.of({
        current: Effect.gen(function* () {
          const { requestCount } = yield* metrics.snapshot;
          return yield* encode({
            environment: config.environment,
            release: config.release,
            demoMessageConfigured: config.demoMessageConfigured,
            requestCount,
            status: "ok",
            timestamp: DateTime.formatIso(yield* DateTime.now),
          }).pipe(Effect.orDie);
        }),
      });
    }),
  );
}
