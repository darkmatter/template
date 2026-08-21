# Ops monorepo demo

A small Bun + Effect web application with a deliberately structured
operational surface. It is the org reference for the preferred TypeScript
toolchain (Bun, tsgo, oxlint/oxfmt) and a Nix flake-parts + Prelude
devshell, without treating `ops/` as a junk drawer.

## Install

Enter the Nix development shell (direnv will do this after `direnv allow`):

```sh
nix develop
bun install
```

## Usage

```sh
x                 # interactive command picker
x dev             # Effect/Bun demo server
x check           # tsgo typecheck
x test            # Vitest
x lint            # oxlint
x fmt             # treefmt (alejandra + oxfmt)
```

Open <http://localhost:3000>, or verify the API directly:

```sh
curl http://localhost:3000/api/status
```

Run the packaged application without entering a shell:

```sh
nix run .
```

Run the equivalent containerized stack:

```sh
docker compose -f ops/compose/local.yaml up --build
```

Set `OPS_DEMO_PORT` if port 3000 is already in use.

## SOPS config in the web app

The existing web app can add the checked-in encrypted Kubernetes Secret to its
Effect config provider chain through `alchemy-sops@0.8.1`. Environment values
remain primary, and the status endpoint reports only whether `DEMO_MESSAGE` was
configured; the decrypted value never enters the response.

Run the identity-free provider integration test:

```sh
bun run test -- apps/web/test/sops-config.test.ts
```

To run the app against the real decrypt path after replacing the demo SOPS
recipient with your team recipient, follow
[ops/secrets/README.md](ops/secrets/README.md).

## Layout

- `apps/` and `packages/` are application source and reusable code.
- `flake.nix` and `flake.lock` remain at the root because Nix discovers flakes there.
- `flake/` is the intentionally thin public Nix-output layer.
- `nix/demo/` holds the Nix package implementation.
- `nix/prelude.nix` is the Prelude command catalogue.
- `ops/` contains operational configuration: containers, deployment bases, environment bindings, SOPS material, observability, and policies.

See [ops/README.md](ops/README.md) for the boundary of each operational directory.

## Contributing

See [AGENTS.md](AGENTS.md) for the toolchain contract. Verify with
`bun run check`, `bun run test`, `bun run lint`, and `nix flake check`.

## License

Private reference repository.
