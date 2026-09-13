#!/bin/sh
# Restore backup ke database target (default: laundry_restore, tidak menyentuh laundry).
# Pakai: ./restore.sh backups/laundry-YYYYMMDD-HHMMSS.sql.gz [nama_db_target]
set -eu
cd "$(dirname "$0")"
FILE=${1:?Isi path file backup, contoh: ./restore.sh backups/laundry-20260904-120000.sql.gz}
TARGET=${2:-laundry_restore}
docker compose exec -T pgsql psql -U laundry -d postgres -c "CREATE DATABASE \"${TARGET}\";" || true
gunzip -c "$FILE" | docker compose exec -T pgsql psql -U laundry -d "$TARGET" -q
echo "restore selesai ke database: $TARGET"
