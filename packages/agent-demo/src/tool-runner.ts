import {
  type ToolCall,
  ToolDenied,
  ToolFailure,
  ToolResult,
  ToolRunner,
} from "@repo/agent-core";
import { Effect, Layer, Schema } from "effect";

import {
  DescribeHarnessInput,
  DescribeHarnessOutput,
  DescribeHarnessToolName,
} from "#protocol.ts";

const decodeInput = Schema.decodeUnknownEffect(DescribeHarnessInput);
const encodeOutput = Schema.encodeEffect(DescribeHarnessOutput);

export const DemoToolRunnerLayer = Layer.succeed(
  ToolRunner,
  ToolRunner.of({
    execute: Effect.fn("DemoToolRunner.execute")(function* (call: ToolCall) {
      if (call.name !== DescribeHarnessToolName) {
        return yield* new ToolDenied({
          reason: "The provider-free demo exposes one read-only tool",
          tool: call.name,
        });
      }

      const input = yield* decodeInput(call.input).pipe(
        Effect.mapError(
          (error) =>
            new ToolFailure({ reason: String(error), tool: call.name }),
        ),
      );
      const output = yield* encodeOutput(
        new DescribeHarnessOutput({
          capabilities: [
            "schema-backed decisions",
            "capability services",
            "composable layers",
            "journaled tool execution",
          ],
          focus: input.goal,
          summary: "The harness completed one typed tool round-trip.",
        }),
      ).pipe(
        Effect.mapError(
          (error) =>
            new ToolFailure({ reason: String(error), tool: call.name }),
        ),
      );

      return new ToolResult({ callId: call.id, output });
    }),
  }),
);
