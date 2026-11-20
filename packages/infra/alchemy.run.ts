import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Effect from "effect/Effect";

import { RunQueue } from "#dispatch.ts";
import { RustCloudflareWorker } from "#rust-cloudflare-worker.ts";
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
    const rustCloudflareWorker = yield* RustCloudflareWorker;

    return {
      artifactStoreName: artifactStore.bucketName,
      runJournalName: runJournal.databaseName,
      runQueueName: runQueue.queueName,
      rustCloudflareWorkerUrl: rustCloudflareWorker.url.as<string>(),
    };
  }),
);
