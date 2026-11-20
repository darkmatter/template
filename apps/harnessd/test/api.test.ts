import { it } from "@effect/vitest";
import { call } from "@orpc/server";
import { AgentHarness, HarnessConfig } from "@repo/agent-core";
import {
  DemoHarnessLayer,
  DemoToolkit,
  DemoToolkitLayer,
} from "@repo/agent-demo";
import { InMemory } from "@yielded/agent";
import { Effect, FileSystem, Layer, Path, Stream } from "effect";
import { AiError, LanguageModel, Model } from "effect/ai";
import { Etag, HttpPlatform } from "effect/http";
import { HttpApiTest } from "effect/http-api";
import { expect } from "vite-plus/test";

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

const unavailable = AiError.AiError.make({
  method: "streamText",
  module: "harnessd-test",
  reason: AiError.UnknownError.make({ description: "provider unavailable" }),
});

const UnavailableModel = Model.make(
  "test",
  "unavailable",
  Layer.effect(
    LanguageModel.LanguageModel,
    LanguageModel.make({
      generateText: () => Effect.fail(unavailable),
      streamText: () => Stream.fail(unavailable),
    }),
  ),
);

const FailingHarnessLayer = AgentHarness.layer(DemoToolkit).pipe(
  Layer.provide(
    Layer.mergeAll(
      HarnessConfig.layerDemo,
      UnavailableModel,
      DemoToolkitLayer,
      InMemory.layer,
    ),
  ),
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
      retention: "released-after-run",
      runtime: "@yielded/agent",
    });
    expect(report.summary).toMatchObject({ runId: "harnessd-1", turns: 2 });
    expect(report.events.map((event) => event._tag)).toEqual([
      "RunStarted",
      "TurnStarted",
      "ModelStarted",
      "ToolCallDeclared",
      "TurnCompleted",
      "ToolCallStarted",
      "ToolCallSucceeded",
      "TurnStarted",
      "ModelStarted",
      "TextDelta",
      "TurnCompleted",
      "RunCompleted",
    ]);
  }).pipe(Effect.provide(TestLayer)),
);

it.effect("maps a failed run into the declared API error", () =>
  Effect.gen(function* () {
    const client = yield* HttpApiTest.groups(HarnessdApi, ["operations"]);
    const error = yield* client.operations
      .run({ payload: new SubmitRun({ goal: "Explain the harness" }) })
      .pipe(Effect.flip);

    expect(error).toMatchObject({
      _tag: "RunRejected",
      kind: "AiError",
      reason: expect.stringContaining("provider unavailable"),
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
