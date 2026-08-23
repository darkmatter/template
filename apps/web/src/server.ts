import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { AppConfig, Metrics, Status } from "@repo/web-core";
import { Config, Effect, Layer } from "effect";
import {
  HttpRouter,
  HttpServerResponse,
  HttpStaticServer,
} from "effect/unstable/http";
import { fileURLToPath } from "node:url";

import { AppConfigLive } from "./config.ts";

const packagedPublicDirectory = fileURLToPath(
  new URL("../public", import.meta.url),
);

const Routes = HttpRouter.use(
  Effect.fn(function* (router) {
    const metrics = yield* Metrics;
    const status = yield* Status;

    yield* router.add(
      "GET",
      "/api/status",
      Effect.gen(function* () {
        yield* metrics.record;
        return yield* HttpServerResponse.json(yield* status.current);
      }),
    );

    yield* router.add(
      "GET",
      "/api/metrics",
      Effect.gen(function* () {
        yield* metrics.record;
        return HttpServerResponse.text(yield* metrics.prometheus, {
          headers: {
            "content-type": "text/plain; version=0.0.4; charset=utf-8",
          },
        });
      }),
    );
  }),
);

const StaticFiles = Layer.unwrap(
  Effect.gen(function* () {
    const root = yield* Config.string("APP_PUBLIC_DIR").pipe(
      Config.withDefault(packagedPublicDirectory),
    );
    return HttpStaticServer.layer({ root });
  }),
);

const ServerBackend = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return BunHttpServer.layer({
      hostname: config.host,
      port: config.port,
    });
  }),
);

const MainLive = HttpRouter.serve(Layer.mergeAll(Routes, StaticFiles)).pipe(
  Layer.provide(Status.layer),
  Layer.provide(Metrics.layer),
  Layer.provide(ServerBackend),
  Layer.provide(AppConfigLive),
);

BunRuntime.runMain(Layer.launch(MainLive));
