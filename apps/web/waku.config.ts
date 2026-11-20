import { createRequire } from "node:module";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "waku/config";

// Alchemy's Website.Waku owns the server adapter; never set unstable_adapter
// here (the plain `waku build` uses Waku's Node adapter).
//
// Vite's dev server only serves files under the workspace root. Bun installs
// packages under the directory that holds the lockfile it resolved, which in
// a monorepo checkout sits above this project's workspace root; allow it so
// the dev server can load Waku's own entries from there.
const installRoot = createRequire(import.meta.url)
  .resolve("waku/package.json")
  .split("/node_modules/")[0];

export default defineConfig({
  vite: {
    server: {
      fs: {
        allow: [
          searchForWorkspaceRoot(import.meta.dirname),
          ...(installRoot === undefined ? [] : [installRoot]),
        ],
      },
    },
  },
});
