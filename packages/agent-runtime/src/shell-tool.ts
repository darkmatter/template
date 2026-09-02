import { Sandbox, SandboxError, CommandRequest } from "@repo/sandbox-client";
import { Effect, Schema } from "effect";
import { Tool, Toolkit } from "effect/unstable/ai";

export const ShellParameters = Schema.Struct({
  args: Schema.Array(Schema.String),
  command: Schema.NonEmptyString,
  cwd: Schema.String,
  maxOutputBytes: Schema.Natural,
  timeoutMs: Schema.Natural,
});

export const ShellTool = Tool.make("Shell", {
  description: "Run one bounded command in the supervised Rust worker",
  failure: SandboxError,
  failureMode: "return",
  parameters: ShellParameters,
  success: Schema.Struct({
    exitCode: Schema.NullOr(Schema.Int),
    stderr: Schema.String,
    stderrTruncated: Schema.Boolean,
    stdout: Schema.String,
    stdoutTruncated: Schema.Boolean,
    timedOut: Schema.Boolean,
  }),
});

export const ShellToolkit = Toolkit.make(ShellTool);

export const ShellToolkitLayer = ShellToolkit.toLayer(
  Effect.gen(function* () {
    const sandbox = yield* Sandbox;

    return ShellToolkit.of({
      Shell: Effect.fn("ShellToolkit.Shell")((parameters) =>
        sandbox.execute(new CommandRequest(parameters)),
      ),
    });
  }),
);
