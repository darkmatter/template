import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { AppConfig } from "../src/config.ts";
import { Metrics } from "../src/metrics.ts";
import { Status } from "../src/status.ts";

const TestLayer = Status.layer.pipe(
  Layer.provideMerge(Metrics.layer),
  Layer.provide(
    Layer.succeed(AppConfig, {
      host: "127.0.0.1",
      port: 3000,
      environment: "test",
      release: "unit",
      demoMessageConfigured: true,
    }),
  ),
);

it.effect("encodes a typed status payload", () =>
  Effect.gen(function* () {
    const metrics = yield* Metrics;
    const status = yield* Status;
    yield* metrics.record;
    yield* metrics.record;
    const payload = yield* status.current;
    assert.strictEqual(payload.environment, "test");
    assert.strictEqual(payload.release, "unit");
    assert.strictEqual(payload.demoMessageConfigured, true);
    assert.strictEqual(payload.requestCount, 2);
    assert.strictEqual(payload.status, "ok");
    assert.isString(payload.timestamp);
  }).pipe(Effect.provide(TestLayer)),
);

it.effect("accepts staging as APP_ENV", () =>
  Effect.gen(function* () {
    const status = yield* Status;
    const payload = yield* status.current;
    assert.strictEqual(payload.environment, "staging");
  }).pipe(
    Effect.provide(
      Status.layer.pipe(
        Layer.provideMerge(Metrics.layer),
        Layer.provide(
          Layer.succeed(AppConfig, {
            host: "127.0.0.1",
            port: 3000,
            environment: "staging",
            release: "staging",
            demoMessageConfigured: false,
          }),
        ),
      ),
    ),
  ),
);
