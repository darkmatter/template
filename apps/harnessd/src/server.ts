import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { DemoHarnessLayer } from "@repo/agent-demo";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { HarnessdApi } from "#api.ts";
import { HarnessdConfig } from "#config.ts";
import { DemoRunner } from "#demo-runner.ts";
import { HarnessdHandlers } from "#handlers.ts";
import { RunIds } from "#run-ids.ts";

const DemoRunnerLive = DemoRunner.layerNoDeps.pipe(
  Layer.provide(Layer.mergeAll(DemoHarnessLayer, RunIds.layerMemory)),
);

const ApiLive = HttpApiBuilder.layer(HarnessdApi, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide(HarnessdHandlers), Layer.provide(DemoRunnerLive));

const ServerLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* HarnessdConfig;
    return BunHttpServer.layer({ hostname: config.host, port: config.port });
  }),
);

const MainLive = HttpRouter.serve(ApiLive).pipe(
  Layer.provide(ServerLive),
  Layer.provide(HarnessdConfig.layer),
);

BunRuntime.runMain(Layer.launch(MainLive));
