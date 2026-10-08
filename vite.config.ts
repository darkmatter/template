import {
  antipattern,
  effectNative,
  recommended,
  style,
} from "@effect/tsgo/oxlint-presets";
import { organizationConfig } from "@repo/tooling/organization";
import type { OxlintConfig } from "vite-plus/lint";
import { configDefaults, defineConfig } from "vite-plus";

type ImportExtensionsRule = NonNullable<
  OxlintConfig["rules"]
>["import/extensions"];

// Oxlint 1.78 ignores ignorePackages in per-extension mode. Match public
// package specifiers explicitly, preserving checks for relative and private
// aliases.
// SAFETY: the native parser accepts flat options; its generated type models
// pattern.
const explicitTypeScriptImports = [
  "warn",
  {
    ts: "always",
    tsx: "always",
    mts: "always",
    cts: "always",
    pathGroupOverrides: [
      { pattern: "@?*/**", action: "ignore" },
      { pattern: "[!./@#~]*{,/**}", action: "ignore" },
      // Single-segment `#` specifiers (`#theme.ts`) are package-`imports`
      // aliases, not bare packages: oxlint's `import/extensions` misclassifies
      // them as external packages (multi-segment `#foo/bar.ts` classifies
      // correctly) and warns even with the extension present.
      { pattern: "#*", action: "ignore" },
    ],
    checkTypeImports: true,
  },
] as ImportExtensionsRule;

const organizationRoots: readonly string[] = ["apps/*/src", "packages/*/src"];

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: "node",
    exclude: [...configDefaults.exclude, ".direnv/**", "vendor/**"],
    include: ["**/*.test.ts"],
  },
  lint: {
    plugins: ["eslint", "import", "node", "typescript", "unicorn"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    extends: [
      recommended,
      antipattern,
      effectNative,
      style,
      organizationConfig({
        roots: organizationRoots,
      }),
    ],
    ignorePatterns: [
      ".agents/**",
      "vendor/**",
      "**/*.sops.yaml",
      "**/*.sops.json",
      "**/routeTree.gen.ts",
      "**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx}",
      "**/{test,tests,__tests__,e2e}/**",
      "nix/bun.nix",
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "eslint/max-lines": [
        "warn",
        { max: 300, skipComments: true, skipBlankLines: true },
      ],
      "node/no-process-env": "error",
      "eslint/no-extra-bind": "error",
      "eslint/complexity": ["error", { max: 15 }],
      "import/extensions": explicitTypeScriptImports,
      "max-depth": ["error", { max: 2 }],
      "max-nested-callbacks": ["error", { max: 2 }],
      "unicorn/max-nested-calls": ["error", { max: 3 }],
    },
    overrides: [
      {
        files: [
          "apps/**",
          "ops/**",
          "packages/*/src/**",
          "packages/*/test/**",
          "packages/*/tests/**",
        ],
        rules: { "effecttsgo/missing-pipeable-signature": "off" },
      },
      {
        files: ["apps/web/**/*.ts"],
        rules: { "effecttsgo/duplicate-package": "off" },
      },
      {
        files: ["apps/web/public/**/*.js"],
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
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    printWidth: 80,
    ignorePatterns: [
      "**/*.sops.yaml",
      "**/routeTree.gen.ts",
      ".agents/**",
      "packages/tooling/src/secrets.yaml",
      "vendor/**",
    ],
    sortPackageJson: true,
  },
});
