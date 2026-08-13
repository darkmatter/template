{inputs, ...}: {
  perSystem = {
    config,
    system,
    ...
  }: let
    pkgs = import inputs.nixpkgs {
      inherit system;
      overlays = [inputs.bun2nix.overlays.default];
    };
    opsDemo = import ../../nix/demo/package.nix {inherit pkgs;};
  in {
    packages.ops-demo = opsDemo;
    packages.default = config.packages.ops-demo;
  };
}
