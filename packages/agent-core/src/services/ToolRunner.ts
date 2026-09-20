import { Context, Effect } from "effect";

import type { ToolCall, ToolResult } from "#domain/model.ts";
import type { ToolDenied, ToolFailure } from "#errors.ts";

export class ToolRunner extends Context.Service<
  ToolRunner,
  {
    readonly execute: (
      call: ToolCall,
    ) => Effect.Effect<ToolResult, ToolFailure | ToolDenied>;
  }
>()("@repo/agent-core/services/ToolRunner") {}
