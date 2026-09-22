import { it } from "@effect/vitest";
import { call } from "@orpc/server";
import { AgentHarness, ModelFailure } from "@repo/agent-core";
import { DemoHarnessLayer } from "@repo/agent-demo";
import { Effect, FileSystem, Layer, Path } from "effect";
import { Etag, HttpPlatform } from "effect/unstable/http";
import { HttpApiTest } from "effect/unstable/httpapi";
import { expect } from "vitest";

import { HarnessdApi, SubmitRun } from "#api.ts";
import { DemoRunner } from "#demo-runner.ts";
import { HarnessdHandlers } from "#handlers.ts";
import { HarnessdOrpcRouter } from "#orpc.ts";
import { RunIds } from "#run-ids.ts";

const DemoRunnerLive = DemoRunner.layerNoDeps.pipe(
  Layer.provide(Layer.mergeAll(DemoHarnessLayer, RunIds.layerMemory)),
);

const HttpTestServices = Layer.mergeAll(
  Path.layer,
  Etag.layerWeak,
  HttpPlatform.layer,
).pipe(Layer.provideMerge(FileSystem.layerNoop({})));

const TestLayer = Layer.mergeAll(
  HttpTestServices,
  HarnessdHandlers.pipe(Layer.provide(DemoRunnerLive)),
);

const FailingHarnessLayer = Layer.succeed(
  AgentHarness,
  AgentHarness.of({
    run: Effect.fn("FailingHarness.run")(() =>
      Effect.fail(new ModelFailure({ reason: "provider unavailable" })),
    ),
  }),
);

const FailingRunnerLive = DemoRunner.layerNoDeps.pipe(
  Layer.provide(Layer.mergeAll(FailingHarnessLayer, RunIds.layerMemory)),
);

const FailureTestLayer = Layer.mergeAll(
  HttpTestServices,
  HarnessdHandlers.pipe(Layer.provide(FailingRunnerLive)),
);

it.effect("serves health and runs the deterministic harness", () =>
  Effect.gen(function* () {
    const client = yield* HttpApiTest.groups(HarnessdApi, ["operations"]);
    const health = yield* client.operations.health();
    const status = yield* client.operations.status();
    const report = yield* client.operations.run({
      payload: new SubmitRun({ goal: "Explain the harness" }),
    });

    expect(health.status).toBe("ok");
    expect(status).toMatchObject({
      concurrency: 64,
      retention: "bounded-256-histories",
    });
    expect(report.summary.id).toBe("harnessd-1");
    expect(report.events.map((event) => event._tag)).toEqual([
      "RunStarted",
      "ToolRequested",
      "ToolCompleted",
      "RunCompleted",
    ]);
  }).pipe(Effect.provide(TestLayer)),
);

it.effect("maps domain failures into the declared API error", () =>
  Effect.gen(function* () {
    const client = yield* HttpApiTest.groups(HarnessdApi, ["operations"]);
    const error = yield* client.operations
      .run({ payload: new SubmitRun({ goal: "Explain the harness" }) })
      .pipe(Effect.flip);

    expect(error).toMatchObject({
      _tag: "RunRejected",
      kind: "ModelFailure",
      reason: "provider unavailable",
    });
  }).pipe(Effect.provide(FailureTestLayer)),
);

it("exposes the preferred-libs snapshot through an Effect oRPC procedure", async () => {
  const snapshot = await call(HarnessdOrpcRouter.preferred.libs, undefined);

  expect(snapshot).toMatchObject({
    database: "postgres",
    rpc: "effect-orpc",
    runtime: "bun-effect",
  });
});
