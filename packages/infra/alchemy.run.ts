import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

import { Dashboard } from "#dashboard.ts";
import { RunQueue } from "#dispatch.ts";
import { ArtifactStore, RunJournal } from "#storage.ts";

export default Alchemy.Stack(
  "AgentHarness",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const runJournal = yield* RunJournal;
    const artifactStore = yield* ArtifactStore;
    const runQueue = yield* RunQueue;
    const dashboard = yield* Dashboard;

    return {
      artifactStoreName: artifactStore.bucketName,
      dashboardUrl: dashboard.url.as<string>(),
      runJournalName: runJournal.databaseName,
      runQueueName: runQueue.queueName,
    };
  }),
);
