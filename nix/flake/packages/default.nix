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
      // pkgs.lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux (let
        webImage = import ../../../ops/container/web/image.nix {inherit pkgs;};
      in {
        # A script that streams the image; CI pipes it straight to skopeo.
        web-image = webImage;
        # The same image as a file. The stream script only runs on Linux, so
        # this is what a macOS host builds (on a Linux builder) and loads.
        web-image-archive = pkgs.runCommand "template-web-image.tar" {} "${webImage} > $out";
      });
  };
}
