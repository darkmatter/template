import { Schema } from "effect";

import { RunId } from "./domain/ids.ts";

export class ModelFailure extends Schema.TaggedErrorClass<ModelFailure>()(
  "ModelFailure",
  { reason: Schema.String },
) {}

export class ToolFailure extends Schema.TaggedErrorClass<ToolFailure>()(
  "ToolFailure",
  {
    reason: Schema.String,
    tool: Schema.String,
  },
) {}

export class ToolDenied extends Schema.TaggedErrorClass<ToolDenied>()(
  "ToolDenied",
  {
    reason: Schema.String,
    tool: Schema.String,
  },
) {}

export class StepLimitExceeded extends Schema.TaggedErrorClass<StepLimitExceeded>()(
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
