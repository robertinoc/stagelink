#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ACTION="${1:-}"
shift || true

DATABASE_URL_VALUE="${DATABASE_URL:-}"
TARGET_DATABASE_URL_VALUE="${TARGET_DATABASE_URL:-}"
BACKUP_FILE=""
EXECUTE="false"
OUTPUT_DIR="$ROOT_DIR/backups"

usage() {
  cat <<'USAGE'
StageLink backup/recovery helper.

Default mode is dry-run. Add --execute to run the command.

Actions:
  backup         Create a custom-format pg_dump backup from DATABASE_URL.
  restore-check Restore a backup into TARGET_DATABASE_URL, then run integrity validation.

Examples:
  DATABASE_URL=postgresql://... pnpm data:backup:dry-run
  DATABASE_URL=postgresql://... pnpm data:backup -- --execute --output-dir backups
  TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore pnpm data:restore:dry-run -- --backup backups/file.dump
  TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore pnpm data:restore:check -- --execute --backup backups/file.dump
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --database-url)
      DATABASE_URL_VALUE="$2"
      shift 2
      ;;
    --target-database-url)
      TARGET_DATABASE_URL_VALUE="$2"
      shift 2
      ;;
    --backup)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --execute)
      EXECUTE="true"
      shift
      ;;
    --)
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

run_or_print() {
  if [[ "$EXECUTE" == "true" ]]; then
    "$@"
  else
    printf 'Dry-run:'
    for arg in "$@"; do
      printf ' %q' "$(redact_secret_arg "$arg")"
    done
    printf '\n'
  fi
}

redact_secret_arg() {
  local value="$1"
  if [[ "$value" =~ ^postgres(ql)?://[^:@]+:[^@]+@ ]]; then
    echo "$value" | sed -E 's#(postgres(ql)?://[^:@]+):[^@]+@#\1:[redacted]@#'
    return 0
  fi
  echo "$value"
}

assert_safe_restore_target() {
  local url="$1"
  if [[ "$url" =~ (localhost|127\.0\.0\.1).*(stagelink_restore|stagelink_test|postgres) ]]; then
    return 0
  fi

  if [[ "${DATA_ALLOW_NONLOCAL_RESTORE:-}" == "true" ]]; then
    return 0
  fi

  echo "Refusing restore-check to non-local target. Use a disposable local DB or set DATA_ALLOW_NONLOCAL_RESTORE=true for an approved restore environment." >&2
  exit 1
}

case "$ACTION" in
  backup)
    if [[ -z "$DATABASE_URL_VALUE" ]]; then
      echo "DATABASE_URL is required for backup." >&2
      exit 1
    fi
    timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    BACKUP_FILE="${BACKUP_FILE:-$OUTPUT_DIR/stagelink-$timestamp.dump}"
    command=(pg_dump "$DATABASE_URL_VALUE" --format=custom --no-owner --no-acl --file "$BACKUP_FILE")
    if [[ "$EXECUTE" == "true" ]]; then
      mkdir -p "$OUTPUT_DIR"
    fi
    run_or_print "${command[@]}"
    ;;
  restore-check)
    if [[ -z "$TARGET_DATABASE_URL_VALUE" ]]; then
      echo "TARGET_DATABASE_URL is required for restore-check." >&2
      exit 1
    fi
    if [[ -z "$BACKUP_FILE" ]]; then
      echo "--backup is required for restore-check." >&2
      exit 1
    fi
    assert_safe_restore_target "$TARGET_DATABASE_URL_VALUE"
    command=(pg_restore --clean --if-exists --no-owner --no-acl --dbname "$TARGET_DATABASE_URL_VALUE" "$BACKUP_FILE")
    run_or_print "${command[@]}"
    if [[ "$EXECUTE" == "true" ]]; then
      DATABASE_URL="$TARGET_DATABASE_URL_VALUE" node "$ROOT_DIR/scripts/data/run-data-integrity.mjs"
    else
      echo "Dry-run: would run data integrity validation against TARGET_DATABASE_URL after restore."
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
