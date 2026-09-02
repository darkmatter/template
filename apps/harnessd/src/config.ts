import { Config, Context, Effect, Layer } from "effect";

export class HarnessdConfig extends Context.Service<
  HarnessdConfig,
  {
    readonly host: string;
    readonly port: number;
  }
>()("@agent-demo/harnessd/HarnessdConfig") {
  static readonly layer = Layer.effect(
    HarnessdConfig,
    Effect.gen(function* () {
      const host = yield* Config.string("HARNESSD_HOST").pipe(
        Config.withDefault("127.0.0.1"),
      );
      const port = yield* Config.port("HARNESSD_PORT").pipe(
        Config.withDefault(4319),
      );

      return HarnessdConfig.of({ host, port });
    }),
  );
}
