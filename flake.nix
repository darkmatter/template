{
  description = "Effect-native agent harness with CLI, daemon, desktop, and Rust edges";

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
    # Source only: the devshell links repo-local agent skills from here.
    # git+https (not github:) so a personal registry override for
    # github:darkmatter/skills can't lock this to a local path.
    darkmatter-skills.url = "git+https://github.com/darkmatter/skills";
    darkmatter-skills.flake = false;
  };

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      imports = [./nix/flake];
    };
}
