import { Schema } from "effect";

export class CommandRequest extends Schema.Class<CommandRequest>(
  "sandbox/CommandRequest",
)({
  args: Schema.Array(Schema.String),
  command: Schema.NonEmptyString,
  cwd: Schema.String,
  maxOutputBytes: Schema.Natural,
  timeoutMs: Schema.Natural,
}) {}

export class CommandOutput extends Schema.Class<CommandOutput>(
  "sandbox/CommandOutput",
)({
  exitCode: Schema.NullOr(Schema.Int),
  stderr: Schema.String,
  stderrTruncated: Schema.Boolean,
  stdout: Schema.String,
  stdoutTruncated: Schema.Boolean,
  timedOut: Schema.Boolean,
}) {}

export class ExecuteCommand extends Schema.TaggedClass<ExecuteCommand>()(
  "ExecuteCommand",
  {
    id: Schema.NonEmptyString,
    request: CommandRequest,
  },
) {}

export class CommandSucceeded extends Schema.TaggedClass<CommandSucceeded>()(
  "CommandSucceeded",
  {
    id: Schema.NonEmptyString,
    output: CommandOutput,
  },
) {}

export class CommandRejected extends Schema.TaggedClass<CommandRejected>()(
  "CommandRejected",
  {
    id: Schema.NonEmptyString,
    reason: Schema.String,
  },
) {}

export const SupervisorResponse = Schema.Union([
  CommandSucceeded,
  CommandRejected,
]);
export type SupervisorResponse = typeof SupervisorResponse.Type;
