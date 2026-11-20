import { Agent, Identifiers, Output } from "@yielded/agent";
import { Effect, Schema } from "effect";
import type { Toolkit } from "effect/ai";

import { Goal } from "#domain/text.ts";

import { HarnessConfig, harnessTurnCeiling } from "./HarnessConfig.ts";

const Answer = Output.text(Schema.String);

const systemPrompt: Effect.Effect<string, never, HarnessConfig> = Effect.gen(
  function* () {
    const config = yield* HarnessConfig;
    return config.systemPrompt;
  },
);

/** A goal in, a plain-text answer out; only the toolkit varies. */
export type HarnessAgent<Tools extends Toolkit.Any> = Agent.Definition<
  typeof Goal,
  typeof Answer,
  () => Effect.Effect<string, never, HarnessConfig>,
  Tools,
  undefined,
  (goal: string) => string,
  undefined
> & { readonly id: Identifiers.AgentId & "harness" };

/**
 * The toolkit is the only part that varies between the demo, the sandbox
 * runtime, and tests. Exhausting the turn budget fails the run instead of
 * asking the model for a forced final answer, so a stuck model surfaces as
 * `AgentPolicyError`.
 */
export const makeHarnessAgent = <Tools extends Toolkit.Any>(
  toolkit: Tools,
): HarnessAgent<Tools> =>
  Agent.make("harness", {
    description: "Answer one goal with the smallest useful toolset.",
    input: Goal,
    inputPrompt: (goal: string) => goal,
    instructions: () => systemPrompt,
    output: Answer,
    policy: {
      maxDuration: "2 minutes",
      maxToolCalls: harnessTurnCeiling,
      maxTurns: harnessTurnCeiling,
      onExhaustion: "fail",
    },
    toolkit,
  });
