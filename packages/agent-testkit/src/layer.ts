import {
  AgentHarness,
  HarnessConfig,
  RunJournal,
  type ModelDecision,
} from "@repo/agent-core";
import { Layer } from "effect";

import { FakeToolRunnerLayer } from "./fake-tool-runner.ts";
import { scriptedModelLayer } from "./scripted-model.ts";

export const agentTestLayer = (decisions: ReadonlyArray<ModelDecision>) => {
  const dependencies = Layer.mergeAll(
    HarnessConfig.layerDemo,
    RunJournal.layerMemory,
    scriptedModelLayer(decisions),
    FakeToolRunnerLayer,
  );

  return AgentHarness.layerNoDeps.pipe(Layer.provideMerge(dependencies));
};
