#!/usr/bin/env bash
set -euo pipefail

SQL_SERVER="${SQL_SERVER:-sqlserver}"
SQL_PORT="${SQL_PORT:-1433}"
SQL_USER="${SQL_USER:-sa}"
SQL_PASSWORD="${SQL_SA_PASSWORD:-YourStrong!Passw0rd}"
DATABASE_NAME="${DATABASE_NAME:-TaskManagement}"
SQLCMD="${SQLCMD:-/opt/mssql-tools/bin/sqlcmd}"

if [[ ! -x "$SQLCMD" && -x /opt/mssql-tools18/bin/sqlcmd ]]; then
  SQLCMD=/opt/mssql-tools18/bin/sqlcmd
fi

echo "Waiting for SQL Server at ${SQL_SERVER}:${SQL_PORT}..."
for _ in {1..60}; do
  if "$SQLCMD" -b -I -C -S "${SQL_SERVER},${SQL_PORT}" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

"$SQLCMD" -b -I -C -S "${SQL_SERVER},${SQL_PORT}" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "SELECT 1" >/dev/null

"$SQLCMD" -b -I -C -S "${SQL_SERVER},${SQL_PORT}" -U "$SQL_USER" -P "$SQL_PASSWORD" -d master -Q "
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'${DATABASE_NAME}')
BEGIN
    CREATE DATABASE [TaskManagement]
END
"

"$SQLCMD" -b -I -C -S "${SQL_SERVER},${SQL_PORT}" -U "$SQL_USER" -P "$SQL_PASSWORD" -d "$DATABASE_NAME" -i /sql/001_schema.sql
"$SQLCMD" -b -I -C -S "${SQL_SERVER},${SQL_PORT}" -U "$SQL_USER" -P "$SQL_PASSWORD" -d "$DATABASE_NAME" -i /sql/002_stored_procedures.sql

echo "Local SQL database '${DATABASE_NAME}' is ready."
