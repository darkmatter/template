import {
  type ToolCall,
  ToolCallId,
  ToolFailure,
  ToolResult,
  ToolRunner,
} from "@repo/agent-core";
import { CommandRequest, Sandbox } from "@repo/sandbox-client";
import { Effect, Layer, Schema } from "effect";

import { ShellParameters } from "./shell-tool.ts";

const decodeShellParameters = Schema.decodeUnknownEffect(ShellParameters);

const failureFromUnknown = (tool: string) => (error: unknown) =>
  new ToolFailure({ reason: String(error), tool });

const failureFromSandbox =
  (tool: string) => (error: { readonly reason: string }) =>
    new ToolFailure({ reason: error.reason, tool });

export const SandboxToolRunnerLayer = Layer.effect(
  ToolRunner,
  Effect.gen(function* () {
    const sandbox = yield* Sandbox;

    const execute = Effect.fn("SandboxToolRunner.execute")(function* (
      call: ToolCall,
    ) {
      if (call.name !== "Shell") {
        return yield* new ToolFailure({
          reason: "No adapter is registered for this tool",
          tool: call.name,
        });
      }

      const request = yield* decodeShellParameters(call.input).pipe(
        Effect.mapError(failureFromUnknown(call.name)),
      );
      const output = yield* sandbox
        .execute(new CommandRequest(request))
        .pipe(Effect.mapError(failureFromSandbox(call.name)));

      return new ToolResult({
        callId: ToolCallId.make(call.id),
        output: {
          exitCode: output.exitCode,
          stderr: output.stderr,
          stderrTruncated: output.stderrTruncated,
          stdout: output.stdout,
          stdoutTruncated: output.stdoutTruncated,
          timedOut: output.timedOut,
        },
      });
    });

    return ToolRunner.of({ execute });
  }),
);
