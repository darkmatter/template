{ nixpkgs, forAllSystems }:
forAllSystems (system:
  let pkgs = import nixpkgs { inherit system; };
  in {
    default = pkgs.mkShell {
      packages = [ pkgs.age pkgs.jq pkgs.kubectl pkgs.kustomize pkgs.nodejs_22 pkgs.sops pkgs.yq-go ];
      shellHook = ''
        echo "Ops monorepo demo shell: run just, npm test, or nix flake check."
      '';
    };
  })
