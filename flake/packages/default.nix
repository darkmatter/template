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
    agentHarness = import ../../nix/demo/package.nix {inherit pkgs;};
  in {
    packages.agent-harness = agentHarness;
    packages.default = config.packages.agent-harness;
  };
}
