{
  pkgs,
  templates,
  source,
}: let
  ts = templates.nix-ts-lib.path;
  rust = templates.nix-rust-lib.path;
  polyglot = templates.nix-polyglot-lib.path;
  exists = root: path: builtins.pathExists "${root}/${path}";
  unchanged = root: path:
    builtins.readFile "${root}/${path}" == builtins.readFile "${source}/${path}";
  tsFiles = [
    "package.json"
    "bun.lock"
    "vite.config.ts"
    "packages/agent-core/src/index.ts"
    "packages/agent-runtime/src/index.ts"
    "packages/tooling/src/tsconfig.json"
    "packages/web-core/src/index.ts"
  ];
  rustFiles = [
    "Cargo.toml"
    "Cargo.lock"
    "crates/agent-sandboxd/src/main.rs"
    "crates/alloy-web3-example/src/lib.rs"
  ];
in
  assert templates.default.path == ts;
  assert builtins.all (root: !(exists root "apps") && !(exists root "packages/infra")) [ts rust polyglot];
  assert !(exists ts "Cargo.toml") && !(exists ts "crates");
  assert !(exists rust "package.json") && !(exists rust "packages");
  assert builtins.all (unchanged ts) tsFiles;
  assert builtins.all (unchanged rust) rustFiles;
  assert builtins.all (unchanged polyglot) (tsFiles ++ rustFiles);
    pkgs.runCommand "template-slices-check" {} "touch $out"
