#!/bin/sh
# Entrypoint produksi: migrasi, symlink storage, cache config/route/view.
set -eu

cd /var/www

echo "entrypoint: menjalankan migrasi…"
php artisan migrate --force

echo "entrypoint: menyiapkan symlink storage…"
php artisan storage:link --force || true

echo "entrypoint: memanaskan cache…"
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
