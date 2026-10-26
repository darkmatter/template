{inputs, ...}: let
  # Skills from darkmatter/skills exposed to agents working in this repo.
  # .agents/ is generated (gitignored); bump with `nix flake update darkmatter-skills`.
  repoSkills = ["darkmatter-repo-setup"];
  hasApps = builtins.pathExists ../../../apps;
  hasTypeScript = builtins.pathExists ../../../package.json;
  hasRust = builtins.pathExists ../../../Cargo.toml;
in {
  perSystem = {
    config,
    lib,
    pkgs,
    ...
  }: {
    treefmt = {
      # TypeScript, JSON, Markdown, and YAML are formatted by `vp fmt`, which
      # reads its settings from vite.config.ts; oxfmt run outside Vite+ cannot.
      programs.alejandra.enable = true;
      settings.excludes = ["*.sops.yaml" "flake.lock"];
    };

    devShells.default = pkgs.mkShell {
      packages =
        [pkgs.git config.treefmt.build.wrapper]
        ++ lib.optionals hasTypeScript [pkgs.bun pkgs.nodejs_24]
        ++ lib.optionals hasRust [pkgs.cargo pkgs.rustc pkgs.rustfmt pkgs.clippy pkgs.rust-analyzer]
        ++ lib.optionals hasApps [
          config.packages.prelude
          pkgs.age
          pkgs.jq
          pkgs.kubectl
          pkgs.kustomize
          pkgs.sops
          pkgs.yq-go
        ];
      shellHook = lib.optionalString hasApps ''
        motd

        repoRoot=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
        export PATH="node_modules/.bin:$repoRoot/node_modules/.bin:$PATH"

        mkdir -p "$repoRoot/.agents/skills"
        ${lib.concatMapStrings (name: ''
            ln -sfn ${inputs.darkmatter-skills}/skills/${name} "$repoRoot/.agents/skills/${name}"
          '')
          repoSkills}
      '';
    };
  };
}
