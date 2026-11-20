import { Effect, Schema } from "effect";
import { Tool, Toolkit } from "effect/ai";

export const EchoTool = Tool.make("Echo", {
  description: "Return the given text unchanged",
  failureMode: "return",
  parameters: Schema.Struct({ text: Schema.String }),
  success: Schema.Struct({ echoed: Schema.String }),
});

export const EchoToolkit = Toolkit.make(EchoTool);

export const EchoToolkitLayer = EchoToolkit.toLayer({
  Echo: ({ text }) => Effect.succeed({ echoed: text }),
});
