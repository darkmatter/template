# Encrypted secrets

This directory is the encrypted source of truth for secrets used by environments. The committed fixture contains only a harmless demonstration value and was encrypted with a throwaway age recipient; its private key was deliberately not committed.

Before adopting this repository, create an age key for the team, replace the recipient in `.sops.yaml`, then create real per-environment files:

```sh
age-keygen -o ~/.config/sops/age/keys.txt
grep 'public key' ~/.config/sops/age/keys.txt
sops ops/secrets/production.sops.yaml
```

Never commit an age private key, a decrypted file, or a plaintext `.env` file. An environment composition should reference a secret through its deployment/GitOps controller, rather than copying secret values into `ops/environments/`.
