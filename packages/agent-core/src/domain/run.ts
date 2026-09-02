import { Schema } from "effect";

import { AgentEvent } from "./events.ts";
import { RunId } from "./ids.ts";
import { Goal } from "./text.ts";

export class RunRequest extends Schema.Class<RunRequest>("agent/RunRequest")({
  goal: Goal,
  id: RunId,
}) {}

export class RunSummary extends Schema.Class<RunSummary>("agent/RunSummary")({
  answer: Schema.String,
  id: RunId,
  steps: Schema.Natural,
}) {}

export class RunReport extends Schema.Class<RunReport>("agent/RunReport")({
  events: Schema.Array(AgentEvent),
  summary: RunSummary,
}) {}
