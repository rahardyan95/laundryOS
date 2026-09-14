# Checklist Go-Live LaundryOS

Dokumen operator: apa yang harus disiapkan manusia, urutan eksekusi, dan bukti yang harus dicatat
sebelum aplikasi dipakai pelanggan. Perintah teknis rinci ada di [`infra/DEPLOY.md`](../infra/DEPLOY.md);
rilis mobile ada di [`apps/mobile/README.md`](../apps/mobile/README.md).

Status: kode siap; blokir yang tersisa **milik pihak ketiga** (lihat §1).

---

## 1. Prasyarat pihak ketiga (harus disiapkan manusia)

| Kebutuhan | Dipakai untuk | Catatan |
|---|---|---|
| VPS Ubuntu 22.04/24.04, RAM ≥ 2 GB, Docker Engine + Compose v2 | seluruh stack produksi | port 80 & 443 terbuka |
| 3 DNS A-record: `laundryos.example`, `www.…`, `app.…` | situs pemasaran + dashboard/API | host aplikasi terpisah agar `/` milik situs |
| Domain aktif + email admin | sertifikat Let's Encrypt | `certbot` di profil `tls` |
| Bucket S3 **privat** | foto bukti antar-jemput | isi `AWS_*`; `FILESYSTEM_PROOF_DISK=s3` |
| Kredensial SMTP | email reset kata sandi, notifikasi | isi `MAIL_*`; uji dulu ke Mailpit/inbox nyata |
| DSN Sentry (api/web/mobile) | observability | `SENTRY_LARAVEL_DSN`, `SENTRY_DSN` mobile |
| Android keystore + akun Google Play | rilis store | lihat §4 |
| Proyek Firebase + `google-services.json` | push notification (FCM) | lihat §4 langkah 5; tanpa itu push tidak sampai |

---

## 2. Urutan eksekusi

Ikuti `infra/DEPLOY.md` berurutan; ringkasannya:

1. **§2 Konfigurasi** — `cp .env.prod.example .env.prod`, isi `APP_KEY` (`openssl rand -base64 32`
   dengan prefix `base64:`), `DB_PASSWORD`, `REDIS_PASSWORD`, `MAIL_*`, `AWS_*`,
   `PUBLIC_SITE_URL`/`PUBLIC_APP_URL`/`PUBLIC_API_URL`, dan daftar host aplikasi
   (`FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`).
   Lalu `docker compose --env-file .env.prod -f docker-compose.prod.yml config >/dev/null`.
2. **§3 Deploy** — `./deploy-prod.sh "$(date +%Y-%m-%d)"` (backup → build bertag versi → up → verifikasi).
3. **§4 Akun admin pertama** — `php artisan tenant:provision --name=… --outlet=… --email=… --password=… --plan=…`.
   Perintah ini idempoten: email yang sudah terdaftar ditolak tanpa mengubah data.
4. **§5 TLS** — minta sertifikat, salin `nginx/tls/laundryos-ssl.conf.example` dengan domain asli,
   `nginx -t`, uncomment baris redirect, `nginx -s reload`, lalu **verifikasi login lewat HTTPS**.
   Login web tidak akan bekerja sebelum langkah ini selesai (`SESSION_SECURE_COOKIE=true`).
5. **§6 Cron backup** — pasang `/etc/cron.d/laundryos-backup` dan uji `./backup-prod.sh` manual.
6. **§7 Rilis berikutnya** — selalu lewat `./deploy-prod.sh <versi>`; rollback manual memakai
   `API_IMAGE=… docker compose … up -d --no-build`.

---

## 3. Bukti verifikasi go-live (catat outputnya)

| # | Verifikasi | Perintah / cara | Hasil yang diharapkan |
|---|---|---|---|
| 1 | Liveness & kesehatan dalam | `curl -fsS https://app.<domain>/up` · `curl -fsS https://app.<domain>/api/v1/health` | `200`; health memeriksa DB + cache (503 bila salah satu mati) |
| 2 | Login owner hasil provisi | buka `https://app.<domain>/login` | dashboard terbuka; token/cookie terpasang |
| 3 | CORS origin web | preflight `OPTIONS /api/v1/auth/login` dengan `Origin: https://app.<domain>` | header `Access-Control-Allow-Origin` sesuai origin, bukan `*` |
| 4 | Rate limit tidak bisa dipalsukan | 11× login salah dengan `X-Forwarded-For` berbeda tiap kali | percobaan ke-11 `429` |
| 5 | Pelacakan pelanggan | buat order, lalu buka `https://app.<domain>/lacak` dengan nomor ticket + telepon | data order muncul; telepon salah → tidak ditemukan |
| 6 | Bukti foto | unggah bukti dari aplikasi kurir | `proof_url` bertanda tangan; buka URL → `200`; hapus `signature` → `403` |
| 7 | Backup | `./backup-prod.sh` lalu `gzip -t backups/laundry-*.sql.gz` | berkas > 0 byte, gzip utuh, exit 0 |
| 8 | Restore (drill) | `ENV_FILE=.env.prod ./restore.sh --force --db laundry_uji backups/<arsip>.sql.gz` | ringkasan jumlah tabel; DB produksi tidak tersentuh |
| 9 | Rollback (drill) | jalankan `deploy-prod.sh` dengan tag versi lama | `/up` + `/api/v1/health` kembali `200` pada versi lama |
| 10 | Aplikasi mobile | `flutter build appbundle --release --dart-define=API_BASE=https://app.<domain>/api/v1 --dart-define=SENTRY_DSN=…` lalu pasang ke perangkat | login berhasil; tab Tugas & Kas terisi; tanggal berbahasa Indonesia |
| 11 | Situs pemasaran | `curl -fsS https://<domain>/` dan `https://<domain>/sitemap-index.xml` | halaman + sitemap terjawab; `robots.txt` menunjuk host asli |

---

## 4. Rilis mobile ke Play Store

Semua langkah build sudah ada di `apps/mobile/README.md` §Rilis; urutan go-live-nya:

1. **Keystore** (sekali, simpan di luar repo + cadangan aman):
   ```bash
   keytool -genkeypair -v -keystore ~/laundryos-release.jks -alias laundryos \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
   Lalu isi `apps/mobile/android/key.properties` (berkas ini **gitignored**):
   `storeFile=…`, `storePassword=…`, `keyAlias=laundryos`, `keyPassword=…`.
2. **Versi** — naikkan `version: x.y.z+build` di `apps/mobile/pubspec.yaml`.
3. **Build** — `flutter build appbundle --release --dart-define=API_BASE=https://app.<domain>/api/v1 --dart-define=SENTRY_DSN=…`.
   Build rilis **gagal** bila `key.properties` tidak ada (guard di `build.gradle.kts`); opsi
   `-PallowDebugSigning=true` hanya untuk CI/emulator.
4. **Play Console** — buat app, isi Data safety (aplikasi **tidak** meminta izin lokasi,
   `allowBackup=false`, token perangkat untuk notifikasi), unggah AAB, jalankan internal testing →
   closed → production, lalu publikasikan.
5. **Push notification (FCM)** — prasyarat: proyek Firebase + `google-services.json` di
   `apps/mobile/android/app/`, lalu tambahkan `firebase_core`/`firebase_messaging` dan implementasikan
   `PushRegistrar` (`FirebaseMessaging.instance.getToken()`), ganti `NoopPushRegistrar` di
   `AppDependencies`. Wiring server ↔ aplikasi (`/auth/device-token`) sudah selesai dan teruji;
   tanpa langkah ini notifikasi hanya tercatat di server.

---

## 5. Setelah go-live

- Pasang alert eksternal pada `/api/v1/health` dan log backup (UptimeRobot/healthchecks.io).
- Drill restore **bulanan** ke database uji; jangan menunggu insiden.
- Jangan memangkas image lama (`docker image prune`) — tag lama adalah jalur rollback.
- Aktifkan Sentry (api/web/mobile) dan pantau minggu pertama.
- Catat versi image yang sedang live dan tanggal deploy di log operasi.

## 6. Yang belum ada di repo (dengan alasan)

| Hal | Sebab | Rencana |
|---|---|---|
| Push FCM benar-benar terkirim | butuh proyek Firebase + `google-services.json` | §4 langkah 5 |
| AAB bertanda tangan + listing store | butuh keystore produksi + akun Play | §4 langkah 1–4 |
| Restore otomatis terjadwal | drill restore sengaja manual | §5 |
| Payment gateway, WhatsApp Business, printer ESC/POS, WAF/pen-test | pasca-MVP, butuh vendor | backlog `docs/CHECKPOINT.md` §7 |
