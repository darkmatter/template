{
  description = "Minimal TS + Rust library workspace flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem = { pkgs, config, ... }: {
        treefmt = {
          projectRootFile = "flake.nix";
          programs.nixfmt.enable = true;
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_22
            rustc
            cargo
            clippy
            rustfmt
            rust-analyzer
            config.treefmt.build.wrapper
          ];
        };
      };
    };
}
