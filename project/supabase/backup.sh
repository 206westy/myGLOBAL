#!/bin/bash
# Supabase DB 자동 백업 스크립트
# 사용: bash supabase/backup.sh [host] [port]
# 기본값: host=127.0.0.1, port=54322

HOST="${1:-127.0.0.1}"
PORT="${2:-54322}"
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${TIMESTAMP}.sql"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "Backing up Supabase DB ($HOST:$PORT)..."

PGPASSWORD=postgres pg_dump \
  -h "$HOST" \
  -p "$PORT" \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  > "$BACKUP_DIR/$FILENAME" 2>&1

if [ $? -eq 0 ]; then
  SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
  echo "Backup complete: $BACKUP_DIR/$FILENAME ($SIZE)"

  # 오래된 백업 삭제 (KEEP_DAYS일 이상)
  find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$KEEP_DAYS -delete 2>/dev/null
  COUNT=$(ls "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
  echo "Total backups: $COUNT (keeping last ${KEEP_DAYS} days)"
else
  echo "Backup FAILED. Is Supabase running?"
  rm -f "$BACKUP_DIR/$FILENAME"
  exit 1
fi
