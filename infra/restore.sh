#!/usr/bin/env bash
# Restore berkas backup PostgreSQL (hasil infra/backup-prod.sh) ke sebuah database.
#
# Pakai:
#   ./restore.sh --help
#   RESTORE_CONFIRM=yes ./restore.sh backups/laundry-20260914-020000.sql.gz
#   ./restore.sh --force --db laundry_restore backups/laundry-20260914-020000.sql.gz
#
# Sifat skrip ini:
#   * menolak jalan tanpa konfirmasi eksplisit (--force atau RESTORE_CONFIRM=yes);
#   * memeriksa arsip (gzip utuh + berisi dump PostgreSQL) SEBELUM database disentuh;
#   * DB_USERNAME/DB_DATABASE dibaca dari ENV_FILE (default .env.prod), sama seperti backup;
#   * psql -v ON_ERROR_STOP=1 --single-transaction: satu pernyataan gagal -> seluruh
#     restore dibatalkan, tidak ada database setengah jadi.
#
# Uji terhadap stack dev:
#   COMPOSE_FILE=docker-compose.yml ENV_FILE=.env.dev ./restore.sh --force --db laundry_restore <berkas>
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

usage() {
  cat <<'EOF'
Restore backup PostgreSQL LaundryOS.

Pakai: ./restore.sh [opsi] <berkas.sql.gz>

Opsi:
  -f, --force            konfirmasi eksplisit (alternatif: RESTORE_CONFIRM=yes)
      --db <nama>        database tujuan (default: DB_DATABASE dari ENV_FILE)
      --fresh            hapus dulu database tujuan lalu buat ulang
      --env-file <berkas>  berkas env untuk DB_USERNAME/DB_DATABASE (default .env.prod)
      --compose-file <berkas>  docker compose file (default docker-compose.prod.yml)
  -h, --help             tampilkan bantuan ini

Contoh:
  RESTORE_CONFIRM=yes ./restore.sh backups/laundry-20260914-020000.sql.gz
  ./restore.sh --force --fresh backups/laundry-20260914-020000.sql.gz
  ./restore.sh --force --db laundry_uji backups/laundry-20260914-020000.sql.gz
EOF
}

FORCE=0
FRESH=0
FILE=""
TARGET_DB=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -f|--force) FORCE=1 ;;
    --fresh) FRESH=1 ;;
    --db) TARGET_DB="${2:?--db butuh nama database}"; shift ;;
    --env-file) ENV_FILE="${2:?--env-file butuh nama berkas}"; shift ;;
    --compose-file) COMPOSE_FILE="${2:?--compose-file butuh nama berkas}"; shift ;;
    -*) echo "restore: opsi tidak dikenal: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [ -n "$FILE" ]; then
        echo "restore: hanya satu berkas backup yang boleh diberikan" >&2
        exit 2
      fi
      FILE="$1"
      ;;
  esac
  shift
done

if [ -z "$FILE" ]; then
  echo "restore: berkas backup belum diberikan" >&2
  usage >&2
  exit 2
fi

if [ ! -f "$FILE" ]; then
  echo "restore: berkas tidak ditemukan: $FILE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "restore: $ENV_FILE tidak ada — salin dari .env.prod.example atau pakai --env-file" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${DB_USERNAME:?restore: DB_USERNAME kosong di $ENV_FILE}"
: "${DB_DATABASE:?restore: DB_DATABASE kosong di $ENV_FILE}"

TARGET="${TARGET_DB:-$DB_DATABASE}"

# Nama database disisipkan ke SQL, jadi batasi bentuknya lebih dulu.
case "$TARGET" in
  ''|*[!A-Za-z0-9_]*)
    echo "restore: nama database hanya boleh huruf, angka, dan underscore: '$TARGET'" >&2
    exit 2
    ;;
esac

if [ "$FORCE" -ne 1 ] && [ "${RESTORE_CONFIRM:-}" != "yes" ]; then
  echo "restore: ini menimpa isi database \"$TARGET\"." >&2
  echo "restore: jalankan ulang dengan --force atau RESTORE_CONFIRM=yes bila itu memang maksudnya." >&2
  exit 3
fi

echo "restore: memeriksa arsip (database belum disentuh)…"
if ! gzip -t "$FILE" 2>/dev/null; then
  echo "restore: arsip gzip rusak: $FILE" >&2
  exit 1
fi

# grep -c membaca seluruh aliran (tidak keluar lebih awal), jadi pipefail aman.
DUMP_MARKER="$(gunzip -c "$FILE" | grep -c 'PostgreSQL database dump' || true)"
if [ "${DUMP_MARKER:-0}" -eq 0 ]; then
  echo "restore: isi arsip bukan dump PostgreSQL: $FILE" >&2
  exit 1
fi

psql_admin() { # $1 = SQL; dijalankan ke database postgres
  docker compose -f "$COMPOSE_FILE" exec -T pgsql \
    psql -U "$DB_USERNAME" -d postgres -v ON_ERROR_STOP=1 -tAc "$1"
}

TARGET_EXISTS="$(psql_admin "SELECT 1 FROM pg_database WHERE datname = '$TARGET'")"

if [ "$FRESH" -eq 1 ] && [ "$TARGET_EXISTS" = "1" ]; then
  echo "restore: --fresh: menghapus database $TARGET…"
  psql_admin "DROP DATABASE \"$TARGET\" WITH (FORCE)" >/dev/null
  TARGET_EXISTS=""
fi

if [ "$TARGET_EXISTS" != "1" ]; then
  echo "restore: membuat database $TARGET…"
  psql_admin "CREATE DATABASE \"$TARGET\"" >/dev/null
fi

STARTED="$(date +%s)"
echo "restore: memuat $FILE -> $TARGET (user $DB_USERNAME)…"
gunzip -c "$FILE" | docker compose -f "$COMPOSE_FILE" exec -T pgsql \
  psql -U "$DB_USERNAME" -d "$TARGET" --quiet --single-transaction -v ON_ERROR_STOP=1

TABLES="$(docker compose -f "$COMPOSE_FILE" exec -T pgsql \
  psql -U "$DB_USERNAME" -d "$TARGET" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")"

echo "restore: selesai dalam $(( $(date +%s) - STARTED )) detik"
echo "restore: tujuan      : $TARGET (server pgsql via $COMPOSE_FILE)"
echo "restore: sumber      : $FILE ($(du -h "$FILE" | cut -f1) terkompresi)"
echo "restore: tabel publik: $TABLES"
