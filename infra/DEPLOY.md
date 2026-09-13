# Deploy LaundryOS ke VPS (Docker Compose + TLS)

Arsitektur: `nginx` (edge) → `web` (Next standalone) + `api` (PHP-FPM) → `pgsql` + `redis`.
Worker & scheduler menjalankan antrean dan reminder. Semua service terisolasi di network `backend`.

## 1. Prasyarat VPS

- Ubuntu 22.04/24.04, RAM ≥ 2 GB, Docker Engine + Compose v2.
- Domain A-record mengarah ke IP VPS (mis. `laundryos.example`).
- Buka port 80 & 443.

## 2. Ambil kode & konfigurasi

```bash
git clone <repo> /opt/laundryos
cd /opt/laundryos/infra
cp .env.prod.example .env.prod
# isi .env.prod: APP_KEY, DB_PASSWORD, REDIS_PASSWORD, MAIL_*, AWS_*, PUBLIC_*
openssl rand -base64 32   # contoh APP_KEY (tambahkan prefix "base64:")
```

> `.env.prod` **tidak boleh** di-commit. Set `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`.

## 3. Build & jalankan

```bash
cd /opt/laundryos/infra
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
curl -fsS http://localhost/up
curl -fsS http://localhost/api/v1/health
```

Service `api` menjalankan migrasi otomatis lewat entrypoint (`RUN_MIGRATIONS=1`).
`worker`/`scheduler` tidak menjalankan migrasi.

## 4. Akun admin pertama

Seed demo tidak dipakai di produksi. Buat tenant + owner lewat tinker:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api php artisan tinker
```

## 5. TLS (Let's Encrypt / certbot)

1. Pastikan `nginx/laundryos.conf` memuat `location /.well-known/acme-challenge/` (sudah ada).
2. Minta sertifikat:
   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm --profile tls certbot \
     certonly --webroot -w /var/www/certbot -d laundryos.example \
     --email admin@laundryos.example --agree-tos --no-eff-email
   ```
3. Aktifkan blok `server { listen 443 ssl; ... }` di `nginx/laundryos.conf`, isi `server_name` + path sertifikat.
4. `docker compose --env-file .env.prod -f docker-compose.prod.yml exec nginx nginx -s reload`.
5. Jalankan layanan `certbot` (profil `tls`) untuk perpanjangan otomatis.

## 6. Backup

```bash
# uji manual
./backup-prod.sh
# cron harian 02:00
echo '0 2 * * * /opt/laundryos/infra/backup-prod.sh >> /var/log/laundryos-backup.log 2>&1' | sudo tee /etc/cron.d/laundryos-backup
```

Restore (ke DB uji, verifikasi dulu):
```bash
gunzip -c backups/laundry-XXXX.sql.gz | docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T pgsql psql -U laundry laundry_restore
```

## 7. Update rilis

```bash
cd /opt/laundryos && git pull
cd infra
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api php artisan migrate --force
```

Rollback: `git checkout <tag-sebelumnya>`, build ulang, `up -d`. Migrasi bersifat maju; siapkan
down-migration bila perlu.

## 8. Observability & kesehatan

- `/up` (liveness) dan `/api/v1/health` (DB + cache).
- `docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f api worker scheduler`.
- Backup gagal / worker mati: pasang alert eksternal (UptimeRobot, healthchecks.io) pada `/api/v1/health` dan log backup.
- Sentry direkomendasikan pada fase observability lanjutan.
