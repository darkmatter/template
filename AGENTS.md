# Agent instructions

This is the org reference repo for a Bun + Effect + Nix flake monorepo with a
tidy operational surface. Application code lives in `apps/` and `packages/`.
Operational configuration lives in `ops/`. The public Nix surface is thin
under `flake/`; implementation lives under `nix/`.

## Tooling

- Run installs and scripts with Bun from the repository root.
- Use `.ts` for Bun-owned source. Do not add new `.mjs` application files.
- Typecheck with `tsc` / tsgo: `bun run check`. Do not use `tsc` from an
  unpatched TypeScript 5 install.
- Tests use Vitest: run `bun run test`, never `bun test`.
- Lint with oxlint (`bun run lint`). Format with oxfmt / `nix fmt`.
- Effect/TSGO style warnings are advisory outside intentionally Effect-owned
  code. Keep the tsconfig plugin name as `@effect/language-service`.
- Package configs should depend on `@repo/tooling` and extend
  `@repo/tooling/tsconfig`.
- Put shared versions in the root catalog and use `catalog:` in package
  manifests. Use `workspace:*` and `@repo/*` imports for internal packages.
- Prefer package `#` imports over parent-relative `../` within a package.

## Validation

Start narrow, then run:

```sh
bun run check
bun run test
bun run lint
```

- Add regression tests for behavior changes.
- Never commit decrypted SOPS values or plaintext credentials.
- Preserve unrelated worktree changes and do not commit unless asked.
