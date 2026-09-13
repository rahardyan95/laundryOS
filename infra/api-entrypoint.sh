#!/bin/sh
# Sync container environment into .env so the `php -S` child spawned by
# `artisan serve` (which does not inherit process env) sees Docker values.
# Tahan terhadap race bind-mount Docker Desktop: tunggu hingga artisan ada
# DAN direktori bisa tulis (maksimal ~60 detik), selalu pakai path absolut.
set -eu

APP_DIR=/var/www
ENV_FILE="$APP_DIR/.env"

i=0
while [ "$i" -lt 60 ]; do
  if [ -f "$APP_DIR/artisan" ] && touch "$APP_DIR/.writetest" 2>/dev/null; then
    rm -f "$APP_DIR/.writetest"
    break
  fi
  sleep 1
  i=$((i + 1))
done

if [ ! -f "$APP_DIR/artisan" ]; then
  echo "entrypoint: $APP_DIR/artisan tidak ditemukan setelah 60 detik" >&2
  exit 1
fi

cd "$APP_DIR"

sync_var() {
  name="$1"
  value="$(printenv "$name" || true)"
  if [ -n "$value" ]; then
    if grep -q "^${name}=" "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^${name}=.*|${name}=${value}|" "$ENV_FILE"
    else
      printf '%s=%s\n' "$name" "$value" >> "$ENV_FILE"
    fi
  fi
}

for v in APP_KEY DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD \
  QUEUE_CONNECTION REDIS_CLIENT REDIS_HOST REDIS_PORT MAIL_MAILER MAIL_HOST MAIL_PORT; do
  sync_var "$v"
done

exec "$@"
