# 0003 — Store deploy-time secrets with SOPS

- **Status:** accepted
- **Date:** 2026-08-21
- **Deciders:** Cooper Maruyama

## Context

The template needs to demonstrate deploy-time configuration without teaching
contributors to check in plaintext credentials. Secrets must be reviewable as
versioned artifacts while remaining encrypted at rest.

The template includes `.sops.yaml`, `ops/secrets/`, `.gitignore` exclusions
for plaintext `.env` files and `*.agekey`, and web app configuration that can
layer `APP_SOPS_FILE` through `alchemy-sops`.

`AGENTS.md` says secrets are SOPS-encrypted with age, decrypted files and age
private keys must never be checked in, and encrypted manifests should expose
secrets to deployments rather than copying plaintext into environment overlays.

## Decision

Store deploy-time secret material as SOPS-encrypted files under `ops/secrets/`.
Use age recipients declared in `.sops.yaml`. Application code may consume
secrets through an explicit configuration provider, such as the web app's
optional `APP_SOPS_FILE`, but domain packages must not read plaintext secrets
directly.

Plaintext `.env`, `.env.*`, decrypted secret files, and private age keys remain
untracked.

## Why

- **Check in plaintext example secrets.** Rejected because the template would
  teach an unsafe default.
- **Keep secrets only in local `.env` files.** Rejected because deployment and
  GitOps flows need reviewable encrypted manifests.
- **Let app code read decrypted files ad hoc.** Rejected because typed config
  providers keep secret access explicit and testable.

## Trade-offs

The template demonstrates secret handling without checking in credentials. CI
and operators can reason about which files may contain encrypted material, and
apps can add secret-backed config behind typed configuration boundaries.

The cost is setup overhead: contributors need SOPS and the right age/keyservice
access to decrypt or update protected values. Tests and status endpoints must
avoid depending on plaintext secrets.
