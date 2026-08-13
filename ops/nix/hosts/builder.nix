{...}: {
  imports = [
    ../hardware/builder.nix
    ../profiles/base.nix
    ../profiles/deployer.nix
  ];

  networking.hostName = "ops-demo-builder";
}
