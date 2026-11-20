# Encrypted secrets

This directory is the encrypted source of truth for secrets used by environments. The committed fixture contains only a harmless demonstration value and was encrypted with a throwaway age recipient; its private key was deliberately not committed.

Before adopting this repository, create an age key for the team, replace the recipient in `.sops.yaml`, then create real per-environment files:

```sh
age-keygen -o ~/.config/sops/age/keys.txt
grep 'public key' ~/.config/sops/age/keys.txt
sops ops/secrets/production.sops.yaml
```

Never commit an age private key, a decrypted file, or a plaintext `.env` file. An environment composition should reference a secret through its deployment/GitOps controller, rather than copying secret values into `ops/environments/`.

## Existing app integration

`apps/web/alchemy.run.ts` reads `DEMO_MESSAGE` at deploy time and binds it to
the Worker as a secret. When `APP_SOPS_FILE` is set and the deploy environment
does not set `DEMO_MESSAGE`, it is read from that SOPS document. After
replacing the demo recipient and re-encrypting the document with your team
identity, run the app from the repository root (`bun run dev` delegates to
`apps/web`):

```sh
export APP_SOPS_FILE="$PWD/ops/secrets/demo.sops.yaml"
bun run dev
```

`sops-age` discovers the identity through standard SOPS locations and variables,
including `SOPS_AGE_KEY` and `SOPS_AGE_KEY_FILE`. The checked-in document's
throwaway private identity is intentionally absent, so the real path should
fail until the recipient has been replaced. `apps/web/src/worker-env.test.ts`
covers the same provider integration with synthetic plaintext and never reveals
a real decrypted value. The Worker itself never decrypts: the self-hosted
server reads `DEMO_MESSAGE` from its environment, which a deployment supplies
through its secret controller.
