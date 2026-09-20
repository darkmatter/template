import { Config, Context, Effect, Layer, Schema } from "effect";

const MaxSteps = Schema.Int.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(64),
);

export class HarnessConfig extends Context.Service<
  HarnessConfig,
  {
    readonly maxSteps: number;
    readonly systemPrompt: string;
  }
>()("@repo/agent-core/services/HarnessConfig") {
  static readonly layer = Layer.effect(
    HarnessConfig,
    Effect.gen(function* () {
      const maxSteps = yield* Config.schema(MaxSteps, "AGENT_MAX_STEPS").pipe(
        Config.withDefault(8),
      );
      const systemPrompt = yield* Config.string("AGENT_SYSTEM_PROMPT").pipe(
        Config.withDefault("Solve the goal with the smallest useful toolset."),
      );

      return HarnessConfig.of({ maxSteps, systemPrompt });
    }),
  );

  static readonly layerDemo = Layer.succeed(
    HarnessConfig,
    HarnessConfig.of({
      maxSteps: 4,
      systemPrompt: "You are the deterministic demo agent.",
    }),
  );
}
