import { Goal, RunId } from "@repo/agent-core";
import { DemoHarnessLayer } from "@repo/agent-demo";
import { Console, Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

import { runDemo } from "#demo-run.ts";
import { renderJson, renderText } from "#render.ts";

const goal = Argument.string("goal").pipe(
  Argument.withSchema(Goal),
  Argument.withDescription("Goal for the deterministic demo agent"),
);

const runId = Flag.string("run-id").pipe(
  Flag.withSchema(RunId),
  Flag.withDefault(RunId.make("cli-demo")),
  Flag.withDescription("Stable identifier used by the run journal"),
);

const run = Command.make(
  "run",
  {
    events: Flag.boolean("events").pipe(
      Flag.withDescription("Print the journal after the answer"),
    ),
    goal,
    json: Flag.boolean("json").pipe(
      Flag.withDescription("Emit the schema-encoded run as JSON"),
    ),
    runId,
  },
  ({ events, goal, json, runId }) =>
    Effect.gen(function* () {
      const result = yield* runDemo(goal, runId);
      const lines = json
        ? [yield* renderJson(result)]
        : renderText(result, events);
      yield* Effect.forEach(lines, (line) => Console.log(line), {
        discard: true,
      });
    }),
).pipe(
  Command.withDescription(
    "Run the provider-free deterministic harness; no credentials are used",
  ),
  Command.withExamples([
    { command: 'harness run "Describe this harness"' },
    { command: 'harness run --events "Show the Effect boundaries"' },
    { command: 'harness run --json "Describe this harness"' },
  ]),
  Command.provide(DemoHarnessLayer),
);

export const harnessCommand = Command.make("harness").pipe(
  Command.withDescription("Inspect the Effect-native agent harness demo"),
  Command.withSubcommands([run]),
);

export const program = Command.run(harnessCommand, { version: "0.1.0" });
