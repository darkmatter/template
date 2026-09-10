import {
  AgentHarness,
  Finish,
  Goal,
  RunCompleted,
  RunId,
  RunJournal,
  RunRequest,
  RunStarted,
  ToolCall,
  ToolCallId,
  UseTool,
} from "@repo/agent-core";
import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { expect } from "vitest";

import { agentTestLayer } from "../src/index.ts";

const runId = RunId.make("run-demo");
const toolCallId = ToolCallId.make("call-demo");

const TestLayer = agentTestLayer([
  new UseTool({
    call: new ToolCall({
      id: toolCallId,
      input: { args: ["hello"], command: "echo" },
      name: "Shell",
    }),
  }),
  new Finish({ answer: "The supervised command completed." }),
]);

const repeatedToolCall = new UseTool({
  call: new ToolCall({
    id: toolCallId,
    input: { args: [], command: "true" },
    name: "Shell",
  }),
});

it.effect("runs a deterministic tool loop and records its history", () =>
  Effect.gen(function* () {
    const harness = yield* AgentHarness;
    const journal = yield* RunJournal;

    const report = yield* harness.run(
      new RunRequest({ goal: "Say hello", id: runId }),
    );
    const events = yield* journal.read(runId);

    expect(report.summary.answer).toBe("The supervised command completed.");
    expect(report.summary.steps).toBe(2);
    expect(report.events).toEqual(events);
    expect(events.map((event) => event._tag)).toEqual([
      "RunStarted",
      "ToolRequested",
      "ToolCompleted",
      "RunCompleted",
    ]);
  }).pipe(Effect.provide(TestLayer)),
);

it.effect("returns a typed error when the step budget is exhausted", () =>
  Effect.gen(function* () {
    const harness = yield* AgentHarness;
    const journal = yield* RunJournal;
    const error = yield* harness
      .run(new RunRequest({ goal: "Never finish", id: runId }))
      .pipe(Effect.flip);
    const events = yield* journal.read(runId);

    expect(error._tag).toBe("StepLimitExceeded");
    if (error._tag === "StepLimitExceeded") {
      expect(error.limit).toBe(4);
    }
    expect(events.at(-1)?._tag).toBe("RunFailed");
  }).pipe(
    Effect.provide(
      agentTestLayer([
        repeatedToolCall,
        repeatedToolCall,
        repeatedToolCall,
        repeatedToolCall,
      ]),
    ),
  ),
);

it.effect("bounds completed histories without evicting an active run", () =>
  Effect.gen(function* () {
    const journal = yield* RunJournal;
    const active = RunId.make("run-active");
    const second = RunId.make("run-2");
    const third = RunId.make("run-3");

    yield* journal.append(
      new RunStarted({ at: 0, goal: "Still running", runId: active }),
    );
    for (const [index, id] of [second, third].entries()) {
      yield* journal.append(
        new RunStarted({ at: index, goal: `Goal ${index}`, runId: id }),
      );
      yield* journal.append(
        new RunCompleted({ answer: "Done", at: index, runId: id, steps: 1 }),
      );
    }

    expect(yield* journal.read(active)).toHaveLength(1);
    expect(yield* journal.read(second)).toEqual([]);
    expect(yield* journal.read(third)).toHaveLength(2);
  }).pipe(Effect.provide(RunJournal.layerMemoryWith({ maxRuns: 2 }))),
);

it.effect("returns a terminal snapshot atomically across eviction", () =>
  Effect.gen(function* () {
    const journal = yield* RunJournal;
    const first = RunId.make("run-1");

    for (const id of [first, RunId.make("run-2"), RunId.make("run-3")]) {
      yield* journal.append(
        new RunStarted({ at: 0, goal: "Concurrent run", runId: id }),
      );
    }
    const snapshot = yield* journal.append(
      new RunCompleted({ answer: "Done", at: 1, runId: first, steps: 1 }),
    );

    expect(snapshot.map((event) => event._tag)).toEqual([
      "RunStarted",
      "RunCompleted",
    ]);
    expect(yield* journal.read(first)).toEqual([]);
  }).pipe(Effect.provide(RunJournal.layerMemoryWith({ maxRuns: 2 }))),
);

it.effect("trims goals and rejects blank run identifiers", () =>
  Effect.gen(function* () {
    expect(yield* Schema.decodeEffect(Goal)("  inspect layers  ")).toBe(
      "inspect layers",
    );
    const error = yield* Schema.decodeEffect(RunId)("   ").pipe(Effect.flip);
    expect(String(error)).toContain("length between 1 and 128");
  }),
);
