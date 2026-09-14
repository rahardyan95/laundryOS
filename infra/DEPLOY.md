# Deploy LaundryOS ke VPS (Docker Compose + TLS)

Arsitektur: `nginx` (edge) → `web` (Next standalone) + `api` (PHP-FPM) + `site` (statis Astro) → `pgsql` + `redis`.
Worker & scheduler menjalankan antrean dan reminder. Semua service terisolasi di network `backend`.

Dua host dilayani satu edge nginx:

| Host (contoh) | Isi |
|---|---|
| `laundryos.example`, `www.laundryos.example` | situs pemasaran `apps/site` (statis, sitemap/robots) |
| `app.laundryos.example` | dashboard/POS `apps/web` di `/` dan API di `/api`, `/sanctum`, `/up` |

Host aplikasi sengaja terpisah supaya `/` di host publik tetap milik situs, bukan dashboard.

## 1. Prasyarat VPS

- Ubuntu 22.04/24.04, RAM ≥ 2 GB, Docker Engine + Compose v2.
- Tiga nama DNS A-record mengarah ke IP VPS: `laundryos.example`, `www.laundryos.example`,
  `app.laundryos.example` (ganti dengan domain asli).
- Buka port 80 & 443.

## 2. Ambil kode & konfigurasi

```bash
git clone <repo> /opt/laundryos
cd /opt/laundryos/infra
cp .env.prod.example .env.prod
# isi .env.prod: APP_KEY, DB_PASSWORD, REDIS_PASSWORD, MAIL_*, AWS_*,
# PUBLIC_SITE_URL/PUBLIC_APP_URL/PUBLIC_API_URL, APP_URL/FRONTEND_URL/
# CORS_ALLOWED_ORIGINS/SANCTUM_STATEFUL_DOMAINS (host aplikasi)
openssl rand -base64 32   # contoh APP_KEY (tambahkan prefix "base64:")
```

> `.env.prod` **tidak boleh** di-commit. Set `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`.
> `PUBLIC_SITE_URL`, `PUBLIC_APP_URL`, dan `PUBLIC_API_URL` wajib diisi: build image
> menolak berjalan tanpa itu, supaya HTML produksi tidak memuat tautan localhost.
> Nilainya dikompilasi saat build, jadi mengubahnya butuh deploy ulang (bukan restart).

Periksa dulu tanpa menyalakan apa pun:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config >/dev/null && echo "compose OK"
```

## 3. Build & jalankan

```bash
cd /opt/laundryos/infra
./deploy-prod.sh "$(date +%Y-%m-%d)"      # backup -> build bertag versi -> up -> verifikasi
```

atau langkah manual yang sama:

```bash
cd /opt/laundryos/infra
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
curl -fsS http://localhost/up
curl -fsS http://localhost/api/v1/health
docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -t
```

Service `api` menjalankan migrasi otomatis lewat entrypoint (`RUN_MIGRATIONS=1`).
`worker`/`scheduler` tidak menjalankan migrasi. Situs statis disajikan service `site`
(image `nginx:alpine` berisi hasil build `apps/site`).

Sebelum TLS aktif, dashboard dibuka lewat IP/host apa pun (`curl -fsS http://<ip>/up` tetap
dilayani blok default), sedangkan situs hanya terjawab bila `Host` cocok dengan `server_name`
di `nginx/laundryos.conf` — sesuaikan kalau domain bukan `laundryos.example`.

## 4. Akun admin pertama

Seed demo tidak dipakai di produksi. Buat tenant + outlet pertama + owner dengan perintah
`tenant:provision` (idempoten: email yang sudah terdaftar ditolak tanpa mengubah apa pun):

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api \
  php artisan tenant:provision \
    --name="Laundry Contoh" \
    --outlet="Kemang" \
    --email=owner@laundryos.example \
    --password='<kata-sandi-kuat-min-8-karakter>' \
    --plan=growth
```

Opsi `--plan`: `starter`, `growth`, `multi_outlet`. Kode outlet diambil dari 3 huruf pertama
nama outlet (dipakai pada nomor ticket) dan otomatis dibedakan bila sudah terpakai di tenant yang sama.

## 5. TLS (Let's Encrypt / certbot)

Blok 443 tidak ada di `nginx/laundryos.conf`; ia dimuat dari `nginx/tls/*.conf` (mounted ke
`/etc/nginx/conf.d/tls`). Berkas contoh `nginx/tls/laundryos-ssl.conf.example` **tidak** dimuat
nginx (ekstensinya bukan `.conf`), jadi direktori itu boleh kosong dan deploy pertama tetap jalan
dengan HTTP. Urutan berikut bisa disalin apa adanya (ganti domain asli):

1. **Minta sertifikat** (port 80 sudah melayani `/.well-known/acme-challenge/`):
   ```bash
   cd /opt/laundryos/infra
   DOMAIN=laundryos.example          # domain asli
   APP_HOST=app.$DOMAIN
   docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm --profile tls certbot \
     certonly --webroot -w /var/www/certbot \
     -d "$DOMAIN" -d "www.$DOMAIN" -d "$APP_HOST" \
     --email admin@$DOMAIN --agree-tos --no-eff-email
   ```
   Perintah `run --rm` ini membangun image `laundryos-certbot` (certbot + docker CLI) saat pertama dipakai.

2. **Salin blok 443 dengan domain asli:**
   ```bash
   sed -e "s/app\.laundryos\.example/$APP_HOST/g" -e "s/laundryos\.example/$DOMAIN/g" \
     nginx/tls/laundryos-ssl.conf.example > nginx/tls/laundryos-ssl.conf
   grep -n 'server_name\|ssl_certificate ' nginx/tls/laundryos-ssl.conf    # periksa hasilnya
   ```

3. **Uji lalu muat ulang nginx:**
   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -t
   docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -s reload
   curl -fsS "https://$DOMAIN/" | head -3
   curl -fsS "https://$APP_HOST/api/v1/health"
   ```

4. **Aktifkan redirect HTTP → HTTPS:** hapus `# ` pada satu baris `if ($request_uri …)` di setiap
   blok port 80 `nginx/laundryos.conf` (satu di blok aplikasi, satu di blok situs), lalu uji & reload:
   ```bash
   sed -i 's|^    # if |    if |' nginx/laundryos.conf
   docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -t
   docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -s reload
   curl -sI "http://$DOMAIN/" | head -2        # harus 301 ke https://
   ```
   Bentuk `if` itu bukan hiasan: `return 301` telanjang di level server berjalan sebelum pemilihan
   location, sehingga tantangan ACME ikut ter-redirect dan perpanjangan sertifikat gagal.

5. **Verifikasi login lewat HTTPS:** `https://$APP_HOST/login` (bukan HTTP). Setelah ini
   `SESSION_SECURE_COOKIE=true` di `.env.prod` baru bisa bekerja — sebelum TLS aktif, cookie
   `Secure` tidak pernah dikirim balik oleh browser sehingga login tampak "tidak terjadi apa-apa".

6. **Perpanjangan otomatis + reload nginx:**
   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml --profile tls up -d certbot
   docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f certbot
   ```
   Service `certbot` me-loop `certbot renew` tiap 12 jam dan memanggil hook
   `infra/certbot/reload-nginx.sh` (`docker exec laundryos-nginx-1 nginx -s reload`) **hanya** saat
   ada sertifikat yang benar-benar diperpanjang; tanpa reload itu nginx tetap memakai sertifikat lama
   di memori sampai 90 hari berikutnya.

   > Catatan keamanan: container `certbot` diberi mount `/var/run/docker.sock` supaya bisa
   > me-reload nginx (socket itu setara akses root ke host). Kalau itu tidak diinginkan, hapus
   > mount tersebut + `--deploy-hook` dari service `certbot`, lalu reload dari cron host:
   > ```bash
   > echo '0 3 * * * cd /opt/laundryos/infra && docker compose --env-file .env.prod -f docker-compose.prod.yml --profile tls run --rm certbot renew --webroot -w /var/www/certbot --quiet && docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T nginx nginx -s reload' | sudo tee /etc/cron.d/laundryos-cert
   > ```

## 6. Backup & restore

```bash
cd /opt/laundryos/infra
./backup-prod.sh                    # uji manual
# cron harian 02:00
echo '0 2 * * * /opt/laundryos/infra/backup-prod.sh >> /var/log/laundryos-backup.log 2>&1' | sudo tee /etc/cron.d/laundryos-backup
```

Restore memakai `infra/restore.sh`. Skrip ini memeriksa arsip (gzip utuh + benar-benar dump
PostgreSQL) **sebelum** database disentuh, menolak jalan tanpa konfirmasi eksplisit, dan memuat
dengan `psql -v ON_ERROR_STOP=1 --single-transaction` sehingga satu pernyataan gagal membatalkan
seluruh restore (tidak ada database setengah jadi).

```bash
./restore.sh --help                                             # daftar opsi
# verifikasi dulu ke database terpisah (nama DB apa pun):
ENV_FILE=.env.prod ./restore.sh --force --db laundry_uji backups/laundry-20260914-020000.sql.gz
# restore ke database produksi (menimpa; --fresh menghapus lalu membuat ulang):
ENV_FILE=.env.prod ./restore.sh --force --fresh backups/laundry-20260914-020000.sql.gz
```

`DB_USERNAME`/`DB_DATABASE` dibaca dari `ENV_FILE` (default `.env.prod`) — tidak ada nama
hardcoded. Restore berakhir dengan ringkasan (tujuan, sumber, jumlah tabel publik).

## 7. Update rilis & rollback

Image diberi tag versi (`laundryos-api:<versi>`, `laundryos-web:<versi>`, `laundryos-site:<versi>`;
worker/scheduler memakai tag api yang sama), dan `docker-compose.prod.yml` membacanya lewat
`${API_IMAGE:-laundryos-api:prod}` dst.

```bash
cd /opt/laundryos && git pull && cd infra
./deploy-prod.sh "$(date +%Y-%m-%d)"      # atau ./deploy-prod.sh v1.4.0
```

`deploy-prod.sh` menolak jalan tanpa argumen versi, menjalankan `backup-prod.sh` lebih dulu
(deploy dibatalkan bila backup gagal), build image bertag versi, `up -d --remove-orphans`, lalu
memverifikasi `http://localhost/up` + `/api/v1/health`. Bila verifikasi gagal, skrip otomatis
kembali ke tag image yang sedang dipakai sebelumnya.

Rollback manual (mis. setelah menelusuri log):

```bash
docker images | grep laundryos-        # pastikan tag lama masih ada di host
API_IMAGE=laundryos-api:2026-09-13 \
WEB_IMAGE=laundryos-web:2026-09-13 \
SITE_IMAGE=laundryos-site:2026-09-13 \
  docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans --no-build
```

`--no-build` penting: tanpa itu compose akan membangun ulang dari sumber sekarang kalau tag lama
sudah hilang, dan "rollback" diam-diam berubah jadi deploy baru. Karena itu jangan memangkas image
lama (`docker image prune`) selama masih mungkin dipakai rollback.

Migrasi bersifat maju: image lama tidak menurunkan skema. Bila rilis baru mengubah skema dan perlu
kembali, jalankan manual:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api \
  php artisan migrate:rollback --step=1 --force
```

## 8. Observability & kesehatan

- `/up` (liveness) dan `/api/v1/health` (DB + cache) di host aplikasi.
- `docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f api worker scheduler certbot`.
- Backup gagal / worker mati: pasang alert eksternal (UptimeRobot, healthchecks.io) pada
  `/api/v1/health` dan log backup. Kegagalan hook reload certbot terlihat di `logs certbot`.
- Sentry direkomendasikan pada fase observability lanjutan.
