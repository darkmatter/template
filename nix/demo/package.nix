{pkgs}: let
  bunDeps = pkgs.bun2nix.fetchBunDeps {
    bunNix = ../../bun.nix;
  };
in
  pkgs.stdenv.mkDerivation {
    pname = "effect-agent-harness-demo";
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
      mkdir -p $out/lib/agent-harness-demo $out/bin
      cp -R . $out/lib/agent-harness-demo
      makeWrapper ${pkgs.bun}/bin/bun $out/bin/agent-harness \
        --chdir $out/lib/agent-harness-demo \
        --add-flags "run --no-install apps/cli/src/main.ts"
      makeWrapper ${pkgs.bun}/bin/bun $out/bin/agent-harnessd \
        --chdir $out/lib/agent-harness-demo \
        --add-flags "run --no-install apps/harnessd/src/server.ts"
      makeWrapper ${pkgs.bun}/bin/bun $out/bin/agent-harness-web \
        --chdir $out/lib/agent-harness-demo \
        --add-flags "run --no-install apps/web/src/server.ts"
      ln -s agent-harness-web $out/bin/agent-harness-demo
      runHook postInstall
    '';
  }
