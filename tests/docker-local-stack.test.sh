#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
DOCKERFILE="$ROOT_DIR/api/Dockerfile"
SQL_INIT_SCRIPT="$ROOT_DIR/scripts/init-local-sql.sh"
PROGRAM_FILE="$ROOT_DIR/api/Program.cs"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_file_contains() {
  local file="$1"
  local needle="$2"

  [[ -f "$file" ]] || fail "expected file to exist: $file"

  if ! grep -Fq -- "$needle" "$file"; then
    fail "expected $file to contain: $needle"
  fi
}

assert_file_contains "$COMPOSE_FILE" "api:"
assert_file_contains "$COMPOSE_FILE" "sqlserver:"
assert_file_contains "$COMPOSE_FILE" "redis:"
assert_file_contains "$COMPOSE_FILE" "azurite:"
assert_file_contains "$COMPOSE_FILE" "SqlConnectionString: \"Server=tcp:sqlserver,1433"
assert_file_contains "$COMPOSE_FILE" "Redis__ConnectionString: \"redis:6379\""
assert_file_contains "$COMPOSE_FILE" 'Cache__Enabled: "${CACHE_ENABLED:-true}"'
assert_file_contains "$COMPOSE_FILE" "AzureWebJobsStorage: \"DefaultEndpointsProtocol=http"
assert_file_contains "$COMPOSE_FILE" "7071:80"
assert_file_contains "$COMPOSE_FILE" "1433:1433"
assert_file_contains "$COMPOSE_FILE" "6379:6379"

assert_file_contains "$DOCKERFILE" "FROM mcr.microsoft.com/dotnet/sdk:10.0"
assert_file_contains "$DOCKERFILE" "FROM mcr.microsoft.com/azure-functions/dotnet-isolated:4-dotnet-isolated10.0"
assert_file_contains "$DOCKERFILE" "dotnet publish"

assert_file_contains "$SQL_INIT_SCRIPT" "CREATE DATABASE [TaskManagement]"
assert_file_contains "$SQL_INIT_SCRIPT" "001_schema.sql"
assert_file_contains "$SQL_INIT_SCRIPT" "002_stored_procedures.sql"
assert_file_contains "$SQL_INIT_SCRIPT" '"$SQLCMD" -b -I -C'

assert_file_contains "$PROGRAM_FILE" "ConfigurationOptions.Parse(redisConnectionString)"
assert_file_contains "$PROGRAM_FILE" "AbortOnConnectFail = false"

echo "docker local stack tests passed"
