import { Goal, RunReport } from "@repo/agent-core";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
} from "effect/unstable/httpapi";

export class Health extends Schema.Class<Health>("harnessd/Health")({
  service: Schema.Literal("harnessd"),
  status: Schema.Literal("ok"),
}) {}

export class DaemonStatus extends Schema.Class<DaemonStatus>(
  "harnessd/DaemonStatus",
)({
  concurrency: Schema.Literal(64),
  execution: Schema.Literal("synchronous"),
  journal: Schema.Literal("memory"),
  mode: Schema.Literal("deterministic-demo"),
  retention: Schema.Literal("bounded-256-histories"),
  service: Schema.Literal("harnessd"),
}) {}

export class SubmitRun extends Schema.Class<SubmitRun>("harnessd/SubmitRun")({
  goal: Goal,
}) {}

export class RunRejected extends Schema.TaggedErrorClass<RunRejected>()(
  "RunRejected",
  {
    kind: Schema.Literals([
      "ModelFailure",
      "StepLimitExceeded",
      "ToolDenied",
      "ToolFailure",
    ]),
    reason: Schema.String,
  },
  { httpApiStatus: 422 },
) {}

const Operations = HttpApiGroup.make("operations").add(
  HttpApiEndpoint.get("health", "/health", { success: Health }),
  HttpApiEndpoint.get("status", "/status", { success: DaemonStatus }),
  HttpApiEndpoint.post("run", "/runs", {
    error: RunRejected,
    payload: SubmitRun,
    success: RunReport,
  }),
);

export class HarnessdApi extends HttpApi.make("HarnessdApi").add(Operations) {}
