{ nixpkgs, forAllSystems }:
forAllSystems (system:
  let pkgs = import nixpkgs { inherit system; };
  in {
    smoke = pkgs.runCommand "ops-demo-smoke" { nativeBuildInputs = [ pkgs.nodejs_22 ]; } ''
      cp -R ${../../apps/web} web
      cp ${../../tests/smoke.test.mjs} smoke.test.mjs
      chmod -R u+w web
      cd web
      APP_DIRECTORY=$PWD node --test ../smoke.test.mjs
      touch $out
    '';
  })
