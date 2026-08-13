# `ops/` guide

`ops/` owns the operational life of this repository. It is not a catch-all for source-adjacent configuration: a Vite config, package manifest, or application schema still belongs beside the application that uses it.

| Directory        | Owns                                            | Example                                      |
| ---------------- | ----------------------------------------------- | -------------------------------------------- |
| `bin/`           | Human-invoked operational commands              | deploy, migrations, smoke tests              |
| `container/`     | Container build recipes                         | application Dockerfiles and shared bases     |
| `compose/`       | Local multi-service compositions                | app, database, and observability stacks      |
| `config/`        | Runtime configuration for dependencies          | Nginx, PostgreSQL, Redis                     |
| `deploy/`        | Reusable deployment primitives                  | Kubernetes base manifests, Terraform modules |
| `environments/`  | Environment-specific assembly                   | replicas, hostnames, immutable images        |
| `secrets/`       | Encrypted secret material and SOPS rules        | `production.sops.yaml`                       |
| `observability/` | What lets operators see and alert on the system | dashboards, alerts, metrics collection       |
| `nix/`           | Operational host/profile configuration          | builder host, deployer profile               |
| `policies/`      | Guardrails evaluated by automation              | image and dependency policies                |

The public Nix flake surface is deliberately separate in `../flake/`: it exposes package, app, check, and development-shell output names. `ops/nix/` is for Nix configuration about real operational machines and profiles.
