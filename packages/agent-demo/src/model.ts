import {
  AgentModel,
  Finish,
  ModelFailure,
  ToolCall,
  ToolCallId,
  UseTool,
} from "@repo/agent-core";
import { Effect, Layer, Schema } from "effect";

import {
  DescribeHarnessInput,
  DescribeHarnessOutput,
  DescribeHarnessToolName,
} from "#protocol.ts";

const encodeInput = Schema.encodeEffect(DescribeHarnessInput);
const decodeOutput = Schema.decodeUnknownEffect(DescribeHarnessOutput);

const modelFailure = (reason: unknown) =>
  new ModelFailure({ reason: String(reason) });

export const DemoAgentModelLayer = Layer.succeed(
  AgentModel,
  AgentModel.of({
    decide: Effect.fn("DemoAgentModel.decide")(function* (context) {
      if (context.toolResults.length === 0) {
        const input = yield* encodeInput(
          new DescribeHarnessInput({ goal: context.goal }),
        ).pipe(Effect.mapError(modelFailure));

        return new UseTool({
          call: new ToolCall({
            id: ToolCallId.make("demo-describe-harness"),
            input,
            name: DescribeHarnessToolName,
          }),
        });
      }

      const latest = context.toolResults[context.toolResults.length - 1];
      if (latest === undefined) {
        return yield* modelFailure("The demo tool result is missing");
      }

      const report = yield* decodeOutput(latest.output).pipe(
        Effect.mapError(modelFailure),
      );

      return new Finish({
        answer: [
          report.summary,
          `Capabilities: ${report.capabilities.join(", ")}.`,
          `Requested focus: ${report.focus}`,
        ].join("\n\n"),
      });
    }),
  }),
);
