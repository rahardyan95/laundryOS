#!/bin/sh
# Entrypoint produksi: opsional migrasi, symlink storage, cache config/route/view.
set -eu

cd /var/www

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "entrypoint: menjalankan migrasi…"
  php artisan migrate --force
fi

echo "entrypoint: menyiapkan symlink storage…"
php artisan storage:link --force || true

echo "entrypoint: memanaskan cache…"
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
