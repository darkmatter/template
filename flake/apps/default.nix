{ self, nixpkgs, forAllSystems }:
forAllSystems (system: {
  default = {
    type = "app";
    program = "${self.packages.${system}.ops-demo}/bin/ops-demo";
  };
})
