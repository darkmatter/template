import type { OxlintConfig } from "oxlint";

export interface OrganizationOptions {
  /** Source directory globs, relative to the consuming config. */
  readonly roots: readonly string[];
  /** Additional file globs that retain framework or generated naming. */
  readonly ignore?: readonly string[];
}

const conventionalFiles =
  "^(?:index|app|main|agent|cli|config|errors|constants|types|schemas|fixtures|testing|setup|runtime)(?:\\.[a-z][a-z0-9-]*)*\\.[cm]?[jt]sx?$";

/** Opt-in filename conventions for owner / role / module organization. */
export function organizationConfig(options: OrganizationOptions): OxlintConfig {
  if (options.roots.length === 0) {
    throw new Error("organizationConfig requires at least one source root");
  }
  const roots = options.roots.map((root) =>
    root.replaceAll("\\", "/").replace(/\/+$/u, ""),
  );
  if (roots.some((root) => root.length === 0 || root.endsWith("/**"))) {
    throw new Error(
      "Use source directories such as packages/*/src, without a trailing /**",
    );
  }
  const extensions = "{ts,tsx,mts,cts,js,jsx,mjs,cjs}";
  const filePatterns = roots.map((root) => `${root}/**/*.${extensions}`);

  return {
    plugins: ["unicorn"],
    overrides: [
      {
        files: filePatterns,
        rules: {
          "unicorn/filename-case": [
            "error",
            { case: "kebabCase", multipleFileExtensions: true },
          ],
        },
      },
      {
        files: roots.flatMap((root) => [
          `${root}/**/*.{tsx,jsx}`,
          `${root}/**/{models,services,adapters,components}/**/*.${extensions}`,
        ]),
        rules: {
          "unicorn/filename-case": [
            "error",
            {
              case: "pascalCase",
              multipleFileExtensions: true,
              ignore: [conventionalFiles],
            },
          ],
        },
      },
      {
        files: roots.map(
          (root) =>
            `${root}/**/{workflows,policies,mappers,utils}/**/*.${extensions}`,
        ),
        rules: {
          "unicorn/filename-case": [
            "error",
            { case: "kebabCase", multipleFileExtensions: true },
          ],
        },
      },
      {
        files: roots.map((root) => `${root}/**/hooks/**/*.${extensions}`),
        rules: {
          "unicorn/filename-case": [
            "error",
            { case: "camelCase", multipleFileExtensions: true },
          ],
        },
      },
      {
        files: [
          ...roots.flatMap((root) => [
            `${root}/**/pages/**`,
            `${root}/**/*.generated.*`,
            `${root}/**/*.gen.*`,
            `${root}/**/*.d.{ts,mts,cts}`,
          ]),
          ...(options.ignore ?? []),
        ],
        rules: { "unicorn/filename-case": "off" },
      },
    ],
  };
}
