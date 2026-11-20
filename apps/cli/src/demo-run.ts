import { AgentHarness, RunRequest } from "@repo/agent-core";
import type { Identifiers } from "@yielded/agent";
import { Effect } from "effect";

export const runDemo = Effect.fn("Cli.runDemo")(function* (
  goal: string,
  runId: Identifiers.RunId,
) {
  const harness = yield* AgentHarness;
  return yield* harness.run(new RunRequest({ goal, runId }));
});
