#!/bin/sh
# Backup database laundry ke infra/backups/ (gzip).
# Pakai: ./backup.sh   (dari direktori infra/, butuh Git Bash di Windows)
set -eu
cd "$(dirname "$0")"
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T pgsql pg_dump -U laundry laundry | gzip > "backups/laundry-${STAMP}.sql.gz"
echo "backup tersimpan: backups/laundry-${STAMP}.sql.gz"
