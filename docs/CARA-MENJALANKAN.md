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

# 2) Install dependency frontend (sekali saja)
pnpm install

# 3) Build + jalankan semua service backend
cd infra
docker compose build api
docker compose up -d

# 4) Migrasi + seed data demo
docker compose run --rm -T api php artisan migrate:fresh --seed

# 5) Jalankan frontend (terminal baru, dari root proyek)
cd ..
pnpm --filter web dev
```

Buka:
- **Web app:** http://localhost:3000 (mode mock — langsung bisa dipakai tanpa backend)
- **API:** http://localhost:8000/api/v1/health → `{"status":"ok"}`
- **Mailpit (email dev):** http://localhost:8025

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

## 5. Workflow harian

```bash
cd infra
docker compose up -d          # nyalakan semua (api, worker, scheduler, pgsql, redis, mailpit)
docker compose ps             # pastikan 6/6 Up
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
| web (Next.js) | 3000 | Dashboard/POS |
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
| E2E gagal `Tooltip must be used...` | Sudah diperbaiki (TooltipProvider di layout); pastikan kode terbaru |
| Port sudah dipakai | Hentikan service yang bentrok, atau ubah mapping di `infra/docker-compose.yml` |
| Mau data demo segar | `migrate:fresh --seed` (menghapus semua data dev) |

## 9. Dokumen terkait

- Status verifikasi terkini: `docs/CHECKPOINT.md`
- Kontrak API: `apps/api/API.md`
- Laporan keamanan: `docs/security/REPORT-2026-09-04.md`
- Requirement: `docs/BRD_LaundryOS_MVP.docx`, `PRD_LaundryOS_MVP.docx`, `FRD_LaundryOS_MVP.docx`
