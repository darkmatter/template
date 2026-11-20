import { RunReport } from "@repo/agent-core";
import type { RunEvent } from "@yielded/agent";
import { Effect, Schema } from "effect";

const encodeRunReport = Schema.encodeEffect(Schema.fromJsonString(RunReport));

export const renderEvent = (event: RunEvent.RunEvent): string => {
  switch (event._tag) {
    case "RunStarted":
      return `started run=${event.runId}`;
    case "TurnCompleted":
      return `turn.completed turn=${event.turn} reason=${event.finishReason}`;
    case "ToolCallDeclared":
      return `tool.declared tool=${event.toolName} call=${event.toolCallId}`;
    case "ToolCallSucceeded":
      return `tool.succeeded tool=${event.toolName} call=${event.toolCallId}`;
    case "ToolCallFailed":
      return `tool.failed tool=${event.toolName} error=${event.errorTag}`;
    case "RunCompleted":
      return `completed turns=${event.turns}`;
    case "RunFailed":
      return `failed error=${event.errorTag}`;
    default:
      return event._tag;
  }
};

export const renderText = (run: RunReport, showEvents: boolean) => {
  const unit = run.summary.turns === 1 ? "turn" : "turns";
  return [
    `run ${run.summary.runId} completed in ${run.summary.turns} ${unit}`,
    run.summary.answer,
    ...(showEvents ? run.events.map(renderEvent) : []),
  ];
};

export const renderJson = (run: RunReport): Effect.Effect<string> =>
  encodeRunReport(run).pipe(Effect.orDie);
