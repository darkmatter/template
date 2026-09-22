import { os } from "@orpc/server";
import { Context, Effect, Layer } from "effect";
import { eos, ORPCTaggedError } from "effect-orpc";

export interface PreferredLibsSnapshot {
  readonly database: "postgres";
  readonly rpc: "effect-orpc";
  readonly runtime: "bun-effect";
}

const preferredLibsSnapshot: PreferredLibsSnapshot = {
  database: "postgres",
  rpc: "effect-orpc",
  runtime: "bun-effect",
};

export class PreferredLibsUnavailable extends ORPCTaggedError(
  "PreferredLibsUnavailable",
  {
    code: "PREFERRED_LIBS_UNAVAILABLE",
    message: "Preferred library catalog is unavailable",
    status: 503,
  },
) {}

export class PreferredLibsCatalog extends Context.Service<
  PreferredLibsCatalog,
  {
    readonly describe: Effect.Effect<
      PreferredLibsSnapshot,
      PreferredLibsUnavailable
    >;
  }
>()("@agent-demo/harnessd/orpc/PreferredLibsCatalog") {
  static readonly layer = Layer.succeed(
    PreferredLibsCatalog,
    PreferredLibsCatalog.of({
      describe: Effect.succeed(preferredLibsSnapshot),
    }),
  );
}

const preferredLibsProcedure = eos
  .provide(PreferredLibsCatalog.layer)
  .errors({ PreferredLibsUnavailable })
  .effect(function* () {
    const catalog = yield* PreferredLibsCatalog;
    return yield* catalog.describe;
  });

export const HarnessdOrpcRouter = {
  health: os.handler(() => "ok" as const),
  preferred: {
    libs: preferredLibsProcedure,
  },
};

export type HarnessdOrpcRouter = typeof HarnessdOrpcRouter;
