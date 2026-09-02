import { AgentHarness, RunId, RunRequest } from "@repo/agent-core";
import { Effect } from "effect";

export const runDemo = Effect.fn("Cli.runDemo")(function* (
  goal: string,
  runId: RunId,
) {
  const harness = yield* AgentHarness;
  return yield* harness.run(new RunRequest({ goal, id: runId }));
});
