import { type AgentEvent, RunReport } from "@repo/agent-core";
import { Effect, Schema } from "effect";

const encodeRunReport = Schema.encodeEffect(Schema.fromJsonString(RunReport));

export const renderEvent = (event: AgentEvent): string => {
  switch (event._tag) {
    case "RunStarted":
      return `started goal=${event.goal}`;
    case "ToolRequested":
      return `tool.requested step=${event.step} tool=${event.call.name}`;
    case "ToolCompleted":
      return `tool.completed step=${event.step} call=${event.result.callId}`;
    case "RunCompleted":
      return `completed steps=${event.steps}`;
    case "RunFailed":
      return `failed kind=${event.error._tag}`;
  }
};

export const renderText = (run: RunReport, showEvents: boolean) => {
  const unit = run.summary.steps === 1 ? "step" : "steps";
  return [
    `run ${run.summary.id} completed in ${run.summary.steps} ${unit}`,
    run.summary.answer,
    ...(showEvents ? run.events.map(renderEvent) : []),
  ];
};

export const renderJson = (run: RunReport): Effect.Effect<string> =>
  encodeRunReport(run).pipe(Effect.orDie);
