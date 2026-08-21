{
  description = "Darkmatter Nix Flake Template";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    prelude.url = "github:darkmatter/prelude";
  };

  outputs =
    inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } (
      top@{
        config,
        withSystem,
        moduleWithSystem,
        ...
      }:
      {
        imports = [
          inputs.prelude.flakeModules.default
          ./nix/prelude.nix
          ./nix/dev-tls.nix
          inputs.treefmt-nix.flakeModule
        ];
        systems = [
          "aarch64-darwin"
          "x86_64-linux"
          "aarch64-linux"
        ];

        perSystem = { config, pkgs, ... }: {

          # Dev TLS shared through SOPS. Set the hostname your dev server is
          # reached by; see nix/dev-tls.nix for why the key is not committed.
          devTls = {
            enable = true;
            hostname = "app.lan";
          };

          treefmt.config = {
            projectRootFile = "flake.nix";
            programs = {
              prettier.enable = true;
              rustfmt.enable = true;
              nixfmt.enable = true;
              taplo.enable = true;
            };
            # Build outputs are not ours to format.
            settings.global.excludes = [
              "result/*"
            ];
          };

          devShells.default = pkgs.mkShell {
            name = "myapp-devshell";
            buildInputs = [ ];
            packages = with pkgs; [
              bun
              git
              jq
              sops
              age
              step-cli
              config.packages.prelude
              config.packages.dev-tls
              config.packages.sops-init
            ];

            shellHook = ''
              motd
            '';
          };
        };
      }
    );

}
