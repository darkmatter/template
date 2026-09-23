import { resolve } from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // This file lives in .config/; run tests from the repo root.
  root: resolve(import.meta.dirname, ".."),
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, ".direnv/**", "vendor/**"],
    include: ["**/*.test.ts"],
  },
});
