import { Clock, Context, Effect, Layer } from "effect";

import {
  RunCompleted,
  RunFailed,
  RunStarted,
  ToolCompleted,
  ToolRequested,
} from "#domain/events.ts";
import { ModelContext } from "#domain/model.ts";
import { RunReport, RunSummary, type RunRequest } from "#domain/run.ts";
import { StepLimitExceeded, type AgentError } from "#errors.ts";

import { AgentModel } from "./agent-model.ts";
import { HarnessConfig } from "./harness-config.ts";
import { RunJournal } from "./run-journal.ts";
import { ToolRunner } from "./tool-runner.ts";

export class AgentHarness extends Context.Service<
  AgentHarness,
  {
    readonly run: (request: RunRequest) => Effect.Effect<RunReport, AgentError>;
  }
>()("@repo/agent-core/services/AgentHarness") {
  static readonly layerNoDeps = Layer.effect(
    AgentHarness,
    Effect.gen(function* () {
      const config = yield* HarnessConfig;
      const journal = yield* RunJournal;
      const model = yield* AgentModel;
      const tools = yield* ToolRunner;

      const execute = Effect.fn("AgentHarness.execute")(function* (
        request: RunRequest,
      ) {
        let context = new ModelContext({
          goal: request.goal,
          instructions: config.systemPrompt,
          step: 0,
          toolResults: [],
        });

        for (let step = 1; step <= config.maxSteps; step += 1) {
          const decision = yield* model.decide(context);
          const at = yield* Clock.currentTimeMillis;

          if (decision._tag === "Finish") {
            const summary = new RunSummary({
              answer: decision.answer,
              id: request.id,
              steps: step,
            });
            const events = yield* journal.append(
              new RunCompleted({
                answer: summary.answer,
                at,
                runId: request.id,
                steps: summary.steps,
              }),
            );
            return new RunReport({ events, summary });
          }

          yield* journal.append(
            new ToolRequested({
              at,
              call: decision.call,
              runId: request.id,
              step,
            }),
          );
          const result = yield* tools.execute(decision.call);
          yield* journal.append(
            new ToolCompleted({
              at: yield* Clock.currentTimeMillis,
              result,
              runId: request.id,
              step,
            }),
          );
          context = new ModelContext({
            goal: context.goal,
            instructions: context.instructions,
            step,
            toolResults: [...context.toolResults, result],
          });
        }

        return yield* new StepLimitExceeded({
          limit: config.maxSteps,
          runId: request.id,
        });
      });

      const run = Effect.fn("AgentHarness.run")(function* (
        request: RunRequest,
      ) {
        yield* journal.append(
          new RunStarted({
            at: yield* Clock.currentTimeMillis,
            goal: request.goal,
            runId: request.id,
          }),
        );

        return yield* execute(request).pipe(
          Effect.tapError((error) =>
            Clock.currentTimeMillis.pipe(
              Effect.flatMap((at) =>
                journal.append(new RunFailed({ at, error, runId: request.id })),
              ),
            ),
          ),
        );
      });

      return AgentHarness.of({ run });
    }),
  );
}
