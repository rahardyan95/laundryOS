#!/usr/bin/env bash
# Backup harian PostgreSQL produksi + retensi + offsite opsional.
# Cron: 0 2 * * * /opt/laundryos/infra/backup-prod.sh >> /var/log/laundryos-backup.log 2>&1
# Uji terhadap stack lain (mis. dev): COMPOSE_FILE=docker-compose.yml ENV_FILE=.env ./backup-prod.sh
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

DEST="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$DEST/laundry-$STAMP.sql.gz"
RAW="$FILE.raw"
TMP="$FILE.part"

mkdir -p "$DEST"

# Berkas antara selalu dibersihkan, termasuk saat dump gagal di tengah jalan.
cleanup() { rm -f "$RAW" "$TMP"; }
trap cleanup EXIT

echo "backup: dumping $DB_DATABASE…"
docker compose -f "$COMPOSE_FILE" exec -T pgsql \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > "$RAW"

# pg_dump bisa keluar dengan status 0 tapi menghasilkan berkas kosong (nama DB
# salah ketik tetap gagal, tapi container tanpa data juga menghasilkan 0 byte).
# Verifikasi isi sebelum menimpa berkas backup terakhir.
if [ ! -s "$RAW" ]; then
  echo "backup: hasil dump kosong, dibatalkan (berkas lama tidak disentuh)" >&2
  exit 1
fi

if ! grep -q "PostgreSQL database dump" "$RAW"; then
  echo "backup: keluaran bukan dump PostgreSQL, dibatalkan" >&2
  exit 1
fi

gzip -c "$RAW" > "$TMP"

if ! gzip -t "$TMP" || [ ! -s "$TMP" ]; then
  echo "backup: arsip gzip rusak/kosong, dibatalkan" >&2
  exit 1
fi

mv "$TMP" "$FILE"
echo "backup: berkas siap $FILE ($(du -h "$FILE" | cut -f1))"

echo "backup: retensi $RETENTION_DAYS hari…"
find "$DEST" -type f -name 'laundry-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$DEST" -type f \( -name 'laundry-*.part' -o -name 'laundry-*.raw' \) -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  echo "backup: salin ke $RCLONE_REMOTE…"
  rclone copy "$FILE" "$RCLONE_REMOTE"
fi

echo "backup: selesai"
