import { AppConfig } from "@repo/web-core";
import * as SopsConfig from "alchemy-sops/Config";
import { Config, ConfigProvider, Effect, Layer, Option } from "effect";

interface AppConfigLayerOptions extends Pick<
  SopsConfig.SopsConfigOptions,
  "decrypt"
> {
  readonly provider?: ConfigProvider.ConfigProvider;
}

const makeSopsProvider = (
  path: string,
  decrypt: AppConfigLayerOptions["decrypt"],
) =>
  SopsConfig.make({
    path,
    format: "yaml",
    backend: "sops-age",
    secrets: {
      DEMO_MESSAGE: "stringData.DEMO_MESSAGE",
    },
    ...(decrypt ? { decrypt } : {}),
  });

const withSopsFile = (
  environment: ConfigProvider.ConfigProvider,
  decrypt: AppConfigLayerOptions["decrypt"],
) =>
  Option.match({
    onNone: () => environment,
    onSome: (path: string) =>
      environment.pipe(ConfigProvider.orElse(makeSopsProvider(path, decrypt))),
  });

const layerForProvider = (provider: ConfigProvider.ConfigProvider) =>
  AppConfig.layer.pipe(Layer.provide(ConfigProvider.layer(provider)));

export const makeAppConfigLive = (options: AppConfigLayerOptions = {}) => {
  const environment = options.provider ?? ConfigProvider.fromEnv();
  const sopsPath = Config.option(Config.string("APP_SOPS_FILE"));
  const resolveProvider = withSopsFile(environment, options.decrypt);

  return Layer.unwrap(
    sopsPath
      .parse(environment)
      .pipe(Effect.map(resolveProvider), Effect.map(layerForProvider)),
  );
};

export const AppConfigLive = makeAppConfigLive();
