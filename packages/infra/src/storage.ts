import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import { Path } from "effect/Path";

export const ArtifactStore = Cloudflare.R2.Bucket("ArtifactStore");

export const RunJournal = Effect.gen(function* () {
  const path = yield* Path;

  return yield* Cloudflare.D1.Database("RunJournal", {
    migrationsDir: path.resolve(import.meta.dirname, "../migrations"),
  });
});
