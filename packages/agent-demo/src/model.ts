import { Effect, Layer, Schema, Stream } from "effect";
import { AiError, LanguageModel, Model, type Prompt } from "effect/ai";
import type { Response } from "effect/ai";

import {
  DescribeHarnessInput,
  DescribeHarnessOutput,
  DescribeHarnessToolName,
} from "#protocol.ts";

const decodeReport = Schema.decodeUnknownEffect(DescribeHarnessOutput);
const encodeInput = Schema.encodeEffect(DescribeHarnessInput);

// The demo model reports no usage; zero keeps budget accounting exact.
const usage = { inputTokens: { total: 0 }, outputTokens: { total: 0 } };

const modelFailure = (description: string) =>
  AiError.AiError.make({
    method: "streamText",
    module: "@repo/agent-demo/DemoModel",
    reason: AiError.UnknownError.make({ description }),
  });

const latestToolResult = (prompt: Prompt.Prompt) =>
  prompt.content
    .flatMap((message) => (message.role === "tool" ? message.content : []))
    .findLast(
      (part) =>
        part.type === "tool-result" && part.name === DescribeHarnessToolName,
    );

const latestGoal = (prompt: Prompt.Prompt) =>
  prompt.content
    .flatMap((message) => (message.role === "user" ? message.content : []))
    .findLast((part) => part.type === "text");

const answer = Effect.fn("DemoModel.answer")(function* (result: unknown) {
  const report = yield* decodeReport(result).pipe(
    Effect.mapError((error) => modelFailure(String(error))),
  );
  const text = [
    report.summary,
    `Capabilities: ${report.capabilities.join(", ")}.`,
    `Requested focus: ${report.focus}`,
  ].join("\n\n");
  const parts: ReadonlyArray<Response.StreamPartEncoded> = [
    { id: "answer", type: "text-start" },
    { delta: text, id: "answer", type: "text-delta" },
    { id: "answer", type: "text-end" },
    { reason: "stop", type: "finish", usage },
  ];
  return parts;
});

const callTool = Effect.fn("DemoModel.callTool")(function* (goal: string) {
  const params = yield* encodeInput(new DescribeHarnessInput({ goal })).pipe(
    Effect.mapError((error) => modelFailure(String(error))),
  );
  const parts: ReadonlyArray<Response.StreamPartEncoded> = [
    {
      id: "describe-harness",
      name: DescribeHarnessToolName,
      params,
      type: "tool-call",
    },
    { reason: "tool-calls", type: "finish", usage },
  ];
  return parts;
});

/**
 * Provider-free model that reads the prompt instead of counting turns: with
 * no `DescribeHarness` result yet it requests the tool for the user's goal;
 * with one it answers from that result. The same prompt always produces the
 * same response, so every run is deterministic.
 */
const decide = Effect.fn("DemoModel.decide")(function* (
  options: LanguageModel.ProviderOptions,
) {
  const result = latestToolResult(options.prompt);
  if (result?.type === "tool-result") {
    return yield* answer(result.result);
  }
  const goal = latestGoal(options.prompt);
  if (goal?.type !== "text") {
    return yield* modelFailure("The prompt carries no goal");
  }
  return yield* callTool(goal.text);
});

export const DemoModel = Model.make(
  "demo",
  "deterministic",
  Layer.effect(
    LanguageModel.LanguageModel,
    LanguageModel.make({
      generateText: () =>
        Effect.fail(modelFailure("The demo model only streams")),
      streamText: (options) =>
        Stream.unwrap(Effect.map(decide(options), Stream.fromIterable)),
    }),
  ),
);
