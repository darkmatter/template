import { Context, Effect } from "effect";

import type { ModelContext, ModelDecision } from "#domain/model.ts";
import type { ModelFailure } from "#errors.ts";

export class AgentModel extends Context.Service<
  AgentModel,
  {
    readonly decide: (
      context: ModelContext,
    ) => Effect.Effect<ModelDecision, ModelFailure>;
  }
>()("@repo/agent-core/services/AgentModel") {}
