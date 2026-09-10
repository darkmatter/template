import { AgentHarness, HarnessConfig, RunJournal } from "@repo/agent-core";
import { Layer } from "effect";

import { DemoAgentModelLayer } from "#model.ts";
import { DemoToolRunnerLayer } from "#tool-runner.ts";

const dependencies = Layer.mergeAll(
  HarnessConfig.layerDemo,
  RunJournal.layerMemory,
  DemoAgentModelLayer,
  DemoToolRunnerLayer,
);

export const DemoHarnessLayer = AgentHarness.layerNoDeps.pipe(
  Layer.provide(dependencies),
);
