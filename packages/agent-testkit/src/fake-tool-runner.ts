import { ToolResult, ToolRunner } from "@repo/agent-core";
import { Effect, Layer } from "effect";

export const FakeToolRunnerLayer = Layer.succeed(
  ToolRunner,
  ToolRunner.of({
    execute: Effect.fn("FakeToolRunner.execute")((call) =>
      Effect.succeed(
        new ToolResult({
          callId: call.id,
          output: { echoed: call.input },
        }),
      ),
    ),
  }),
);
