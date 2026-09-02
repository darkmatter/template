import { AgentModel, ModelFailure, type ModelDecision } from "@repo/agent-core";
import { Effect, Layer, Ref } from "effect";

export const scriptedModelLayer = (decisions: ReadonlyArray<ModelDecision>) =>
  Layer.effect(
    AgentModel,
    Effect.gen(function* () {
      const cursor = yield* Ref.make(0);

      const decide = Effect.fn("ScriptedModel.decide")(function* () {
        const index = yield* Ref.getAndUpdate(cursor, (value) => value + 1);
        const decision = decisions[index];

        if (decision === undefined) {
          return yield* new ModelFailure({
            reason: `Scripted model exhausted at decision ${index}`,
          });
        }

        return decision;
      });

      return AgentModel.of({ decide });
    }),
  );
