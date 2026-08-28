#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/setup-azure-sql-local-api.sh"
SCHEMA_FILE="$ROOT_DIR/sql/001_schema.sql"

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
assert_contains "$help_output" "Azure SQL"
assert_contains "$help_output" "api/local.settings.json"
assert_contains "$help_output" "sqlcmd"
assert_contains "$help_output" "--keep-firewall-rule"

set +e
missing_sqlcmd_output="$(PATH="/usr/bin:/bin" "$SCRIPT" --sql-server example.database.windows.net --skip-azure-discovery 2>&1)"
missing_sqlcmd_status=$?
set -e

if [[ "$missing_sqlcmd_status" -eq 0 ]]; then
  fail "expected missing sqlcmd preflight to fail"
fi

assert_contains "$missing_sqlcmd_output" "sqlcmd is required to continue."
assert_contains "$missing_sqlcmd_output" "Install sqlcmd"

script_contents="$(<"$SCRIPT")"
schema_contents="$(<"$SCHEMA_FILE")"

assert_contains "$script_contents" "sqlcmd -b -I -C"
assert_contains "$script_contents" "FIREWALL_RULE_NAME"
assert_contains "$script_contents" "trap cleanup_firewall EXIT"
assert_contains "$script_contents" "RESOURCE_GROUP_SET"
assert_contains "$script_contents" "az resource list"
assert_contains "$script_contents" "Could not resolve resource group for Azure SQL server"
assert_contains "$script_contents" "FROM sys.databases"
assert_contains "$script_contents" "Database already exists; continuing."
assert_contains "$script_contents" "normalize_functions_host_cors"
assert_contains "$script_contents" ".Host.CORS"
assert_contains "$script_contents" ".Host.CORSCredentials = false"
assert_contains "$script_contents" ".Values.Redis__ConnectionString = (.Values.Redis__ConnectionString // \"localhost:6379\")"
assert_contains "$script_contents" ".Values.Cache__Enabled = (.Values.Cache__Enabled // \"true\")"
assert_contains "$schema_contents" "SET QUOTED_IDENTIFIER ON;"

if [[ "$script_contents" == *"--yes"* ]]; then
  fail "setup script should not pass --yes to az sql server firewall-rule delete"
fi

echo "setup Azure SQL local API tests passed"
