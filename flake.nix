{
  description = "Runnable example of a monorepo with a tidy operational surface";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    prelude.url = "github:darkmatter/prelude";
    prelude.inputs.flake-parts.follows = "flake-parts";
    prelude.inputs.nixpkgs.follows = "nixpkgs";
    prelude.inputs.treefmt-nix.follows = "treefmt-nix";
    bun2nix.url = "github:darkmatter/bun2nix/darkmatter";
    bun2nix.inputs.nixpkgs.follows = "nixpkgs";
    bun2nix.inputs.flake-parts.follows = "flake-parts";
    bun2nix.inputs.treefmt-nix.follows = "treefmt-nix";
  };

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      imports = [./flake];
    };
}
