import { AppConfig, Metrics, Status } from "@repo/web-core";
import { ConfigProvider, Effect, Layer, ManagedRuntime } from "effect";
import { getEnv } from "waku";

// Waku's getEnv reads Worker bindings on Cloudflare and process.env under the
// self-hosted Node server, so one provider serves both deploy targets.
const wakuEnv = ConfigProvider.make((path) =>
  Effect.sync(() => {
    const value = getEnv(path.join("_"));
    return value === undefined ? undefined : ConfigProvider.makeValue(value);
  }),
);

const AppConfigLive = AppConfig.layer.pipe(
  Layer.provide(ConfigProvider.layer(wakuEnv)),
);

const WebLayer = Status.layer.pipe(
  Layer.provideMerge(Metrics.layer),
  Layer.provide(AppConfigLive),
);

// One runtime per server process (or Worker isolate): the request counter in
// Metrics lives as long as it does.
const runtime = ManagedRuntime.make(WebLayer);

/** Counts the request and returns the encoded status payload. */
export const recordStatus = () =>
  runtime.runPromise(
    Effect.gen(function* () {
      yield* (yield* Metrics).record;
      return yield* (yield* Status).current;
    }),
  );

/** Counts the request and returns the Prometheus text exposition. */
export const recordMetrics = () =>
  runtime.runPromise(
    Effect.gen(function* () {
      const metrics = yield* Metrics;
      yield* metrics.record;
      return yield* metrics.prometheus;
    }),
  );
