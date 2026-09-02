import { Context, Effect, Layer, Schema } from "effect";

import type { CommandOutput, CommandRequest } from "./protocol.ts";

export class SandboxError extends Schema.TaggedErrorClass<SandboxError>()(
  "SandboxError",
  { reason: Schema.String },
) {}

export class Sandbox extends Context.Service<
  Sandbox,
  {
    readonly execute: (
      request: CommandRequest,
    ) => Effect.Effect<CommandOutput, SandboxError>;
  }
>()("@repo/sandbox-client/Sandbox") {
  static readonly layerUnavailable = Layer.succeed(
    Sandbox,
    Sandbox.of({
      execute: Effect.fn("Sandbox.execute")(() =>
        Effect.fail(
          new SandboxError({
            reason: "The desktop transport has not connected to agent-sandboxd",
          }),
        ),
      ),
    }),
  );
}
