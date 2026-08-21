# Encrypted secrets

This directory is the encrypted source of truth for secrets used by environments. The committed fixture contains only a harmless demonstration value and was encrypted with a throwaway age recipient; its private key was deliberately not committed.

Before adopting this repository, create an age key for the team, replace the recipient in `.sops.yaml`, then create real per-environment files:

```sh
age-keygen -o ~/.config/sops/age/keys.txt
grep 'public key' ~/.config/sops/age/keys.txt
sops ops/secrets/production.sops.yaml
```

Never commit an age private key, a decrypted file, or a plaintext `.env` file. An environment composition should reference a secret through its deployment/GitOps controller, rather than copying secret values into `ops/environments/`.

## Alchemy demo

`../alchemy/sops-demo/alchemy.run.ts` reads `demo.sops.yaml` through
`alchemy-sops` and returns only non-secret metadata. After replacing the demo
recipient and re-encrypting the document with your team identity, run it from
the repository root:

```sh
export SOPS_AGE_KEY="$(grep '^AGE-SECRET-KEY-' ~/.config/sops/age/keys.txt | head -1)"
bun run demo:sops
bun run demo:sops:destroy
```

The checked-in document's throwaway private identity is intentionally absent,
so the real command should fail until the recipient has been replaced. The
provider-style test covers the integration without committing an identity or
revealing a decrypted value.
