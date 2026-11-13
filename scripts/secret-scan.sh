#!/usr/bin/env bash
# Pre-public secret scan for a git repo. Usage: bash secret-scan.sh [repo-dir]
# Exits non-zero if anything suspicious is tracked. Scans filenames AND content.
set -u
repo="${1:-.}"

echo "== suspicious filenames =="
names=$(git -C "$repo" ls-files | grep -iE '\.env|secret|credential|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa|\.keystore$|token' || true)
[ -n "$names" ] && { echo "$names"; } || echo "  none"

echo "== tracked build artifacts / deps (should be none) =="
arts=$(git -C "$repo" ls-files | grep -E 'node_modules/|/dist/|(^|/)target/|\.env$' || true)
[ -n "$arts" ] && echo "$arts" || echo "  none"

echo "== secret-like content =="
content=$(git -C "$repo" grep -nIiE \
  'ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]+|api[_-]?key[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9]{16,}|password[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']+' \
  -- . 2>/dev/null || true)
[ -n "$content" ] && echo "$content" || echo "  none"

if [ -n "$names$arts$content" ]; then
  echo; echo "RESULT: REVIEW NEEDED — found potential secrets/artifacts above."
  exit 1
fi
echo; echo "RESULT: clean."
