#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/deploy-local.sh"
BICEP_TEMPLATE="$ROOT_DIR/infra/main.bicep"
SQL_BICEP_TEMPLATE="$ROOT_DIR/infra/sql.bicep"

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
assert_contains "$help_output" "--sql-only"
assert_contains "$help_output" "--function-plan-sku"
assert_contains "$help_output" "--function-plan-tier"
assert_contains "$help_output" "SQL_ADMIN_PASSWORD"
assert_contains "$help_output" "Azure Bicep CLI"
assert_contains "$help_output" "ServerFarmCreationNotAllowed"

bicep_source="$(cat "$BICEP_TEMPLATE")"
assert_contains "$bicep_source" "param functionPlanSku string"
assert_contains "$bicep_source" "param functionPlanTier string"
assert_contains "$bicep_source" "name: functionPlanSku"
assert_contains "$bicep_source" "tier: functionPlanTier"
assert_contains "$bicep_source" "kind: functionPlanSku == 'FC1' ? 'functionapp' : 'linux'"

sql_bicep_source="$(cat "$SQL_BICEP_TEMPLATE")"
assert_contains "$sql_bicep_source" "resource sqlServer"
assert_contains "$sql_bicep_source" "output sqlServerFullyQualifiedDomainName"

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

cat > "$tmp_bin/az" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "bicep version")
    echo "Bicep CLI version 0.0.0"
    ;;
  "account show")
    echo "{}"
    ;;
  "account set --subscription test-sub")
    ;;
  "provider show --namespace Microsoft.Web --query registrationState --output tsv")
    echo "NotRegistered"
    ;;
  "provider show --namespace Microsoft.Sql --query registrationState --output tsv")
    echo "Registered"
    ;;
  *)
    echo "unexpected az call: $*" >&2
    exit 1
    ;;
esac
STUB
chmod +x "$tmp_bin/az"

set +e
provider_output="$(SQL_ADMIN_PASSWORD=secret AZURE_SUBSCRIPTION_ID=test-sub APIM_PUBLISHER_EMAIL=owner@example.com JWT_AUTHORITY=https://login.microsoftonline.com/tenant/v2.0 JWT_AUDIENCE=api://client PATH="$tmp_bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" "$SCRIPT" --skip-login-check --what-if 2>&1)"
provider_status=$?
set -e

if [[ "$provider_status" -eq 0 ]]; then
  fail "expected unregistered Microsoft.Web preflight to fail"
fi

assert_contains "$provider_output" "Microsoft.Web resource provider is not registered"
assert_contains "$provider_output" "az provider register --namespace Microsoft.Web --wait"

cat > "$tmp_bin/az" <<STUB
#!/usr/bin/env bash
case "\$*" in
  "bicep version")
    echo "Bicep CLI version 0.0.0"
    ;;
  "account show")
    echo "{}"
    ;;
  "account set --subscription test-sub")
    ;;
  "provider show --namespace Microsoft.Sql --query registrationState --output tsv")
    echo "Registered"
    ;;
  "group create --name rg-task-management-dev --location eastus --output table")
    echo "group ok"
    ;;
  *"deployment group what-if"*"--template-file $ROOT_DIR/infra/sql.bicep"*)
    echo "sql only what-if ok"
    ;;
  *)
    echo "unexpected az call: \$*" >&2
    exit 1
    ;;
esac
STUB
chmod +x "$tmp_bin/az"

sql_only_output="$(SQL_ADMIN_PASSWORD=secret AZURE_SUBSCRIPTION_ID=test-sub PATH="$tmp_bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" "$SCRIPT" --skip-login-check --what-if --sql-only)"
assert_contains "$sql_only_output" "sql only what-if ok"

echo "deploy-local CLI tests passed"
