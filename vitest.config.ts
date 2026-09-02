import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, ".direnv/**", "vendor/**"],
    include: ["**/*.test.ts"],
  },
});
