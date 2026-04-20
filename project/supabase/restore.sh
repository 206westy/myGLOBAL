#!/bin/bash
# Supabase DB 복구 스크립트
# 사용: bash supabase/restore.sh <백업파일> [host] [port]
# 예시: bash supabase/restore.sh supabase/backups/backup_20260417_120000.sql

if [ -z "$1" ]; then
  echo "Usage: bash supabase/restore.sh <backup_file> [host] [port]"
  echo ""
  echo "Available backups:"
  ls -lh "$(dirname "$0")/backups"/backup_*.sql 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"
HOST="${2:-127.0.0.1}"
PORT="${3:-54322}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "File not found: $BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Restoring from: $BACKUP_FILE ($SIZE)"
echo "Target: $HOST:$PORT"
echo ""
read -p "This will overwrite the current database. Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  PGPASSWORD=postgres psql \
    -h "$HOST" \
    -p "$PORT" \
    -U postgres \
    -d postgres \
    -f "$BACKUP_FILE" \
    > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "Restore complete."
  else
    echo "Restore FAILED."
    exit 1
  fi
else
  echo "Cancelled."
fi
