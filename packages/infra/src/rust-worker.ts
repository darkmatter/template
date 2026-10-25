import * as Cloudflare from "alchemy/Cloudflare";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";
import { Path } from "effect/Path";

import { ArtifactStore } from "#storage.ts";

/**
 * A Cloudflare Worker written in Rust with workers-rs.
 *
 * Alchemy does not compile Rust, so `worker-build` (on the devshell PATH)
 * turns the crate into a JS shim plus a `.wasm` module, and the Worker
 * uploads that output unchanged (`bundle: false`). Deriving `main` from the
 * build output makes every deploy build first; the build is skipped when the
 * crate is unchanged.
 */
export const RustWorker = Effect.gen(function* () {
  const path = yield* Path;
  const crateDir = path.resolve(
    import.meta.dirname,
    "../../../crates/cloudflare-worker-example",
  );

  const build = yield* Command.Build("RustWorkerBuild", {
    command: "worker-build --release",
    cwd: crateDir,
    outdir: "build",
    memo: {
      // Paths are relative to the crate. The workspace manifest, lockfile, and
      // cargo config also shape the wasm output.
      include: [
        "src/**",
        "Cargo.toml",
        "../../Cargo.toml",
        "../../Cargo.lock",
        "../../.cargo/config.toml",
      ],
    },
  });

  return yield* Cloudflare.Worker("RustWorker", {
    main: build.outdir.pipe(
      Output.map((outdir) => path.join(outdir, "index.js")),
    ),
    bundle: false,
    env: {
      ARTIFACTS: ArtifactStore,
      GREETING: "Hello from Rust!",
    },
  });
});
