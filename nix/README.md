# ACME

Welcome to the acme project. We hope you'll like it here.

## Getting Started

Enter the development shell, then materialise the locked JavaScript toolchain:

```sh
nix develop
bun install --frozen-lockfile
```

Use Prelude's stable commands for validation:

```sh
x typecheck
x test
```

Effectful TypeScript follows the repository's [Effect Solutions policy](../AGENTS.md). The live [Effect Solutions guide](https://www.effect.solutions/) is the canonical reference; ordinary pure domain transformations remain plain TypeScript.

## Dev TLS

The devshell ships two commands for serving the dev server over the internal CA:

```
x tls:init-sops    # one-time, new project: default .sops.yaml from gist.dm.sh
x tls:setup        # materialise the shared certificate onto this machine
```

Configure the hostname in `flake.nix`:

```nix
devTls = {
  enable = true;
  hostname = "app.lan";     # MagicDNS resolves *.lan to 127.0.0.1
};
```

The certificate is shared through SOPS rather than committed. The `.crt` is
public and would be harmless to commit — the private key is the credential, and
because every developer trusts the internal CA, whoever holds it can present a
valid-looking `hostname` to anyone whose name resolution they can influence. Git
history is permanent too, so a committed key needs a history rewrite and CA
revocation rather than a re-issue.

After `tls:init-sops`, add a `creation_rule` for the certificate scoped to
people — not CI, not production. Neither has any use for a MITM-capable dev
credential, and the default catch-all rule would grant it to both.

To mint and share a new certificate:

```
dev-tls issue --save    # writes ops/secrets/dev-tls.sops.yaml; commit it
```

Serving TLS in dev matters if you use passkeys: a WebAuthn credential is bound
to one relying party, derived from the origin, so reaching the dev server by any
other name is rejected by the browser before a prompt appears — with nothing in
the UI to explain it. Pick one dev hostname and keep to it.
