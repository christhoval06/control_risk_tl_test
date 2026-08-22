#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARAMS_FILE="$ROOT_DIR/infra/params.dev.json"
TEMPLATE_FILE="$ROOT_DIR/infra/main.bicep"

ENVIRONMENT_NAME="dev"
LOCATION=""
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
TENANT_ID="${AZURE_TENANT_ID:-}"
RESOURCE_GROUP=""
APP_NAME=""
SKIP_LOGIN_CHECK=0
WHAT_IF=0

usage() {
  cat <<'USAGE'
Usage:
  scripts/deploy-local.sh [environment] [options]

Deploy the Bicep infrastructure from your local machine.

Arguments:
  environment                dev, staging, or prod. Defaults to dev.

Options:
  --location <location>      Azure region. Defaults to infra/params.dev.json.
  --subscription <id>        Azure subscription id. Defaults to AZURE_SUBSCRIPTION_ID.
  --tenant <id>              Azure tenant id. Defaults to AZURE_TENANT_ID.
  --resource-group <name>    Resource group name. Defaults to rg-task-management-<environment>.
  --app-name <name>          App name used by Bicep. Defaults to infra/params.dev.json.
  --params <file>            Deployment parameters file. Defaults to infra/params.dev.json.
  --skip-login-check         Skip az account validation.
  --what-if                  Run az deployment group what-if instead of create.
  -h, --help                 Show this help.

Secrets:
  SQL_ADMIN_PASSWORD is read from the environment or prompted securely.
  The password is never written to disk by this script.

Required tools:
  az                         Azure CLI.
  bicep                      Azure Bicep CLI, installed through Azure CLI.
  jq                         JSON parser.

Examples:
  scripts/deploy-local.sh dev --what-if
  AZURE_SUBSCRIPTION_ID=<id> scripts/deploy-local.sh dev
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

param_value() {
  local key="$1"
  jq -er --arg key "$key" '.parameters[$key].value' "$PARAMS_FILE"
}

param_array_json() {
  local key="$1"
  jq -cer --arg key "$key" '.parameters[$key].value' "$PARAMS_FILE"
}

parse_args() {
  if [[ "${1:-}" != "" && "${1:-}" != -* ]]; then
    ENVIRONMENT_NAME="$1"
    shift
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --location)
        LOCATION="${2:-}"
        shift 2
        ;;
      --subscription)
        SUBSCRIPTION_ID="${2:-}"
        shift 2
        ;;
      --tenant)
        TENANT_ID="${2:-}"
        shift 2
        ;;
      --resource-group)
        RESOURCE_GROUP="${2:-}"
        shift 2
        ;;
      --app-name)
        APP_NAME="${2:-}"
        shift 2
        ;;
      --params)
        PARAMS_FILE="${2:-}"
        shift 2
        ;;
      --skip-login-check)
        SKIP_LOGIN_CHECK=1
        shift
        ;;
      --what-if)
        WHAT_IF=1
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
  need_tool "az" "Azure CLI" "https://learn.microsoft.com/cli/azure/install-azure-cli"
  if ! az bicep version >/dev/null 2>&1; then
    echo "Azure Bicep CLI is required to continue." >&2
    echo "Install Azure Bicep CLI: az bicep install" >&2
    exit 127
  fi
  need_tool "jq" "jq" "https://jqlang.github.io/jq/download/"

  [[ -f "$PARAMS_FILE" ]] || die "Parameters file not found: $PARAMS_FILE"
  [[ -f "$TEMPLATE_FILE" ]] || die "Bicep template not found: $TEMPLATE_FILE"
  jq empty "$PARAMS_FILE" >/dev/null

  case "$ENVIRONMENT_NAME" in
    dev|staging|prod) ;;
    *) die "Environment must be dev, staging, or prod." ;;
  esac
}

load_defaults() {
  LOCATION="${LOCATION:-$(param_value location)}"
  APP_NAME="${APP_NAME:-$(param_value appName)}"
  RESOURCE_GROUP="${RESOURCE_GROUP:-rg-task-management-$ENVIRONMENT_NAME}"
  APIM_PUBLISHER_EMAIL="${APIM_PUBLISHER_EMAIL:-$(param_value apimPublisherEmail)}"
  APIM_PUBLISHER_NAME="${APIM_PUBLISHER_NAME:-$(param_value apimPublisherName)}"
  JWT_AUTHORITY="${JWT_AUTHORITY:-$(param_value jwtAuthority)}"
  JWT_AUDIENCE="${JWT_AUDIENCE:-$(param_value jwtAudience)}"
  SQL_ADMIN_LOGIN="${SQL_ADMIN_LOGIN:-$(param_value sqlAdministratorLogin)}"
  CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-$(param_array_json allowedOrigins)}"

  [[ -n "$LOCATION" ]] || die "Location is required."
  [[ -n "$APP_NAME" ]] || die "App name is required."
  [[ -n "$SUBSCRIPTION_ID" ]] || die "Subscription id is required. Set AZURE_SUBSCRIPTION_ID or pass --subscription."
  [[ -n "$APIM_PUBLISHER_EMAIL" ]] || die "APIM publisher email is required."
  [[ -n "$APIM_PUBLISHER_NAME" ]] || die "APIM publisher name is required."
  [[ -n "$JWT_AUTHORITY" ]] || die "JWT authority is required."
  [[ -n "$JWT_AUDIENCE" ]] || die "JWT audience is required."
  [[ -n "$SQL_ADMIN_LOGIN" ]] || die "SQL admin login is required."

  if [[ "$JWT_AUTHORITY" == *"<"* || "$JWT_AUDIENCE" == *"<"* ]]; then
    die "JWT settings still contain placeholders. Set JWT_AUTHORITY and JWT_AUDIENCE."
  fi

  if [[ -z "${SQL_ADMIN_PASSWORD:-}" ]]; then
    read -rsp "SQL admin password: " SQL_ADMIN_PASSWORD
    echo
  fi

  [[ -n "$SQL_ADMIN_PASSWORD" ]] || die "SQL admin password is required."
}

check_azure_login() {
  if [[ "$SKIP_LOGIN_CHECK" -eq 1 ]]; then
    return
  fi

  if ! az account show >/dev/null 2>&1; then
    if [[ -n "$TENANT_ID" ]]; then
      echo "Azure login is required to continue. Opening az login for tenant $TENANT_ID..."
      az login --tenant "$TENANT_ID" >/dev/null
    else
      echo "Azure login is required to continue. Opening az login..."
      az login >/dev/null
    fi
  fi
}

run_deployment() {
  echo "Using subscription: $SUBSCRIPTION_ID"
  az account set --subscription "$SUBSCRIPTION_ID"

  echo "Ensuring resource group: $RESOURCE_GROUP ($LOCATION)"
  az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

  local deployment_name
  deployment_name="local-api-$ENVIRONMENT_NAME-$(date +%Y%m%d%H%M%S)"

  local deployment_command="create"
  if [[ "$WHAT_IF" -eq 1 ]]; then
    deployment_command="what-if"
  fi

  echo "Running az deployment group $deployment_command: $deployment_name"
  az deployment group "$deployment_command" \
    --name "$deployment_name" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters \
      environmentName="$ENVIRONMENT_NAME" \
      location="$LOCATION" \
      appName="$APP_NAME" \
      sqlAdministratorLogin="$SQL_ADMIN_LOGIN" \
      sqlAdministratorPassword="$SQL_ADMIN_PASSWORD" \
      apimPublisherEmail="$APIM_PUBLISHER_EMAIL" \
      apimPublisherName="$APIM_PUBLISHER_NAME" \
      jwtAuthority="$JWT_AUTHORITY" \
      jwtAudience="$JWT_AUDIENCE" \
      allowedOrigins="$CORS_ALLOWED_ORIGINS" \
    --output table

  if [[ "$WHAT_IF" -eq 0 ]]; then
    echo
    echo "Deployment outputs:"
    az deployment group show \
      --resource-group "$RESOURCE_GROUP" \
      --name "$deployment_name" \
      --query properties.outputs \
      --output table
  fi
}

main() {
  parse_args "$@"
  preflight
  load_defaults
  check_azure_login
  run_deployment
}

main "$@"
