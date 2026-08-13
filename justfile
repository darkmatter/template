default: nixsh
  @exec x

# Onboarding helper - Add this to any cmd that should run in the devshell
[private]
nixsh:
    @test -n "${IN_NIX_SHELL:-}" || { \
        echo "error: not in the devshell — one-time setup:" >&2; \
        echo "  1. install Nix:  https://nixos.org/download" >&2; \
        echo "  2. install direnv, then run:  direnv allow" >&2; \
        exit 2; }

shell:
  nix develop

check: nixsh
  bun run check

test: nixsh
  bun run test

dev: nixsh
  bun run dev

fmt: nixsh
  nix fmt

container-config: nixsh
  docker compose -f ops/compose/local.yaml config

container-up: nixsh
  docker compose -f ops/compose/local.yaml up --build
