import { Schema } from "effect";

export const DescribeHarnessToolName = "DescribeHarness" as const;

export class DescribeHarnessInput extends Schema.Class<DescribeHarnessInput>(
  "demo/DescribeHarnessInput",
)({
  goal: Schema.NonEmptyString,
}) {}

export class DescribeHarnessOutput extends Schema.Class<DescribeHarnessOutput>(
  "demo/DescribeHarnessOutput",
)({
  capabilities: Schema.Array(Schema.NonEmptyString),
  focus: Schema.NonEmptyString,
  summary: Schema.NonEmptyString,
}) {}
