{pkgs, ...}: {
  environment.systemPackages = [pkgs.kubectl pkgs.kustomize pkgs.sops];
}
