{
  inputs,
  lib,
  ...
}: {
  imports =
    [
      inputs.treefmt-nix.flakeModule
      ./devShells
    ]
    ++ lib.optionals (builtins.pathExists ../../apps) [
      inputs.prelude.flakeModules.default
      ../prelude.nix
      ./apps
      ./checks
      ./packages
    ];

  systems = [
    "x86_64-linux"
    "aarch64-linux"
    "aarch64-darwin"
  ];
}
