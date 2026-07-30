import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import path from "node:path";
import { config as loadEnv } from "dotenv";

const ROOT = import.meta.dirname;

loadEnv({ path: path.join(ROOT, ".env") });
loadEnv({ path: path.join(ROOT, "../../apps/web/.env") });

/**
 * Labs web stack on alchemy 2.x (Effect/Stack).
 * Replaces the v1 `await alchemy()` + TanStackStart helper.
 */
export const Database = Cloudflare.D1.Database("database", {
  migrationsDir: path.join(ROOT, "../../packages/db/src/migrations"),
});

export class Web extends Cloudflare.Website.Vite<Web>()("web", {
  rootDir: path.join(ROOT, "../../apps/web"),
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DB: Database,
    CORS_ORIGIN: Config.string("CORS_ORIGIN").pipe(Config.withDefault("")),
    BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL").pipe(Config.withDefault("")),
    POLAR_ACCESS_TOKEN: Config.redacted("POLAR_ACCESS_TOKEN"),
    POLAR_SUCCESS_URL: Config.string("POLAR_SUCCESS_URL").pipe(
      Config.withDefault(""),
    ),
  },
  assets: {
    runWorkerFirst: true,
  },
}) {}

export type WebEnv = Cloudflare.InferEnv<typeof Web>;

export default Alchemy.Stack(
  "labs",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const database = yield* Database;
    const website = yield* Web;

    return {
      url: website.url,
      databaseId: database.databaseId,
    };
  }),
);
