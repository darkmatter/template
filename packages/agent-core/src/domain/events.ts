import { Schema } from "effect";

import { RunId } from "./ids.ts";
import { ToolCall, ToolResult } from "./model.ts";
import { Goal } from "./text.ts";
import { AgentFailure } from "../errors.ts";

const EventFields = {
  at: Schema.Finite,
  runId: RunId,
};

export class RunStarted extends Schema.TaggedClass<RunStarted>()("RunStarted", {
  ...EventFields,
  goal: Goal,
}) {}

export class ToolRequested extends Schema.TaggedClass<ToolRequested>()(
  "ToolRequested",
  {
    ...EventFields,
    call: ToolCall,
    step: Schema.Natural,
  },
) {}

export class ToolCompleted extends Schema.TaggedClass<ToolCompleted>()(
  "ToolCompleted",
  {
    ...EventFields,
    result: ToolResult,
    step: Schema.Natural,
  },
) {}

export class RunCompleted extends Schema.TaggedClass<RunCompleted>()(
  "RunCompleted",
  {
    ...EventFields,
    answer: Schema.String,
    steps: Schema.Natural,
  },
) {}

export class RunFailed extends Schema.TaggedClass<RunFailed>()("RunFailed", {
  ...EventFields,
  error: AgentFailure,
}) {}

export const AgentEvent = Schema.Union([
  RunStarted,
  ToolRequested,
  ToolCompleted,
  RunCompleted,
  RunFailed,
]);
export type AgentEvent = typeof AgentEvent.Type;
