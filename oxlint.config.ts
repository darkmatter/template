import { recommended } from "@effect/tsgo/oxlint-presets";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [recommended],
  ignorePatterns: ["**/*.sops.yaml", "**/routeTree.gen.ts", "vendor/**"],
  overrides: [
    {
      files: ["apps/web/**/*.ts"],
      rules: { "effecttsgo/duplicate-package": "off" },
    },
    {
      files: ["apps/web/public/**/*.js", "tests/smoke.test.ts"],
      rules: {
        "effecttsgo/async-function": "off",
        "effecttsgo/global-date": "off",
        "effecttsgo/global-fetch": "off",
        "effecttsgo/global-random": "off",
        "effecttsgo/global-timers": "off",
        "effecttsgo/new-promise": "off",
        "effecttsgo/node-builtin-import": "off",
        "effecttsgo/process-env": "off",
      },
    },
  ],
  rules: {
    "max-lines": [
      "error",
      { max: 150, skipBlankLines: true, skipComments: true },
    ],
  },
});
