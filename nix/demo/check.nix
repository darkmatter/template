{pkgs}: let
  opsDemo = import ./package.nix {inherit pkgs;};
in
  pkgs.runCommand "ops-demo-smoke" {
    nativeBuildInputs = [pkgs.curl];
  } ''
    export HOST=127.0.0.1
    export PORT=43001
    export APP_ENV=test
    ${opsDemo}/bin/ops-demo >log 2>&1 &
    pid=$!
    trap 'kill $pid 2>/dev/null || true; cat log >&2 || true' EXIT
    for _ in $(seq 1 50); do
      if curl -sf "http://127.0.0.1:43001/api/status" >/dev/null; then
        break
      fi
      sleep 0.1
    done
    curl -sf "http://127.0.0.1:43001/api/status" | grep test
    curl -sf "http://127.0.0.1:43001/" | grep "Ops monorepo demo"
    touch $out
  ''
