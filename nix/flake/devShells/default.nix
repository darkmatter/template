{inputs, ...}: let
  # Skills from darkmatter/skills exposed to agents working in this repo.
  # .agents/ is generated (gitignored); bump with `nix flake update darkmatter-skills`.
  repoSkills = ["darkmatter-repo-setup"];
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
      packages = [
        config.packages.prelude
        pkgs.age
        pkgs.bun
        pkgs.cargo
        pkgs.git
        pkgs.jq
        pkgs.kubectl
        pkgs.kustomize
        pkgs.rustc
        pkgs.rustfmt
        pkgs.sops
        pkgs.yq-go
      ];
      shellHook = ''
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
