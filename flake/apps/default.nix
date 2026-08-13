{...}: {
  perSystem = {config, ...}: {
    apps.default = {
      type = "app";
      program = "${config.packages.ops-demo}/bin/ops-demo";
    };
  };
}
