{inputs, ...}: {
  perSystem = {system, ...}: let
    pkgs = import inputs.nixpkgs {
      inherit system;
      overlays = [inputs.bun2nix.overlays.default];
    };
    # Every Nix build and the devshell run nixpkgs' Bun; CI's setup-bun and
    # the lockfile follow packageManager. Fail here when the two drift:
    # bump the nixpkgs input or packageManager until they agree.
    wantedBun = pkgs.lib.removePrefix "bun@" (pkgs.lib.importJSON ../../../package.json).packageManager;
  in {
    checks.bun-version = assert pkgs.lib.assertMsg (pkgs.bun.version == wantedBun)
    "nixpkgs provides bun ${pkgs.bun.version}, but package.json packageManager wants ${wantedBun}";
      pkgs.emptyFile;
    checks.smoke = import ../../demo/check.nix {inherit pkgs;};
    checks.template-slices = import ./templates.nix {
      inherit pkgs;
      templates = inputs.self.templates;
      source = inputs.self.outPath;
    };
  };
}
