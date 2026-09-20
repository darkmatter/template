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

const isActiveEvent = (event: AgentEvent) =>
  event._tag !== "RunCompleted" && event._tag !== "RunFailed";

const findEviction = (
  entries: JournalState,
  keepRunId: RunId,
  active: boolean,
): RunId | undefined => {
  for (const [runId, entry] of entries) {
    if (runId !== keepRunId && !entry.active) {
      return runId;
    }
  }
  return active ? undefined : keepRunId;
};

const boundJournal = (
  entries: Map<RunId, JournalEntry>,
  keepRunId: RunId,
  active: boolean,
  maxRuns: number,
) => {
  while (entries.size > maxRuns) {
    const evicted = findEviction(entries, keepRunId, active);
    if (evicted === undefined) break;
    entries.delete(evicted);
  }
};

const appendEvent =
  (event: AgentEvent, maxRuns: number) =>
  (current: JournalState): [ReadonlyArray<AgentEvent>, JournalState] => {
    const next = new Map(current);
    const history = [...(current.get(event.runId)?.events ?? []), event];
    const active = isActiveEvent(event);
    next.set(event.runId, { active, events: history });
    boundJournal(next, event.runId, active, maxRuns);
    return [history, next];
  };

const eventsFor = (runId: RunId) => (current: JournalState) =>
  current.get(runId)?.events ?? [];

const eventsForRun = (runId: RunId) => (event: AgentEvent) =>
  event.runId === runId;

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
          const history = yield* Ref.modify(state, appendEvent(event, maxRuns));
          yield* PubSub.publish(events, event);
          return history;
        });

        const read = Effect.fn("RunJournal.read")((runId: RunId) =>
          Ref.get(state).pipe(Effect.map(eventsFor(runId))),
        );

        const changes = (runId: RunId) =>
          Stream.fromPubSub(events).pipe(Stream.filter(eventsForRun(runId)));

        return RunJournal.of({ append, changes, read });
      }),
    );
  };

  static readonly layerMemory = RunJournal.layerMemoryWith({ maxRuns: 256 });
}
