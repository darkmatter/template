import { recommended } from "@effect/tsgo/oxlint-presets";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [recommended],
  ignorePatterns: ["**/*.sops.yaml"],
  rules: {
    "effecttsgo/duplicate-package": "off",
    "max-lines": [
      "error",
      { max: 150, skipBlankLines: true, skipComments: true },
    ],
  },
});
