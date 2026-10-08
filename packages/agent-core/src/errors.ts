import { Schema } from "effect";

import { RunId } from "./domain/ids.ts";

export class ModelFailure extends Schema.TaggedError<ModelFailure>()(
  "ModelFailure",
  { reason: Schema.String },
) {}

export class ToolFailure extends Schema.TaggedError<ToolFailure>()(
  "ToolFailure",
  {
    reason: Schema.String,
    tool: Schema.String,
  },
) {}

export class ToolDenied extends Schema.TaggedError<ToolDenied>()("ToolDenied", {
  reason: Schema.String,
  tool: Schema.String,
}) {}

export class StepLimitExceeded extends Schema.TaggedError<StepLimitExceeded>()(
  "StepLimitExceeded",
  {
    limit: Schema.Natural,
    runId: RunId,
  },
) {}

export const AgentFailure = Schema.Union([
  ModelFailure,
  ToolFailure,
  ToolDenied,
  StepLimitExceeded,
]);
export type AgentError = typeof AgentFailure.Type;
