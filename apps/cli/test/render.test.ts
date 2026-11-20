import { RunReport } from "@repo/agent-core";
import { DemoHarnessLayer } from "@repo/agent-demo";
import { it } from "@effect/vitest";
import { Identifiers } from "@yielded/agent";
import { Effect, Schema } from "effect";
import { expect } from "vite-plus/test";

import { runDemo } from "../src/demo-run.ts";
import { renderJson, renderText } from "../src/render.ts";

const runId = Identifiers.RunId.make("cli-test");

it.effect("renders the demo run as text with optional events", () =>
  Effect.gen(function* () {
    const run = yield* runDemo("Inspect the harness", runId);
    const [headline, answer] = renderText(run, false);

    expect(headline).toBe("run cli-test completed in 2 turns");
    expect(answer).toContain("Requested focus: Inspect the harness");
    expect(renderText(run, true)).toEqual(
      expect.arrayContaining([
        "started run=cli-test",
        "tool.succeeded tool=DescribeHarness call=describe-harness",
        "completed turns=2",
      ]),
    );
  }).pipe(Effect.provide(DemoHarnessLayer)),
);

it.effect("encodes machine output through the report schema", () =>
  Effect.gen(function* () {
    const run = yield* runDemo("Inspect the harness", runId);
    const decoded = yield* Schema.decodeEffect(
      Schema.fromJsonString(RunReport),
    )(yield* renderJson(run));

    expect(decoded.summary).toEqual(run.summary);
    expect(decoded.events.at(-1)?._tag).toBe("RunCompleted");
  }).pipe(Effect.provide(DemoHarnessLayer)),
);
