{ ... }: {
  projectRootFile = "flake.nix";
  programs = {
    prettier.enable = true;
    rustfmt.enable = true;
    nixfmt.enable = true;
    taplo.enable = true;
  };
  # Build outputs are not ours to format.
  settings.global.excludes = [
    "result/*"
  ];
}
