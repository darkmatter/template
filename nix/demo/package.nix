{pkgs}: let
  bunDeps = pkgs.bun2nix.fetchBunDeps {
    bunNix = ../../bun.nix;
  };
in
  pkgs.stdenv.mkDerivation {
    pname = "ops-demo";
    version = "0.1.0";
    src = ../..;
    nativeBuildInputs = [
      pkgs.bun2nix.hook
      pkgs.bun
      pkgs.makeWrapper
    ];

    inherit bunDeps;

    # copyfile: bun2nix's default symlink backend points into isolated
    # bun-pkg cache entries that cannot see sibling Effect packages.
    bunInstallFlags = "--linker=hoisted --backend=copyfile --frozen-lockfile";

    postPatch = ''
      ${pkgs.jq}/bin/jq 'del(.scripts.prepare)' package.json > package.json.tmp
      mv package.json.tmp package.json
    '';

    buildPhase = ''
      runHook preBuild
      runHook postBuild
    '';

    dontStrip = true;

    installPhase = ''
      runHook preInstall
      mkdir -p $out/lib/ops-demo $out/bin
      cp -R . $out/lib/ops-demo
      makeWrapper ${pkgs.bun}/bin/bun $out/bin/ops-demo \
        --chdir $out/lib/ops-demo \
        --add-flags "run --no-install apps/web/src/server.ts"
      runHook postInstall
    '';
  }
