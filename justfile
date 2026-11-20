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

cli *args: nixsh
  bun run cli {{args}}

harnessd: nixsh
  bun run harnessd

fmt: nixsh
  nix fmt

container-config: nixsh
  docker compose -f ops/compose/local.yaml config

# Build the web image with Nix and load it into Docker as
# ghcr.io/darkmatter/template:local. Images are Linux, so a macOS host needs
# a Linux builder for `system`.
container-image system=(if arch() == "aarch64" { "aarch64-linux" } else { "x86_64-linux" }): nixsh
  docker load < "$(nix build --no-link --print-out-paths .#packages.{{system}}.web-image-archive)"

container-up: container-image
  docker compose -f ops/compose/local.yaml up
