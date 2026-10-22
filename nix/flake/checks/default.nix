{inputs, ...}: {
  perSystem = {system, ...}: let
    pkgs = import inputs.nixpkgs {
      inherit system;
      overlays = [inputs.bun2nix.overlays.default];
    };
  in {
    checks.smoke = import ../../demo/check.nix {inherit pkgs;};
    checks.template-slices = import ./templates.nix {
      inherit pkgs;
      templates = inputs.self.templates;
      source = inputs.self.outPath;
    };
  };
}
