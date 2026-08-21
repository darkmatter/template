import { AppConfig } from "@repo/web-core";
import * as SopsConfig from "alchemy-sops/Config";
import { Config, ConfigProvider, Effect, Layer, Option } from "effect";

interface AppConfigLayerOptions extends Pick<
  SopsConfig.SopsConfigOptions,
  "decrypt"
> {
  readonly provider?: ConfigProvider.ConfigProvider;
}

export const makeAppConfigLive = (options: AppConfigLayerOptions = {}) => {
  const environment = options.provider ?? ConfigProvider.fromEnv();

  return Layer.unwrap(
    Config.option(Config.string("APP_SOPS_FILE"))
      .parse(environment)
      .pipe(
        Effect.map(
          Option.match({
            onNone: () => environment,
            onSome: (path) =>
              environment.pipe(
                ConfigProvider.orElse(
                  SopsConfig.make({
                    path,
                    format: "yaml",
                    backend: "sops-age",
                    secrets: {
                      DEMO_MESSAGE: "stringData.DEMO_MESSAGE",
                    },
                    ...(options.decrypt ? { decrypt: options.decrypt } : {}),
                  }),
                ),
              ),
          }),
        ),
        Effect.map((provider) =>
          AppConfig.layer.pipe(Layer.provide(ConfigProvider.layer(provider))),
        ),
      ),
  );
};

export const AppConfigLive = makeAppConfigLive();
