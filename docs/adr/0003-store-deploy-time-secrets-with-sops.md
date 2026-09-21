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

SOPS lets a template show realistic deploy-time secret handling while keeping
the encrypted file reviewable in version control. The age recipients in
`.sops.yaml` make access explicit, and the `ops/secrets/` placement keeps
secret material with the rest of the operational surface.

Typed configuration providers keep decrypted values at application boundaries.
That lets apps opt into encrypted configuration without teaching domain packages
to read plaintext files or environment-specific secret paths directly.

## Trade-offs

The template demonstrates secret handling without checking in credentials. CI
and operators can reason about which files may contain encrypted material, and
apps can add secret-backed config behind typed configuration boundaries.

The cost is setup overhead: contributors need SOPS and the right age/keyservice
access to decrypt or update protected values. Tests and status endpoints must
avoid depending on plaintext secrets.
