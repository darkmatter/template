import { Config, Context, Effect, Layer, Schema } from "effect";

export const environments = [
  "development",
  "test",
  "staging",
  "production",
] as const;
export type AppEnvironment = (typeof environments)[number];

export class AppConfig extends Context.Service<
  AppConfig,
  {
    readonly host: string;
    readonly port: number;
    readonly environment: AppEnvironment;
    readonly release: string;
  }
>()("ops-demo/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const host = yield* Config.string("HOST").pipe(
        Config.withDefault("0.0.0.0"),
      );
      const port = yield* Config.port("PORT").pipe(Config.withDefault(3000));
      const environment = yield* Config.literals(environments, "APP_ENV").pipe(
        Config.withDefault("development" as const),
      );
      const release = yield* Config.string("APP_RELEASE").pipe(
        Config.withDefault("local"),
      );

      return AppConfig.of({
        host,
        port,
        environment,
        release,
      });
    }),
  );
}

export const StatusSchema = Schema.Struct({
  environment: Schema.Literals(environments),
  release: Schema.String,
  requestCount: Schema.Int,
  status: Schema.Literal("ok"),
  timestamp: Schema.String,
});
