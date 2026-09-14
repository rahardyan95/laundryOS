#!/bin/sh
# Entrypoint produksi: opsional migrasi, symlink storage, cache config/route/view.
set -eu

cd /var/www

# Gagal cepat: kunci enkripsi tidak boleh dibuat otomatis di produksi (kunci yang
# berubah membuat sesi/token lama tak bisa didekripsi) dan harus base64:32 byte.
if [ -z "${APP_KEY:-}" ] || [ "${APP_KEY#base64:}" = "${APP_KEY}" ]; then
  echo "entrypoint: APP_KEY wajib berisi 'base64:...' (lihat infra/.env.prod.example)" >&2
  exit 1
fi

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
