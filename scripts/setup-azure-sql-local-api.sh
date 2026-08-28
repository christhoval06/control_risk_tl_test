#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_SETTINGS_FILE="$ROOT_DIR/api/local.settings.json"
SCHEMA_FILE="$ROOT_DIR/sql/001_schema.sql"
PROCS_FILE="$ROOT_DIR/sql/002_stored_procedures.sql"

ENVIRONMENT_NAME="dev"
RESOURCE_GROUP="rg-task-management-dev"
RESOURCE_GROUP_SET=0
APP_NAME="taskmgmt"
SQL_SERVER=""
DATABASE="TaskManagement"
SQL_ADMIN_LOGIN="${SQL_ADMIN_LOGIN:-sqladminuser}"
JWT_AUTHORITY="${JWT_AUTHORITY:-}"
JWT_AUDIENCE="${JWT_AUDIENCE:-}"
CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:5173}"
KEEP_FIREWALL_RULE=0
SKIP_AZURE_DISCOVERY=0
FIREWALL_RULE_NAME=""
FIREWALL_SERVER_NAME=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/setup-azure-sql-local-api.sh [options]

Prepare Azure SQL for local API development and update api/local.settings.json.

Options:
  --environment <name>       Environment name. Defaults to dev.
  --resource-group <name>    Resource group. Defaults to rg-task-management-dev.
  --app-name <name>          App name prefix. Defaults to taskmgmt.
  --sql-server <fqdn|name>   Azure SQL server name or FQDN.
  --database <name>          Azure SQL database. Defaults to TaskManagement.
  --sql-user <login>         SQL admin login. Defaults to SQL_ADMIN_LOGIN or sqladminuser.
  --jwt-authority <url>      JWT authority for local API settings.
  --jwt-audience <audience>  JWT audience for local API settings.
  --cors-origin <origin>     CORS origin. Defaults to http://localhost:5173.
  --keep-firewall-rule       Keep the temporary Azure SQL firewall rule.
  --skip-azure-discovery     Do not use az to discover the SQL server.
  -h, --help                 Show this help.

Secrets:
  SQL_ADMIN_PASSWORD is read from the environment or prompted securely.

Required tools:
  az                         Azure CLI, unless --skip-azure-discovery is used with --sql-server.
  sqlcmd                     SQL Server command-line tools.
  jq                         JSON parser.
  curl                       Used to detect your public IP for the SQL firewall rule.
USAGE
}

die() {
  echo "Error: $*" >&2
  exit 1
}

need_tool() {
  local tool="$1"
  local name="$2"
  local install_hint="$3"

  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "$name is required to continue." >&2
    echo "Install $name: $install_hint" >&2
    exit 127
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --environment)
        ENVIRONMENT_NAME="${2:-}"
        RESOURCE_GROUP="rg-task-management-${ENVIRONMENT_NAME}"
        shift 2
        ;;
      --resource-group)
        RESOURCE_GROUP="${2:-}"
        RESOURCE_GROUP_SET=1
        shift 2
        ;;
      --app-name)
        APP_NAME="${2:-}"
        shift 2
        ;;
      --sql-server)
        SQL_SERVER="${2:-}"
        shift 2
        ;;
      --database)
        DATABASE="${2:-}"
        shift 2
        ;;
      --sql-user)
        SQL_ADMIN_LOGIN="${2:-}"
        shift 2
        ;;
      --jwt-authority)
        JWT_AUTHORITY="${2:-}"
        shift 2
        ;;
      --jwt-audience)
        JWT_AUDIENCE="${2:-}"
        shift 2
        ;;
      --cors-origin)
        CORS_ALLOWED_ORIGINS="${2:-}"
        shift 2
        ;;
      --keep-firewall-rule)
        KEEP_FIREWALL_RULE=1
        shift
        ;;
      --skip-azure-discovery)
        SKIP_AZURE_DISCOVERY=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
}

preflight() {
  if [[ "$SKIP_AZURE_DISCOVERY" -eq 0 || -z "$SQL_SERVER" ]]; then
    need_tool "az" "Azure CLI" "https://learn.microsoft.com/cli/azure/install-azure-cli"
  fi
  need_tool "sqlcmd" "sqlcmd" "https://learn.microsoft.com/sql/tools/sqlcmd/sqlcmd-utility"
  need_tool "jq" "jq" "https://jqlang.github.io/jq/download/"
  need_tool "curl" "curl" "https://curl.se/download.html"

  [[ -f "$SCHEMA_FILE" ]] || die "Schema file not found: $SCHEMA_FILE"
  [[ -f "$PROCS_FILE" ]] || die "Stored procedures file not found: $PROCS_FILE"
  [[ -n "$DATABASE" ]] || die "Database is required."
  [[ "$DATABASE" =~ ^[A-Za-z0-9_-]+$ ]] || die "Database may only contain letters, numbers, underscores, and hyphens."
  [[ -n "$SQL_ADMIN_LOGIN" ]] || die "SQL admin login is required."
  [[ -n "$JWT_AUTHORITY" ]] || die "JWT authority is required. Pass --jwt-authority or set JWT_AUTHORITY."
  [[ -n "$JWT_AUDIENCE" ]] || die "JWT audience is required. Pass --jwt-audience or set JWT_AUDIENCE."

  if [[ -z "${SQL_ADMIN_PASSWORD:-}" ]]; then
    read -rsp "SQL admin password: " SQL_ADMIN_PASSWORD
    echo
  fi
  [[ -n "$SQL_ADMIN_PASSWORD" ]] || die "SQL admin password is required."
}

normalize_sql_server() {
  if [[ "$SQL_SERVER" != *.database.windows.net ]]; then
    SQL_SERVER="${SQL_SERVER}.database.windows.net"
  fi
}

discover_sql_server() {
  if [[ -n "$SQL_SERVER" ]]; then
    normalize_sql_server
    resolve_resource_group_for_sql_server
    return
  fi

  SQL_SERVER="$(az sql server list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?starts_with(name, 'sql-${APP_NAME}-${ENVIRONMENT_NAME}-')].fullyQualifiedDomainName | [0]" \
    --output tsv)"

  [[ -n "$SQL_SERVER" && "$SQL_SERVER" != "None" ]] || die "Azure SQL server not found. Pass --sql-server or deploy SQL first with ./scripts/deploy-local.sh dev --sql-only."
}

resolve_resource_group_for_sql_server() {
  if [[ "$SKIP_AZURE_DISCOVERY" -eq 1 || "$RESOURCE_GROUP_SET" -eq 1 ]]; then
    return
  fi

  local server_name
  local discovered_resource_group

  server_name="$(sql_server_name)"
  discovered_resource_group="$(az resource list \
    --resource-type Microsoft.Sql/servers \
    --name "$server_name" \
    --query "[0].resourceGroup" \
    --output tsv)"

  if [[ -n "$discovered_resource_group" && "$discovered_resource_group" != "None" ]]; then
    RESOURCE_GROUP="$discovered_resource_group"
  else
    die "Could not resolve resource group for Azure SQL server '$server_name'. Pass --resource-group, or run with --skip-azure-discovery if the firewall rule is already open."
  fi
}

sql_server_name() {
  local server="${SQL_SERVER%.database.windows.net}"
  echo "$server"
}

cleanup_firewall() {
  if [[ -n "$FIREWALL_RULE_NAME" && "$KEEP_FIREWALL_RULE" -eq 0 ]]; then
    az sql server firewall-rule delete \
      --resource-group "$RESOURCE_GROUP" \
      --server "$FIREWALL_SERVER_NAME" \
      --name "$FIREWALL_RULE_NAME" \
      --output none || true
  fi
}

with_firewall_rule() {
  if [[ "$SKIP_AZURE_DISCOVERY" -eq 1 ]]; then
    "$@"
    return
  fi

  local public_ip

  public_ip="$(curl -fsSL https://api.ipify.org)"
  FIREWALL_RULE_NAME="local-dev-$(date +%Y%m%d%H%M%S)"
  FIREWALL_SERVER_NAME="$(sql_server_name)"

  az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$FIREWALL_SERVER_NAME" \
    --name "$FIREWALL_RULE_NAME" \
    --start-ip-address "$public_ip" \
    --end-ip-address "$public_ip" \
    --output none

  trap cleanup_firewall EXIT

  "$@"
}

run_sql_scripts() {
  sqlcmd -b -I -C -S "$SQL_SERVER" -d "$DATABASE" -U "$SQL_ADMIN_LOGIN" -P "$SQL_ADMIN_PASSWORD" -i "$SCHEMA_FILE"
  sqlcmd -b -I -C -S "$SQL_SERVER" -d "$DATABASE" -U "$SQL_ADMIN_LOGIN" -P "$SQL_ADMIN_PASSWORD" -i "$PROCS_FILE"
}

ensure_database() {
  local escaped_database
  local database_exists
  local create_output
  local create_status
  escaped_database="${DATABASE//]/]]}"
  database_exists="$(sqlcmd -b -I -C -S "$SQL_SERVER" -d master -U "$SQL_ADMIN_LOGIN" -P "$SQL_ADMIN_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(1) FROM sys.databases WHERE name = N'$DATABASE';" | tr -d '[:space:]')"

  if [[ "$database_exists" == "1" ]]; then
    return
  fi

  set +e
  create_output="$(sqlcmd -b -I -C -S "$SQL_SERVER" -d master -U "$SQL_ADMIN_LOGIN" -P "$SQL_ADMIN_PASSWORD" -Q "CREATE DATABASE [$escaped_database];" 2>&1)"
  create_status=$?
  set -e

  if [[ "$create_status" -ne 0 ]]; then
    if [[ "$create_output" == *"Database '$DATABASE' already exists"* ]]; then
      echo "Database already exists; continuing."
    else
      echo "$create_output" >&2
      exit "$create_status"
    fi
  fi
}

run_database_setup() {
  ensure_database
  run_sql_scripts
}

normalize_functions_host_cors() {
  if jq -e . >/dev/null 2>&1 <<<"$CORS_ALLOWED_ORIGINS"; then
    jq -r 'if type == "array" then join(",") else tostring end' <<<"$CORS_ALLOWED_ORIGINS"
  else
    printf '%s\n' "$CORS_ALLOWED_ORIGINS"
  fi
}

write_local_settings() {
  local connection_string
  local existing_file
  local functions_host_cors
  local tmp_file

  connection_string="Server=tcp:${SQL_SERVER},1433;Initial Catalog=${DATABASE};Persist Security Info=False;User ID=${SQL_ADMIN_LOGIN};Password=${SQL_ADMIN_PASSWORD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  existing_file="$LOCAL_SETTINGS_FILE"
  functions_host_cors="$(normalize_functions_host_cors)"
  tmp_file="$(mktemp)"

  if [[ ! -f "$existing_file" ]]; then
    mkdir -p "$(dirname "$existing_file")"
    printf '{"IsEncrypted":false,"Values":{}}\n' > "$existing_file"
  fi

  jq \
    --arg sql "$connection_string" \
    --arg authority "$JWT_AUTHORITY" \
    --arg audience "$JWT_AUDIENCE" \
    --arg cors "$CORS_ALLOWED_ORIGINS" \
    --arg functionsHostCors "$functions_host_cors" \
    '.IsEncrypted = false
      | .Values.AzureWebJobsStorage = (.Values.AzureWebJobsStorage // "UseDevelopmentStorage=true")
      | .Values.FUNCTIONS_WORKER_RUNTIME = "dotnet-isolated"
      | .Values.SqlConnectionString = $sql
      | .Values.Jwt__Authority = $authority
      | .Values.Jwt__Audience = $audience
      | .Values.Cors__AllowedOrigins = $cors
      | .Values.Redis__ConnectionString = (.Values.Redis__ConnectionString // "localhost:6379")
      | .Values.Cache__Enabled = (.Values.Cache__Enabled // "true")
      | .Values.Cache__DefaultTtlSeconds = (.Values.Cache__DefaultTtlSeconds // "60")
      | .Host.CORS = $functionsHostCors
      | .Host.CORSCredentials = false' \
    "$existing_file" > "$tmp_file"

  mv "$tmp_file" "$existing_file"
}

main() {
  parse_args "$@"
  preflight
  discover_sql_server
  with_firewall_rule run_database_setup
  write_local_settings
  echo "Updated api/local.settings.json for Azure SQL server $SQL_SERVER."
}

main "$@"
