{source}: let
  common = [
    ".gitignore"
    "README.md"
    "flake.nix"
    "flake.lock"
    "nix/flake/default.nix"
    "nix/flake/devShells/default.nix"
  ];
  typescript = [
    "package.json"
    "bun.lock"
    "tsconfig.json"
    "vite.config.ts"
    "turbo.json"
    ".config/dependency-cruiser.cjs"
    "ops/policies/repo-root"
    "packages/agent-core"
    "packages/agent-demo"
    "packages/agent-runtime"
    "packages/agent-testkit"
    "packages/sandbox-client"
    "packages/tooling"
    "packages/web-core"
  ];
  rust = ["Cargo.toml" "Cargo.lock" ".cargo" "crates"];
  prefix = parent: child:
    builtins.substring 0 (builtins.stringLength parent) child == parent;
  slice = name: paths: {
    path = builtins.path {
      inherit name;
      path = source;
      filter = path: _type: let
        relative = builtins.substring (builtins.stringLength (toString source) + 1) (-1) (toString path);
      in
        builtins.any
        (entry: relative == entry || prefix "${entry}/" relative || prefix "${relative}/" entry)
        (common ++ paths);
    };
    description = name;
  };
in rec {
  nix-ts-lib =
    (slice "nix-ts-lib" typescript)
    // {
      description = "Maintained TypeScript libraries and shared workspace tooling";
    };
  nix-rust-lib =
    (slice "nix-rust-lib" rust)
    // {
      description = "Maintained Rust crates and Cargo workspace";
    };
  nix-polyglot-lib =
    (slice "nix-polyglot-lib" (typescript ++ rust))
    // {
      description = "Maintained TypeScript libraries and Rust crates";
    };
  default = nix-ts-lib;
}
