# Ops monorepo demo

A small, dependency-free web application with a deliberately structured operational surface. It is intended as a working reference for keeping a monorepo root tidy without treating `ops/` as a junk drawer.

## Run it

With the Node.js already provided by the Nix development shell (or installed locally):

```sh
nix develop
node apps/web/server.mjs
```

Open <http://localhost:3000>, or verify the API directly:

```sh
curl http://localhost:3000/api/status
node --test tests/smoke.test.mjs
```

Run the packaged application without entering a shell:

```sh
nix run .
```

Run the equivalent containerized stack:

```sh
docker compose -f ops/compose/local.yaml up --build
```

Set `OPS_DEMO_PORT` if port 3000 is already in use, for example `OPS_DEMO_PORT=43124 docker compose -f ops/compose/local.yaml up --build`.

Add local metrics and Grafana:

```sh
docker compose \
  -f ops/compose/local.yaml \
  -f ops/compose/observability.yaml up --build
```

## Layout

- `apps/` and `packages/` are application source and reusable code.
- `flake.nix` and `flake.lock` remain at the root because Nix discovers flakes there.
- `flake/` is the intentionally thin public Nix-output layer.
- `nix/demo/` holds the Nix package implementation.
- `ops/` contains operational configuration: containers, deployment bases, environment bindings, SOPS material, observability, and policies.

See [ops/README.md](ops/README.md) for the boundary of each operational directory.

## Verification

```sh
node --test tests/smoke.test.mjs
nix flake check
nix run .
docker compose -f ops/compose/local.yaml config
```

The encrypted SOPS fixture is intentionally a non-sensitive example. Before using this layout for a real repository, replace its throwaway age recipient as described in [ops/secrets/README.md](ops/secrets/README.md).
