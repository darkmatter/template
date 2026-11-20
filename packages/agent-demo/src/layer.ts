import { AgentHarness, HarnessConfig } from "@repo/agent-core";
import { InMemory } from "@yielded/agent";
import { Layer } from "effect";

import { DemoModel } from "#model.ts";
import { DemoToolkit, DemoToolkitLayer } from "#toolkit.ts";

export const DemoHarnessLayer = AgentHarness.layer(DemoToolkit).pipe(
  Layer.provide(
    Layer.mergeAll(
      HarnessConfig.layerDemo,
      DemoModel,
      DemoToolkitLayer,
      InMemory.layer,
    ),
  ),
);
