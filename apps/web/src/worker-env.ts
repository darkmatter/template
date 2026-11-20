import type { AppEnvironment } from "@repo/web-core";
import * as SopsConfig from "alchemy-sops/Config";
import { Config, ConfigProvider, Effect, Option, type Redacted } from "effect";

/**
 * Deploy-time configuration for the Worker. alchemy.run.ts resolves it once
 * per deploy and binds the result as Worker env; the Worker itself never
 * decrypts anything.
 */
export interface WorkerEnv {
  readonly APP_ENV: AppEnvironment;
  readonly APP_RELEASE: string;
  readonly DEMO_MESSAGE?: Redacted.Redacted<string>;
}

export type WorkerEnvOptions = Pick<SopsConfig.SopsConfigOptions, "decrypt">;
/**
 * Reads the Worker env from the deploy environment. When `APP_SOPS_FILE`
 * names a SOPS document, it answers `DEMO_MESSAGE` behind the environment,
 * and is decrypted only if the environment does not set it.
 */
export const workerEnv = (stage: string, options: WorkerEnvOptions = {}) =>
  Effect.gen(function* () {
    const environment = yield* ConfigProvider.ConfigProvider;
    const sopsFile = yield* Config.option(Config.String("APP_SOPS_FILE")).parse(
      environment,
    );
    const secrets = Option.match(sopsFile, {
      onNone: () => environment,
      onSome: (path) =>
        environment.pipe(
          ConfigProvider.orElse(
            SopsConfig.make({
              path,
              format: "yaml",
              backend: "sops-age",
              secrets: { DEMO_MESSAGE: "stringData.DEMO_MESSAGE" },
              ...(options.decrypt === undefined
                ? {}
                : { decrypt: options.decrypt }),
            }),
          ),
        ),
    });
    const release = yield* Config.String("APP_RELEASE").pipe(
      Config.withDefault(stage),
      (config) => config.parse(environment),
    );
    const demoMessage = yield* Config.option(
      Config.Redacted("DEMO_MESSAGE"),
    ).parse(secrets);

    const env: WorkerEnv = {
      // Stages named after an environment use it; personal and PR stages
      // are development.
      APP_ENV:
        stage === "production" || stage === "staging" ? stage : "development",
      APP_RELEASE: release,
      ...Option.match(demoMessage, {
        onNone: () => ({}),
        onSome: (DEMO_MESSAGE) => ({ DEMO_MESSAGE }),
      }),
    };
    return env;
  });
