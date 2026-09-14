#!/usr/bin/env bash
# Deploy produksi LaundryOS: backup dulu -> build image berversi -> up -> verifikasi
# -> rollback otomatis ke tag sebelumnya bila verifikasi gagal.
#
# Pakai:
#   ./deploy-prod.sh <versi>          # mis. ./deploy-prod.sh 2026-09-14
#
# Versi menjadi tag image (laundryos-api:<versi>, laundryos-web:<versi>,
# laundryos-site:<versi>) sehingga rollback cukup memakai tag lama — lihat
# DEPLOY.md §7. Aturan yang dipegang skrip ini:
#   * tidak jalan tanpa argumen versi;
#   * tidak pernah build/deploy tanpa backup yang berhasil (backup-prod.sh
#     memverifikasi hasilnya sendiri: berkas tidak kosong + gzip utuh);
#   * kalau /up atau /api/v1/health tidak sehat, kembali ke tag sebelumnya.
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
HEALTH_URL="${HEALTH_URL:-http://localhost}"
IMAGE_NAMESPACE="${IMAGE_NAMESPACE:-laundryos}"
HEALTH_TRIES="${HEALTH_TRIES:-24}"
HEALTH_SLEEP="${HEALTH_SLEEP:-5}"

usage() {
  cat <<'EOF'
Deploy produksi LaundryOS.

Pakai: ./deploy-prod.sh <versi>

  <versi>           tag rilis, mis. 2026-09-14 atau v1.4.0
                    (huruf, angka, titik, dash, underscore)

Variabel opsional:
  COMPOSE_FILE      default docker-compose.prod.yml
  ENV_FILE          default .env.prod
  HEALTH_URL        default http://localhost
  IMAGE_NAMESPACE   default laundryos (nama dasar image)
  HEALTH_TRIES      percobaan cek kesehatan (default 24)
  HEALTH_SLEEP      jeda antar percobaan, detik (default 5)

Contoh:
  ./deploy-prod.sh 2026-09-14
  HEALTH_URL=https://laundryos.example ./deploy-prod.sh v1.4.0
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "")
    echo "deploy: butuh argumen versi." >&2
    usage >&2
    exit 2
    ;;
esac

VERSION="$1"
case "$VERSION" in
  *[!A-Za-z0-9._-]*)
    echo "deploy: versi hanya boleh huruf, angka, titik, dash, underscore: '$VERSION'" >&2
    exit 2
    ;;
esac

if [ "$#" -gt 1 ]; then
  echo "deploy: argumen tambahan tidak dikenal: ${*:2}" >&2
  usage >&2
  exit 2
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "deploy: $ENV_FILE tidak ada (salin dari .env.prod.example)." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "deploy: $COMPOSE_FILE tidak ada." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "deploy: curl tidak ada — dipakai untuk verifikasi $HEALTH_URL/up." >&2
  exit 1
fi

export COMPOSE_FILE ENV_FILE

set -a
. "$ENV_FILE"
set +a

# Tag image yang sedang dipakai container lama (untuk rollback). Kosong bila
# service-nya belum pernah jalan (deploy pertama).
previous_image() {
  local service="$1" cid
  cid="$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | head -1)"
  [ -n "$cid" ] || return 0
  docker inspect --format '{{.Config.Image}}' "$cid" 2>/dev/null || true
}

PREV_API="$(previous_image api)"
PREV_WEB="$(previous_image web)"
PREV_SITE="$(previous_image site)"

echo "deploy: versi $VERSION (sebelumnya: api=${PREV_API:-<belum ada>} web=${PREV_WEB:-<belum ada>} site=${PREV_SITE:-<belum ada>})"

# Deploy pertama di VPS baru: belum ada container pgsql, jadi belum ada database
# yang bisa hilang. Selain kasus itu, backup wajib berhasil sebelum build.
PGSQL_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -aq pgsql 2>/dev/null | head -1 || true)"
if [ -z "$PGSQL_CONTAINER" ]; then
  echo "deploy: belum ada container pgsql (deploy pertama) — backup dilewati, tidak ada database di host ini."
else
  echo "deploy: backup sebelum deploy (wajib)…"
  if ! ./backup-prod.sh; then
    echo "deploy: backup GAGAL — deploy dibatalkan sebelum ada build/container yang berubah." >&2
    echo "deploy: kalau pgsql sedang mati, jalankan 'docker compose -f $COMPOSE_FILE up -d pgsql redis' lalu ulangi." >&2
    exit 1
  fi
fi

export API_IMAGE="$IMAGE_NAMESPACE-api:$VERSION"
export WEB_IMAGE="$IMAGE_NAMESPACE-web:$VERSION"
export SITE_IMAGE="$IMAGE_NAMESPACE-site:$VERSION"

echo "deploy: build $API_IMAGE, $WEB_IMAGE, $SITE_IMAGE…"
docker compose -f "$COMPOSE_FILE" build api web site

echo "deploy: up -d…"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

healthy() {
  local i
  i=0
  while [ "$i" -lt "$HEALTH_TRIES" ]; do
    if curl -fsS --max-time 5 "$HEALTH_URL/up" >/dev/null 2>&1 &&
      curl -fsS --max-time 5 "$HEALTH_URL/api/v1/health" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep "$HEALTH_SLEEP"
  done
  return 1
}

echo "deploy: verifikasi $HEALTH_URL/up + $HEALTH_URL/api/v1/health (maks $((HEALTH_TRIES * HEALTH_SLEEP)) detik)…"
if healthy; then
  echo "deploy: selesai — produksi memakai $VERSION dan sehat."
  exit 0
fi

echo "deploy: verifikasi GAGAL (lihat: docker compose -f $COMPOSE_FILE logs api web)." >&2

if [ -z "$PREV_API" ] && [ -z "$PREV_WEB" ] && [ -z "$PREV_SITE" ]; then
  echo "deploy: belum ada image sebelumnya, tidak ada yang bisa di-rollback." >&2
  exit 1
fi

echo "deploy: rollback ke ${PREV_API:-$IMAGE_NAMESPACE-api:prod}…" >&2
# --no-build: kalau image lama sudah tidak ada, lebih baik gagal berisik
# daripada compose diam-diam membangun ulang dari sumber sekarang.
API_IMAGE="${PREV_API:-$IMAGE_NAMESPACE-api:prod}" \
  WEB_IMAGE="${PREV_WEB:-$IMAGE_NAMESPACE-web:prod}" \
  SITE_IMAGE="${PREV_SITE:-$IMAGE_NAMESPACE-site:prod}" \
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --no-build

if healthy; then
  echo "deploy: rollback berhasil — produksi kembali sehat di versi sebelumnya." >&2
else
  echo "deploy: rollback TIDAK sehat juga — tangani manual (DEPLOY.md §7)." >&2
fi

exit 1
