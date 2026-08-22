#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/deploy-local.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"

  if [[ "$haystack" != *"$needle"* ]]; then
    fail "expected output to contain: $needle"
  fi
}

bash -n "$SCRIPT"

help_output="$("$SCRIPT" --help)"
assert_contains "$help_output" "Usage:"
assert_contains "$help_output" "--what-if"
assert_contains "$help_output" "SQL_ADMIN_PASSWORD"
assert_contains "$help_output" "Azure Bicep CLI"

set +e
missing_az_output="$(PATH="/usr/bin:/bin" "$SCRIPT" --skip-login-check --what-if 2>&1)"
missing_az_status=$?
set -e

if [[ "$missing_az_status" -eq 0 ]]; then
  fail "expected missing az preflight to fail"
fi

assert_contains "$missing_az_output" "Azure CLI is required to continue."
assert_contains "$missing_az_output" "Install Azure CLI"

tmp_bin="$(mktemp -d)"
trap 'rm -rf "$tmp_bin"' EXIT

cat > "$tmp_bin/az" <<'STUB'
#!/usr/bin/env bash
if [[ "${1:-}" == "bicep" && "${2:-}" == "version" ]]; then
  exit 1
fi
echo "unexpected az call: $*" >&2
exit 1
STUB
chmod +x "$tmp_bin/az"

set +e
missing_bicep_output="$(PATH="$tmp_bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" "$SCRIPT" --skip-login-check --what-if 2>&1)"
missing_bicep_status=$?
set -e

if [[ "$missing_bicep_status" -eq 0 ]]; then
  fail "expected missing bicep preflight to fail"
fi

assert_contains "$missing_bicep_output" "Azure Bicep CLI is required to continue."
assert_contains "$missing_bicep_output" "az bicep install"

echo "deploy-local CLI tests passed"
