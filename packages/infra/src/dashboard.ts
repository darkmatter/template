import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import { Path } from "effect/Path";

export const Dashboard = Effect.gen(function* () {
  const path = yield* Path;

  return yield* Cloudflare.Website.Vite("Dashboard", {
    rootDir: path.resolve(import.meta.dirname, "../../../apps/web"),
    assets: {
      notFoundHandling: "single-page-application",
    },
    dev: {
      port: 3000,
    },
    memo: {
      include: ["**/*", "../../packages/*/src/**"],
      lockfile: true,
    },
  });
});
