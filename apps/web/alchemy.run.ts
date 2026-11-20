import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Effect from "effect/Effect";

import { workerEnv } from "#worker-env.ts";

/**
 * The web app's own stack: a Waku site on a Cloudflare Worker. Website.Waku
 * builds through Waku's Vite pipeline with Alchemy's Cloudflare adapter, so
 * there is no wrangler config and no separate build step.
 */
export default Alchemy.Stack(
  "AgentHarnessWeb",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;

    const website = yield* Cloudflare.Website.Waku("Website", {
      rootDir: import.meta.dirname,
      env: { ...(yield* workerEnv(stage)) },
      dev: { port: 3000 },
      // Hash only what shapes the build. Waku adds the workspace packages it
      // bundles (@repo/web-core) on its own; the lockfile covers dependencies.
      memo: {
        include: ["src/**", "package.json", "tsconfig.json", "waku.config.ts"],
        lockfile: true,
      },
    });

    return {
      url: website.url,
    };
  }).pipe(Effect.orDie),
);
