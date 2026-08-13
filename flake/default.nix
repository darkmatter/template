{inputs, ...}: {
  imports = [
    inputs.treefmt-nix.flakeModule
    inputs.prelude.flakeModules.default
    ../nix/prelude.nix
    ./apps
    ./checks
    ./devShells
    ./packages
  ];

  systems = [
    "x86_64-linux"
    "aarch64-linux"
    "aarch64-darwin"
  ];
}
