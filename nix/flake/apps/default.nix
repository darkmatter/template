{...}: {
  perSystem = {config, ...}: {
    apps.default = {
      type = "app";
      program = "${config.packages.agent-harness}/bin/agent-harness";
    };
    apps.cli = {
      type = "app";
      program = "${config.packages.agent-harness}/bin/agent-harness";
    };
    apps.harnessd = {
      type = "app";
      program = "${config.packages.agent-harness}/bin/agent-harnessd";
    };
    apps.web = {
      type = "app";
      program = "${config.packages.agent-harness}/bin/agent-harness-web";
    };
  };
}
