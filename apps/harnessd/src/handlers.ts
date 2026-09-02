import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

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
            journal: "memory",
            mode: "deterministic-demo",
            retention: "bounded-256-histories",
            service: "harnessd",
          }),
        ),
      )
      .handle("run", ({ payload }) => runner.run(payload.goal));
  }),
);
