#!/usr/bin/env bash
# Regenerates mobile/src/shared/db/schema.ts from docs/schema.sql
set -euo pipefail
cd "$(dirname "$0")/.."
{ echo "// AUTO-GENERATED from docs/schema.sql via scripts/sync-schema.sh. Do not edit by hand."
  echo "export const SCHEMA_VERSION = 1;"
  echo 'export const SCHEMA_SQL = `'
  cat docs/schema.sql
  echo '`;'; } > mobile/src/shared/db/schema.ts
echo "schema.ts regenerated"
