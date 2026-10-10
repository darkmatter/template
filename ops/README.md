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

The public Nix flake surface is deliberately separate in `../nix/flake/`: it exposes package, app, check, and development-shell output names. `ops/nix/` is for Nix configuration about real operational machines and profiles.

## Data services

Postgres is the preferred default data store for Darkmatter TypeScript apps.
Local, staging, and production operational notes should start from Postgres
(`kysely` + `pg` or `@effect/sql-pg` in application code) and place supporting
configuration under `ops/config/postgres/`. D1 or SQLite can appear only as
explicit Cloudflare-local or legacy demo support, not as the recommended app
database.

### Database deployment patterns

Development and production use deliberately different database provisioning
patterns:

- **Development shared database:** Use a development-only shared Postgres
  cluster and create this application's database through Bytebase. Bytebase
  owns administrative database creation; application migrations remain in this
  repository.
- **Production dedicated database:** `ops/deploy/kubernetes/database/` defines
  `template-postgres`, a dedicated CloudNativePG cluster with its own bootstrap
  credential, TLS-only connections, daily base backups, and continuous WAL
  archiving. The production Kustomization consumes the encrypted bootstrap
  secret through KSOPS.

The shared `postgres` cluster in `darkmatter/gitops` is production
infrastructure, not a development target. Never use it to demonstrate or test
the shared-development pattern. The R2 backup credential for the production
cluster is platform infrastructure and is provisioned in `darkmatter/gitops`;
the application repository owns the CNPG database definition and application
migrations.
