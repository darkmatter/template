{inputs, ...}: {
  perSystem = {system, ...}: let
    pkgs = import inputs.nixpkgs {
      inherit system;
      overlays = [inputs.bun2nix.overlays.default];
    };
  in {
    checks.smoke = import ../../nix/demo/check.nix {inherit pkgs;};
  };
}
