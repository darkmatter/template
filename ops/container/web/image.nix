# The production web image: the files the Dockerfile beside this file ships
# (production dependencies installed without lifecycle scripts, plus the
# web app's Waku build), run by nixpkgs' Bun instead of the Dockerfile's
# oven/bun base image. Nix builds it so CI can publish from a runner without
# a Docker daemon; skopeo pushes the result. The Dockerfile stays the recipe
# for the local compose stacks; change both together.
{pkgs}: let
  bunDeps = pkgs.bun2nix.fetchBunDeps {
    bunNix = ../../../nix/bun.nix;
  };
  # The build needs dev dependencies (the shared tsconfig in @repo/tooling),
  # so the image takes the Waku output the demo package already builds.
  demo = import ../../../nix/demo/package.nix {inherit pkgs;};
  web = pkgs.stdenv.mkDerivation {
    pname = "template-web";
    version = "0.1.0";
    src = ../../..;
    nativeBuildInputs = [
      pkgs.bun2nix.hook
      pkgs.bun
      pkgs.makeWrapper
    ];
    inherit bunDeps;
    # --production, as in the Dockerfile: dev dependencies would multiply the
    # image size. copyfile/hoisted for the same reason as nix/demo/package.nix.
    bunInstallFlags = "--linker=hoisted --backend=copyfile --frozen-lockfile --production";
    # The Dockerfile installs with --ignore-scripts. The hook already does,
    # then by default re-runs the install with lifecycle scripts; skip that.
    dontRunLifecycleScripts = true;
    buildPhase = ''
      runHook preBuild
      runHook postBuild
    '';
    dontStrip = true;
    # The build bundles @repo/web-core; the server needs only its dist and
    # the production packages it imports. Links to workspaces left out of the
    # image are dropped so none dangle.
    installPhase = ''
      runHook preInstall
      app=$out/lib/template-web
      mkdir -p $app/apps/web $out/bin
      cp -R package.json node_modules $app/
      cp apps/web/package.json $app/apps/web/
      cp -R ${demo}/lib/agent-harness-demo/apps/web/dist $app/apps/web/dist
      find $app/node_modules -xtype l -delete
      makeWrapper ${pkgs.bun}/bin/bun $out/bin/template-web \
        --chdir $app/apps/web \
        --add-flags "run --no-install dist/serve-node.js"
      runHook postInstall
    '';
  };
in
  pkgs.dockerTools.streamLayeredImage {
    name = "ghcr.io/darkmatter/template";
    contents = [
      web
      pkgs.dockerTools.binSh
      pkgs.dockerTools.caCertificates
      pkgs.dockerTools.fakeNss
      pkgs.dockerTools.usrBinEnv
    ];
    extraCommands = ''
      mkdir -p tmp
      chmod 1777 tmp
    '';
    config = {
      Cmd = ["/bin/template-web"];
      Env = ["HOME=/tmp"];
      ExposedPorts = {"3000/tcp" = {};};
      Labels = {
        "org.opencontainers.image.source" = "https://github.com/darkmatter/template";
      };
      User = "nobody";
    };
  }
