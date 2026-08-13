# Architecture boundary

The application is intentionally small: `apps/web` serves a page, a status
endpoint, and a Prometheus-compatible request counter through Effect and Bun.
Domain helpers live in `packages/web-core` so they can be tested without the
HTTP server.

`flake.nix` stays at the root because Nix discovers flakes there. `flake/` is
the thin public output layer. `nix/demo/` holds the package and smoke-check
implementation. `nix/prelude.nix` is the Prelude catalogue.

`ops/deploy/kubernetes/base` defines the portable workload. Each directory
under `ops/environments` composes that base with its own namespace, hostname,
replicas, runtime config, and image reference. Production uses a digest rather
than a mutable image tag.

`ops/observability` is versioned next to the service it observes. Its Prometheus
configuration can scrape the local Compose service, and Grafana provisions the
included dashboard automatically.
