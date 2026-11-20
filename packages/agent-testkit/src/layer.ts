import { AgentHarness, HarnessConfig } from "@repo/agent-core";
import { InMemory } from "@yielded/agent";
import {
  ScriptedModel,
  type ScriptedTurnInput,
} from "@yielded/agent-testing/scripted-model";
import { Layer } from "effect";
import { Model } from "effect/ai";

import { EchoToolkit, EchoToolkitLayer } from "./echo-tool.ts";

/**
 * The real harness and yielded runtime with the `Echo` tool and a model that
 * replays `turns`. `ScriptedModel` stays in the output so tests can inspect
 * the requests the runtime made.
 */
export const agentTestLayer = (turns: ReadonlyArray<ScriptedTurnInput>) => {
  const model = Model.make(
    "scripted",
    "agent-testkit",
    ScriptedModel.layer(turns),
  );

  return AgentHarness.layer(EchoToolkit).pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        HarnessConfig.layerDemo,
        model,
        EchoToolkitLayer,
        InMemory.layer,
      ),
    ),
  );
};
