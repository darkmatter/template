import {
  AgentModel,
  Finish,
  ModelContext,
  ModelFailure,
  ToolCall,
  ToolCallId,
  UseTool,
} from "@repo/agent-core";
import { Effect, Layer, Schema } from "effect";
import { LanguageModel } from "effect/unstable/ai";

import { ShellToolkit } from "./shell-tool.ts";

const encodeModelContext = Schema.encodeEffect(
  Schema.fromJsonString(ModelContext),
);

export const EffectAiModelLayer = Layer.effect(
  AgentModel,
  Effect.gen(function* () {
    const model = yield* LanguageModel.LanguageModel;
    const toolkit = yield* ShellToolkit;

    const decide = Effect.fn("EffectAiModel.decide")(
      function* (context: ModelContext) {
        const prompt = yield* encodeModelContext(context);
        const response = yield* model.generateText({
          disableToolCallResolution: true,
          prompt,
          toolkit,
        });
        const call = response.toolCalls[0];

        if (call !== undefined) {
          return new UseTool({
            call: new ToolCall({
              id: ToolCallId.make(call.id),
              input: call.params,
              name: call.name,
            }),
          });
        }

        return new Finish({ answer: response.text });
      },
      Effect.mapError((error) => new ModelFailure({ reason: String(error) })),
    );

    return AgentModel.of({ decide });
  }),
);
