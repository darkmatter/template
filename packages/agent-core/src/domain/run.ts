import { Identifiers, RunEvent } from "@yielded/agent";
import { Schema } from "effect";

import { Goal } from "./text.ts";

export class RunRequest extends Schema.Class<RunRequest>("agent/RunRequest")({
  goal: Goal,
  runId: Identifiers.RunId,
}) {}

export class RunSummary extends Schema.Class<RunSummary>("agent/RunSummary")({
  answer: Schema.String,
  runId: Identifiers.RunId,
  threadId: Identifiers.ThreadId,
  turns: Schema.Int.check(Schema.isGreaterThan(0)),
}) {}

/** The yielded run events of one completed run and its decoded answer. */
export class RunReport extends Schema.Class<RunReport>("agent/RunReport")({
  events: Schema.Array(RunEvent.RunEvent),
  summary: RunSummary,
}) {}

/**
 * A run that ended without an answer. `errorTag` and `message` come from the
 * error the run failed with (a yielded policy error, an Effect AI error, or a
 * tool handler error), whichever toolkit the harness agent carries.
 */
export class RunFailure extends Schema.TaggedError<RunFailure>()("RunFailure", {
  errorTag: Schema.NonEmptyString,
  message: Schema.String,
  runId: Identifiers.RunId,
}) {}
