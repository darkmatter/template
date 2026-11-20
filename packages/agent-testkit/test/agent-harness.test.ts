import { AgentHarness, Goal, RunRequest } from "@repo/agent-core";
import { it } from "@effect/vitest";
import { Identifiers } from "@yielded/agent";
import type { ScriptedTurnInput } from "@yielded/agent-testing/scripted-model";
import { Effect, Schema } from "effect";
import { expect } from "vite-plus/test";

import { agentTestLayer } from "../src/index.ts";

const runId = Schema.decodeSync(Identifiers.RunId)("run-demo");
const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } };

const echoTurn = (id: string): ScriptedTurnInput => ({
  _tag: "Stream",
  parts: [
    { id, name: "Echo", params: { text: "hello" }, type: "tool-call" },
    { reason: "tool-calls", type: "finish", usage },
  ],
  termination: { _tag: "Complete" },
});

const answerTurn: ScriptedTurnInput = {
  _tag: "Stream",
  parts: [
    { id: "answer", type: "text-start" },
    {
      delta: "The echo tool returned hello.",
      id: "answer",
      type: "text-delta",
    },
    { id: "answer", type: "text-end" },
    { reason: "stop", type: "finish", usage },
  ],
  termination: { _tag: "Complete" },
};

it.effect("runs a scripted tool loop and reports the yielded events", () =>
  Effect.gen(function* () {
    const harness = yield* AgentHarness;
    const report = yield* harness.run(
      new RunRequest({ goal: "Say hello", runId }),
    );
    const tags = report.events.map((event) => event._tag);

    expect(report.summary).toMatchObject({
      answer: "The echo tool returned hello.",
      runId: "run-demo",
      turns: 2,
    });
    expect(tags[0]).toBe("RunStarted");
    expect(tags).toContain("ToolCallSucceeded");
    expect(tags.at(-1)).toBe("RunCompleted");
  }).pipe(Effect.provide(agentTestLayer([echoTurn("call-1"), answerTurn]))),
);

it.effect("fails with a policy error when the turn budget is exhausted", () =>
  Effect.gen(function* () {
    const harness = yield* AgentHarness;
    const failure = yield* harness
      .run(new RunRequest({ goal: "Never finish", runId }))
      .pipe(Effect.flip);

    expect(failure).toMatchObject({
      _tag: "RunFailure",
      errorTag: "AgentPolicyError",
      runId: "run-demo",
    });
  }).pipe(
    Effect.provide(
      agentTestLayer(["1", "2", "3", "4", "5"].map((n) => echoTurn(`c${n}`))),
    ),
  ),
);

it.effect("trims goals before they reach the agent", () =>
  Effect.gen(function* () {
    expect(yield* Schema.decodeEffect(Goal)("  inspect layers  ")).toBe(
      "inspect layers",
    );
  }),
);
