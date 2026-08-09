{ pkgs }:
pkgs.stdenvNoCC.mkDerivation {
  pname = "ops-demo";
  version = "0.1.0";
  src = ../../apps/web;
  nativeBuildInputs = [ pkgs.makeWrapper ];

  installPhase = ''
    mkdir -p $out/lib/ops-demo $out/bin
    cp -R . $out/lib/ops-demo
    makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/ops-demo \
      --add-flags "$out/lib/ops-demo/server.mjs"
  '';
}
