import { Context, Effect, Layer, PubSub, Ref, Stream } from "effect";

import type { AgentEvent } from "#domain/events.ts";
import type { RunId } from "#domain/ids.ts";

interface JournalEntry {
  readonly active: boolean;
  readonly events: ReadonlyArray<AgentEvent>;
}
type JournalState = ReadonlyMap<RunId, JournalEntry>;
interface MemoryOptions {
  readonly maxRuns: number;
}

export class RunJournal extends Context.Service<
  RunJournal,
  {
    readonly append: (
      event: AgentEvent,
    ) => Effect.Effect<ReadonlyArray<AgentEvent>>;
    readonly changes: (runId: RunId) => Stream.Stream<AgentEvent>;
    readonly read: (runId: RunId) => Effect.Effect<ReadonlyArray<AgentEvent>>;
  }
>()("@repo/agent-core/services/RunJournal") {
  static readonly layerMemoryWith = (options: MemoryOptions) => {
    const maxRuns = Math.max(1, Math.floor(options.maxRuns));

    return Layer.effect(
      RunJournal,
      Effect.gen(function* () {
        const state = yield* Ref.make<JournalState>(new Map());
        const events = yield* Effect.acquireRelease(
          PubSub.bounded<AgentEvent>(256),
          PubSub.shutdown,
        );

        const append = Effect.fn("RunJournal.append")(function* (
          event: AgentEvent,
        ) {
          const history = yield* Ref.modify(state, (current) => {
            const next = new Map(current);
            const previous = current.get(event.runId);
            const history = [...(previous?.events ?? []), event];
            const active =
              event._tag !== "RunCompleted" && event._tag !== "RunFailed";
            next.set(event.runId, {
              active,
              events: history,
            });

            while (next.size > maxRuns) {
              let evicted: RunId | undefined;
              for (const [runId, entry] of next) {
                if (runId !== event.runId && !entry.active) {
                  evicted = runId;
                  break;
                }
              }
              if (evicted === undefined && !active) evicted = event.runId;
              if (evicted === undefined) break;
              next.delete(evicted);
            }
            return [history, next];
          });
          yield* PubSub.publish(events, event);
          return history;
        });

        const read = Effect.fn("RunJournal.read")((runId: RunId) =>
          Ref.get(state).pipe(
            Effect.map((current) => current.get(runId)?.events ?? []),
          ),
        );

        const changes = (runId: RunId) =>
          Stream.fromPubSub(events).pipe(
            Stream.filter((event) => event.runId === runId),
          );

        return RunJournal.of({ append, changes, read });
      }),
    );
  };

  static readonly layerMemory = RunJournal.layerMemoryWith({ maxRuns: 256 });
}
