{...}: {
  perSystem = {
    config,
    pkgs,
    ...
  }: {
    treefmt = {
      programs.alejandra.enable = true;
      programs.oxfmt.enable = true;
      settings.excludes = ["*.sops.yaml" "flake.lock"];
    };

    devShells.default = pkgs.mkShell {
      packages = [
        config.packages.prelude
        pkgs.age
        pkgs.bun
        pkgs.git
        pkgs.jq
        pkgs.kubectl
        pkgs.kustomize
        pkgs.sops
        pkgs.yq-go
      ];
      shellHook = ''
        motd

        repoRoot=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
        export PATH="node_modules/.bin:$repoRoot/node_modules/.bin:$PATH"
      '';
    };
  };
}
