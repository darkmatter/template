// @ts-check
// Deep-module enforcement for dependency-cruiser.
//
// Each package under the packages root is a DEEP MODULE: a lot of behaviour
// behind a small interface. A package's PUBLIC SURFACE is its ENTRY POINT:
// src/index.ts, re-exported through the package manifest's "." export.
// Everything else in src/ is private implementation. Apps (in apps/) are not
// packages: they import packages through their entry points and each other
// not at all.
//
// The only thing you should ever need to edit here is PACKAGES_ROOT.

/** Where packages live. One immediate child dir per package (flat, no nesting). */
const PACKAGES_ROOT = "packages";

// --- derived patterns (no need to edit) -------------------------------------
const R = PACKAGES_ROOT;
/**
 * A package's private internals: anything inside src/ except the entry
 * point itself. src/index.ts is NOT matched (it stays importable from
 * outside); every other file in src/ IS matched, at root level or nested.
 */
const PACKAGE_INTERNALS = `^${R}/[^/]+/src/(?!index\\.ts$).+`;

/** Test folders: a package's test/ directory. */
const PACKAGE_TESTS = `^${R}/([^/]+)/tests?/`;
const PACKAGE_OWN_TESTS = `^${R}/$1/tests?/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "entrypoint-boundary-from-app",
      comment:
        "App/root code may import a package's entry point (its src/index.ts, re-exported as the package root), but nothing else inside the package.",
      severity: "error",
      from: { pathNot: `^${R}/` }, // importer is NOT inside any package
      to: { path: PACKAGE_INTERNALS },
    },
    {
      name: "entrypoint-boundary-across-packages",
      comment:
        "A package's own files import each other freely, but may reach OTHER packages only through their entry points, never their internals.",
      severity: "error",
      // importer is inside a package ($1), but is not a test file
      from: { path: `^${R}/([^/]+)/`, pathNot: PACKAGE_TESTS },
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: `^${R}/$1/`, // same package → intra-package freedom
      },
    },
    {
      name: "tests-through-entrypoints",
      comment:
        "A package's tests exercise it through its entry points like everyone else: they may import any package's entry points and their own test/ fixtures, but never any package's internals, not even their own.",
      severity: "error",
      from: { path: `^${R}/([^/]+)/tests?/` }, // a test file, in package $1
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: PACKAGE_OWN_TESTS, // own tests/ fixtures → allowed
      },
    },
    {
      name: "tests-folder-is-private",
      comment:
        "A package's tests/ folder is reachable only from tests: nothing else may import fixtures.",
      severity: "error",
      from: { pathNot: PACKAGE_TESTS }, // importer is not itself a test
      to: { path: `^${R}/[^/]+/tests?/` },
    },
    {
      name: "no-circular",
      comment: "No dependency cycles.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    // TypeScript 7 has no stable API; parse with SWC so .ts files are actually
    // cruised (without this depcruise silently skips them).
    parser: "swc",
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)(node_modules|dist|target|\\.direnv|\\.alchemy)/",
    },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
