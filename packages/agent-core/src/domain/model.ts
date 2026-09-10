import { Schema } from "effect";

import { ToolCallId } from "./ids.ts";
import { Goal } from "./text.ts";

export class ToolCall extends Schema.Class<ToolCall>("agent/ToolCall")({
  id: ToolCallId,
  input: Schema.Json,
  name: Schema.NonEmptyString,
}) {}

export class ToolResult extends Schema.Class<ToolResult>("agent/ToolResult")({
  callId: ToolCallId,
  output: Schema.Json,
}) {}

export class ModelContext extends Schema.Class<ModelContext>(
  "agent/ModelContext",
)({
  goal: Goal,
  instructions: Schema.NonEmptyString,
  step: Schema.Natural,
  toolResults: Schema.Array(ToolResult),
}) {}

export class UseTool extends Schema.TaggedClass<UseTool>()("UseTool", {
  call: ToolCall,
}) {}

export class Finish extends Schema.TaggedClass<Finish>()("Finish", {
  answer: Schema.String,
}) {}

export const ModelDecision = Schema.Union([UseTool, Finish]);
export type ModelDecision = typeof ModelDecision.Type;
