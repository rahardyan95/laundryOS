# Cara Menjalankan LaundryOS

Panduan lengkap dari nol sampai aplikasi jalan. Estimasi setup pertama: ±15 menit (sebagian besar unduh image Docker).

## 1. Prasyarat

| Kebutuhan | Versi | Cek |
|---|---|---|
| Docker Desktop | terbaru, engine jalan | `docker --version` |
| Node.js | 24+ | `node --version` |
| pnpm | 11+ | `pnpm --version` |
| Git + Git Bash | — | `git --version` |

> Tidak perlu install PHP/Composer lokal — backend jalan penuh di Docker.

## 2. Setup pertama kali

```bash
# 1) Masuk direktori proyek
cd LaundryOS

# 2) Install dependency frontend (sekali saja, untuk mode native tanpa Docker)
pnpm install

# 3) Build + jalankan semua service backend + web (Docker)
cd infra
docker compose build api web
docker compose up -d

# 3b) Install dependency PHP (hanya perlu di klon bersih: vendor/ tidak di-commit)
docker compose run --rm -T api composer install --no-interaction

# 4) Migrasi + seed data demo
docker compose run --rm -T api php artisan migrate:fresh --seed

# 5) Jalankan frontend — pilih satu:
#    A) Via Docker (default, mode laravel, data nyata) — sudah jalan dari langkah 3:
#       http://localhost:3000
#    B) Native tanpa Docker (terminal baru, dari root proyek):
cd ..
pnpm --filter web dev
```

Buka:
- **Web app (Docker, mode laravel):** http://localhost:3000 (data nyata via API)
- **Web app (native, mode mock):** http://localhost:3000 setelah `pnpm --filter web dev` (in-memory, tanpa backend)
- **API:** http://localhost:8000/api/v1/health → `{"status":"ok"}`
- **Mailpit (email dev):** http://localhost:8025

## 2b. Web via Docker — detail

Service `web` di `infra/docker-compose.yml` memakai `apps/web/Dockerfile.dev`
(env dibaca saat runtime — beda dengan `Dockerfile.prod` yang membake
`NEXT_PUBLIC_*` saat build). Perubahan kode dimuat setelah `docker compose
restart web`; lihat catatan bind-mount di tabel perintah.

```bash
cd infra
docker compose up -d --build web   # default: NEXT_PUBLIC_API_MODE=laravel
docker compose logs -f web         # tunggu "Ready on http://0.0.0.0:3000"
```

| Kebutuhan | Perintah |
|---|---|
| Mode laravel (default, data nyata) | `docker compose up -d web` |
| Mode mock (tanpa API/DB) | `NEXT_PUBLIC_API_MODE=mock docker compose up -d web` |
| Rebuild setelah ganti `package.json` | `docker compose build --no-cache web && docker compose up -d web` |
| Berhenti | `docker compose stop web` |
| **Setelah mengubah kode web** | `docker compose restart web` (lihat catatan di bawah) |
| Masih menyajikan kode lama | `docker compose rm -sf web && docker volume rm infra_web-next && docker compose up -d web` |

> **Hot-reload di Docker Desktop (Windows) tidak bisa diandalkan.** Bind-mount
> Windows tidak meneruskan event perubahan file ke container, jadi `next dev`
> di dalam container sering tetap menyajikan kompilasi lama walau berkas sudah
> berubah — dan itu memunculkan gejala palsu seperti error yang "tidak hilang
> padahal sudah diperbaiki". Setelah mengubah kode: `docker compose restart web`
> (terbukti cukup memuat perubahan). Untuk pengembangan aktif, jalankan web
> native (`pnpm --filter web dev`) yang hot-reload-nya normal; simpan container
> `web` untuk sekadar menjalankan/melihat aplikasi.

> Browser di host mengakses API via `http://localhost:8000` (bukan `http://api:8000`
> — nama service hanya berlaku antar-container). Origin `http://localhost:3000`
> sudah ada di `CORS_ALLOWED_ORIGINS` / `SANCTUM_STATEFUL_DOMAINS` bawaan compose,
> jadi tidak perlu ubah `apps/api/.env` untuk setup default.

## 3. Akun demo

Password semua akun: `password`

| Email | Peran |
|---|---|
| `owner@laundryos.test` | Pemilik |
| `manager@laundryos.test` | Manajer |
| `kasir@laundryos.test` | Kasir |
| `operator@laundryos.test` | Operator |
| `kurir@laundryos.test` | Kurir |

Customer bisa lacak cucian tanpa login di http://localhost:3000/lacak (pakai nomor ticket + telepon).

## 4. Dua mode frontend

| Mode | Cara aktif | Data |
|---|---|---|
| **Mock** (default) | tanpa setting tambahan | In-memory, reset tiap reload |
| **Laravel** (API nyata) | buat `apps/web/.env.local` berisi: | PostgreSQL via API |

```bash
NEXT_PUBLIC_API_MODE=laravel
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> Restart `pnpm dev` setelah mengubah `.env.local`. Lihat `apps/web/.env.example`.
>
> **Origin web harus terdaftar di `CORS_ALLOWED_ORIGINS`** (default memuat `http://localhost:3000,http://localhost:3100`).
> Bila web dijalankan di port lain, tambahkan origin-nya di `apps/api/.env` lalu ulangi perintah yang gagal —
> `.env` dibaca setiap request, jadi tidak perlu me-restart container `api`.
> Jangan menaruh daftar koma di `FRONTEND_URL`: variabel itu satu origin dan dipakai untuk tautan reset kata sandi.

## 4b. Menjalankan mobile (Flutter)

```bash
cd apps/mobile
flutter pub get                                        # wajib setelah pull / ganti versi SDK
flutter emulators --launch Pixel_7_Pro                 # atau lihat device: flutter devices
flutter run -d emulator-5554 --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

- `10.0.2.2` = `localhost` host dari dalam emulator Android.
- **Perangkat fisik**: ganti dengan IP LAN host, mis. `--dart-define=API_BASE=http://192.168.0.10:8000/api/v1`.
- Mobile memakai **bearer token** (bukan cookie), jadi cukup API terjangkau — tidak perlu setting CORS.
- Gate: `flutter analyze` (0 issue), `flutter test` (62 test), dan `flutter build apk --debug`.
- Menjalankan APK yang sudah terpasang **tanpa** Flutter tool (mis. setelah `flutter run` ditutup, app ikut terminasi):
  ```bash
  adb shell am start -n com.laundryos.laundryos_mobile/.MainActivity
  ```
  `API_BASE` sudah ter-bake saat build; sesi dipulihkan dari secure storage (`/auth/me`).

## 5. Workflow harian

```bash
cd infra
docker compose up -d          # nyalakan semua (web, api, worker, scheduler, pgsql, redis, mailpit)
docker compose ps             # pastikan 7/7 Up
docker compose logs -f api    # lihat log API (Ctrl+C untuk keluar)
docker compose down           # matikan semua (data DB tetap tersimpan di volume)
```

Perintah berguna:

```bash
docker compose run --rm -T api php artisan test      # suite backend (91+ tests)
docker compose run --rm -T api php vendor/bin/pint --test   # gaya kode
docker compose run --rm -T api php artisan schedule:list    # cek jadwal reminder
```

```bash
# dari root
pnpm --filter web exec vitest run     # unit test frontend
pnpm --filter web exec playwright test  # E2E browser (Chromium)
```

## 6. Backup & restore database

```bash
cd infra
./backup.sh                                   # hasil: backups/laundry-YYYYMMDD-HHMMSS.sql.gz (butuh Git Bash)
./restore.sh backups/laundry-XXXX.sql.gz      # restore ke DB laundry_restore (tidak menyentuh data asli)
```

## 7. Layanan & port

| Service | Port | Kegunaan |
|---|---|---|
| web (Next.js dev, Docker) | 3000 | Dashboard/POS (default mode laravel; restart setelah ubah kode) |
| web (E2E Playwright) | 3100 | server sementara untuk `test:e2e` / `test:e2e:laravel` |
| api (Laravel) | 8000 | REST API |
| pgsql | 5432 | Database `laundry` (dev) |
| redis | 6379 | Antrean notifikasi |
| mailpit | 8025 / 1025 | UI email / SMTP dev |
| worker | — | Proses antrean |
| scheduler | — | Reminder pickup per jam |

## 8. Troubleshooting

| Gejala | Solusi |
|---|---|
| `localhost:8000` tidak connect | `docker compose ps` — pastikan `api` Up; bila Exited, `docker compose up -d --force-recreate api worker scheduler` |
| Login 422 padahal kredensial benar | DB dev kosong/belum seed → `migrate:fresh --seed` (lihat §2 langkah 4) |
| Login 429 | Rate limit 10/mnt aktif — tunggu ±1 menit |
| Web Docker masih menyajikan kode lama / error yang sudah diperbaiki tetap muncul | HMR bind-mount Windows tidak andal → `docker compose restart web`; bila masih, `docker compose rm -sf web && docker volume rm infra_web-next && docker compose up -d web` |
| Web login gagal, console browser menampilkan CORS | origin web tidak ada di `CORS_ALLOWED_ORIGINS` (`apps/api/.env`) — tambahkan, tidak perlu restart container |
| Tautan reset kata sandi di email rusak (URL mengandung koma) | `FRONTEND_URL` berisi daftar — isi satu origin, pindahkan daftar ke `CORS_ALLOWED_ORIGINS` |
| Email reset tidak muncul | Mailpit: http://localhost:8025 |
| Mobile: daftar kosong tanpa pesan error | Kemungkinan exception ditelan `catch (_)` di controller; cek bentuk JSON vs model, dan jangan lewatkan nilai `dynamic` ke `whereType(...).map(...).toList()` |
| Mobile: `LocaleDataException` | `await Format.initialize()` di `main()` memuat data locale `id_ID` |
| `flutter test` error `test`/`expect` isn't defined | `.dart_tool` basi setelah ganti SDK → `flutter pub get` lalu ulangi |
| `flutter build apk` gagal: `Flutter failed to write to a file at …hooks_runner\objective_c\…\stdout.txt` | cache native-assets basi → `rm -rf apps/mobile/.dart_tool/hooks_runner` lalu build ulang |
| E2E gagal `Tooltip must be used...` | Sudah diperbaiki (TooltipProvider di layout); pastikan kode terbaru |
| Port sudah dipakai | Hentikan service yang bentrok, atau ubah mapping di `infra/docker-compose.yml` |
| Mau data demo segar | `migrate:fresh --seed` (menghapus semua data dev) |

## 9. Dokumen terkait

- Status verifikasi terkini: `docs/CHECKPOINT.md`
- Plan & runbook integrasi web↔mobile: `docs/superpowers/plans/2026-09-14-integrasi-web-mobile.md`
- Kontrak API: `apps/api/API.md`
- Laporan keamanan: `docs/security/REPORT-2026-09-04.md`
- Requirement: `docs/REQUIREMENTS.md` (ringkasan; asli diarsipkan di `docs/archive/*.docx`)
