#!/bin/sh
# Deploy hook certbot: reload nginx supaya sertifikat baru langsung dipakai.
# Dipanggil certbot HANYA saat sertifikat benar-benar diperpanjang.
# Gagal di sini tidak membatalkan perpanjangan sertifikat; certbot mencatat
# error hook di lognya (cek `docker compose logs certbot` bila nginx tidak
# memakai sertifikat baru).
set -eu

# Nama container nginx: turunan dari `name: laundryos` + service `nginx` + index 1
# di docker-compose.prod.yml. Bisa diganti lewat env NGINX_CONTAINER.
NGINX_CONTAINER="${NGINX_CONTAINER:-laundryos-nginx-1}"

docker exec "$NGINX_CONTAINER" nginx -s reload
echo "reload-nginx: nginx ($NGINX_CONTAINER) di-reload"
