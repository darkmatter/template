import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { DaemonStatus, HarnessdApi, Health } from "#api.ts";
import { DemoRunner } from "#demo-runner.ts";

export const HarnessdHandlers = HttpApiBuilder.group(
  HarnessdApi,
  "operations",
  Effect.fnUntraced(function* (handlers) {
    const runner = yield* DemoRunner;

    return handlers
      .handle("health", () =>
        Effect.succeed(new Health({ service: "harnessd", status: "ok" })),
      )
      .handle("status", () =>
        Effect.succeed(
          new DaemonStatus({
            concurrency: 64,
            execution: "synchronous",
            history: "in-memory",
            mode: "deterministic-demo",
            retention: "released-after-run",
            runtime: "@yielded/agent",
            service: "harnessd",
          }),
        ),
      )
      .handle("run", ({ payload }) => runner.run(payload.goal));
  }),
);
