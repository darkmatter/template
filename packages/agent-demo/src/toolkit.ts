import { Effect } from "effect";
import { Tool, Toolkit } from "effect/ai";

import { DescribeHarnessInput, DescribeHarnessOutput } from "#protocol.ts";

export const DescribeHarness = Tool.make("DescribeHarness", {
  description: "Describe the harness architecture for one requested focus",
  failureMode: "return",
  parameters: DescribeHarnessInput,
  success: DescribeHarnessOutput,
});

export const DemoToolkit = Toolkit.make(DescribeHarness);

export const DemoToolkitLayer = DemoToolkit.toLayer({
  DescribeHarness: ({ goal }) =>
    Effect.succeed(
      new DescribeHarnessOutput({
        capabilities: [
          "schema-backed agent definition",
          "native Effect AI tools",
          "composable layers",
          "yielded run events",
        ],
        focus: goal,
        summary: "The harness completed one typed tool round-trip.",
      }),
    ),
});
