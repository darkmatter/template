# Architecture boundary

The application is intentionally small: `apps/web` serves a page, a status endpoint, and a Prometheus-compatible request counter. The rest of the repository demonstrates ownership boundaries around it.

`ops/deploy/kubernetes/base` defines the portable workload. Each directory under `ops/environments` composes that base with its own namespace, hostname, replicas, runtime config, and image reference. Production uses a digest rather than a mutable image tag.

`ops/observability` is versioned next to the service it observes. Its Prometheus configuration can scrape the local Compose service, and Grafana provisions the included dashboard automatically.
