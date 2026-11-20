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
    agentHarness = import ../../demo/package.nix {inherit pkgs;};
  in {
    packages =
      {
        agent-harness = agentHarness;
        default = config.packages.agent-harness;
        # The generator for nix/bun.nix. Exposed so regeneration uses the flake
        # input's pin rather than a branch tip that may have moved since.
        bun2nix = pkgs.bun2nix;
      }
      # The production web image (ops/container/web/image.nix). Linux-only:
      # dockerTools images and their target are Linux regardless of the
      # building system.
      // pkgs.lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
        web-image = import ../../../ops/container/web/image.nix {inherit pkgs;};
      };
  };
}
