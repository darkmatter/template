{ pkgs, ... }:
{
  environment.systemPackages = [ pkgs.git pkgs.curl ];
}
