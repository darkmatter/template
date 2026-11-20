import { AgentHarness } from "@repo/agent-core";
import { Layer } from "effect";

import { ShellToolkit, ShellToolkitLayer } from "./shell-tool.ts";

/**
 * The harness agent with the supervised `Shell` tool. Provide an Effect AI
 * provider model (for example `OpenAiLanguageModel.model(...)`), a
 * `HarnessConfig`, `InMemory.layer`, and the `Sandbox` client.
 */
export const ShellHarnessLayer = AgentHarness.layer(ShellToolkit).pipe(
  Layer.provide(ShellToolkitLayer),
);
