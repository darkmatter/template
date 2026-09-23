#!/usr/bin/env bash
# Fail when the repo root tracks an entry that ops/policies/repo-root/allowed
# does not list. Reads the git index, so it checks what is about to be
# committed, not untracked or ignored files on disk.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
allowlist="ops/policies/repo-root/allowed"

actual=$(git ls-files | cut -d/ -f1 | sort -u)
allowed=$(grep -vE '^\s*(#|$)' "$allowlist" | sort -u)

unexpected=$(comm -23 <(echo "$actual") <(echo "$allowed"))
if [[ -n "$unexpected" ]]; then
  echo "Unexpected entries at the repository root:" >&2
  sed 's/^/  /' <<<"$unexpected" >&2
  echo "Move them under an existing directory (tool config goes in .config/)," >&2
  echo "or add them to $allowlist if a tool requires the root." >&2
  exit 1
fi
