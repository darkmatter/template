{ self, nixpkgs, forAllSystems, ... }:
{
  apps = import ./apps { inherit self nixpkgs forAllSystems; };
  checks = import ./checks { inherit nixpkgs forAllSystems; };
  devShells = import ./devShells { inherit nixpkgs forAllSystems; };
  packages = import ./packages { inherit nixpkgs forAllSystems; };
  formatter = forAllSystems (system: (import nixpkgs { inherit system; }).nixfmt-rfc-style);
}
