import { Config, Context, Effect, Layer, Schema } from "effect";

/** Upper bound on model turns; `maxTurns` can only tighten it per run. */
export const harnessTurnCeiling = 64;

const MaxTurns = Schema.Int.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(harnessTurnCeiling),
);

export class HarnessConfig extends Context.Service<
  HarnessConfig,
  {
    readonly maxTurns: number;
    readonly systemPrompt: string;
  }
>()("@repo/agent-core/services/HarnessConfig") {
  static readonly layer = Layer.effect(
    HarnessConfig,
    Effect.gen(function* () {
      const maxTurns = yield* Config.schema(MaxTurns, "AGENT_MAX_TURNS").pipe(
        Config.withDefault(8),
      );
      const systemPrompt = yield* Config.String("AGENT_SYSTEM_PROMPT").pipe(
        Config.withDefault("Solve the goal with the smallest useful toolset."),
      );

      return HarnessConfig.of({ maxTurns, systemPrompt });
    }),
  );

  static readonly layerDemo = Layer.succeed(
    HarnessConfig,
    HarnessConfig.of({
      maxTurns: 4,
      systemPrompt: "You are the deterministic demo agent.",
    }),
  );
}
