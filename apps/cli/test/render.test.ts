import {
  RunCompleted,
  RunId,
  RunReport,
  RunStarted,
  RunSummary,
} from "@repo/agent-core";
import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { expect } from "vitest";

import { renderJson, renderText } from "../src/render.ts";

const runId = RunId.make("cli-test");
const run = new RunReport({
  events: [
    new RunStarted({ at: 1, goal: "Inspect the harness", runId }),
    new RunCompleted({ answer: "Done", at: 2, runId, steps: 1 }),
  ],
  summary: new RunSummary({ answer: "Done", id: runId, steps: 1 }),
});

it("renders concise text with optional journal events", () => {
  expect(renderText(run, false)).toEqual([
    "run cli-test completed in 1 step",
    "Done",
  ]);
  expect(renderText(run, true)).toContain("started goal=Inspect the harness");
});

it.effect("encodes machine output through the report schema", () =>
  Effect.gen(function* () {
    const json = yield* renderJson(run);
    const decoded = yield* Schema.decodeEffect(
      Schema.fromJsonString(RunReport),
    )(json);
    expect(decoded.summary).toMatchObject({
      answer: "Done",
      id: "cli-test",
      steps: 1,
    });
  }),
);
