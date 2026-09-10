{pkgs}: let
  agentHarness = import ./package.nix {inherit pkgs;};
in
  pkgs.runCommand "agent-harness-smoke" {
    nativeBuildInputs = [pkgs.curl];
  } ''
    ${agentHarness}/bin/agent-harness run --json "Nix CLI smoke" >cli.json
    grep '"summary"' cli.json

    export HOST=127.0.0.1
    export PORT=43001
    export APP_ENV=test
    ${agentHarness}/bin/agent-harness-web >web.log 2>&1 &
    web_pid=$!
    export HARNESSD_HOST=127.0.0.1
    export HARNESSD_PORT=43002
    ${agentHarness}/bin/agent-harnessd >harnessd.log 2>&1 &
    harnessd_pid=$!
    trap 'kill $web_pid $harnessd_pid 2>/dev/null || true; cat web.log harnessd.log >&2 || true' EXIT
    for _ in $(seq 1 50); do
      if curl -sf "http://127.0.0.1:43001/api/status" >/dev/null; then
        break
      fi
      sleep 0.1
    done
    curl -sf "http://127.0.0.1:43001/api/status" | grep test
    curl -sf "http://127.0.0.1:43001/" | grep "Effect-native agent harness"
    for _ in $(seq 1 50); do
      if curl -sf "http://127.0.0.1:43002/health" >/dev/null; then
        break
      fi
      sleep 0.1
    done
    curl -sf "http://127.0.0.1:43002/health" | grep harnessd
    curl -sf "http://127.0.0.1:43002/runs" \
      -H 'content-type: application/json' \
      -d '{"goal":"Nix daemon smoke"}' | grep RunCompleted
    touch $out
  ''
