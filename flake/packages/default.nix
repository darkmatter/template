{ nixpkgs, forAllSystems }:
forAllSystems (system:
  let
    pkgs = import nixpkgs { inherit system; };
    opsDemo = import ../../src/demo/package.nix { inherit pkgs; };
  in rec {
    ops-demo = opsDemo;
    default = opsDemo;
  })
