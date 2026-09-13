#!/bin/sh
# Backup harian PostgreSQL produksi + retensi + offsite opsional.
# Cron: 0 2 * * * /opt/laundryos/infra/backup-prod.sh >> /var/log/laundryos-backup.log 2>&1
set -eu

cd "$(dirname "$0")"

if [ -f .env.prod ]; then
  set -a
  . ./.env.prod
  set +a
fi

DEST="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$DEST/laundry-$STAMP.sql.gz"

mkdir -p "$DEST"

echo "backup: dumping $DB_DATABASE…"
docker compose -f docker-compose.prod.yml exec -T pgsql \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$FILE"

echo "backup: retensi $RETENTION_DAYS hari…"
find "$DEST" -name 'laundry-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  echo "backup: salin ke $RCLONE_REMOTE…"
  rclone copy "$FILE" "$RCLONE_REMOTE"
fi

echo "backup: selesai $FILE"
