# LaundryOS

SaaS operasional UMKM — dimulai dari laundry kiloan/satuan. Digitalisasi order, status cucian, pelanggan, pickup/delivery, kas, dan notifikasi dalam satu aplikasi.

> **Mulai dari sini:** panduan menjalankan lengkap ada di [`docs/CARA-MENJALANKAN.md`](docs/CARA-MENJALANKAN.md) · Status verifikasi: [`docs/CHECKPOINT.md`](docs/CHECKPOINT.md)

## Status

| Path | Isi | Status |
|---|---|---|
| `apps/web` | Dashboard/POS — Next.js + TypeScript + shadcn/ui | ✅ Selesai (mock + mode API nyata) |
| `apps/api` | API — Laravel 13 modular monolith | ✅ Selesai (R0–R3 + hardening) |
| `infra/` | Docker: pgsql, redis, mailpit, api, worker, scheduler | ✅ |
| `apps/mobile` | Flutter (owner/staff/driver) | Pasca-MVP |
| `apps/site` | Astro marketing/SEO | Pasca-MVP |
| `docs/` | BRD, PRD, FRD, plans, checkpoint, laporan keamanan | ✅ |

## Quick start

```bash
cd infra && docker compose up -d
docker compose run --rm -T api composer install --no-interaction   # hanya klon bersih
docker compose run --rm -T api php artisan migrate:fresh --seed
cd .. && pnpm install && pnpm --filter web dev
```

`apps/api/.env` + `APP_KEY` dibuat otomatis saat container `api` pertama jalan (klon bersih tidak butuh langkah manual).

Web: http://localhost:3000 · API: http://localhost:8000/api/v1/health · Demo: `owner@laundryos.test` / `password`

## Dokumen

- `docs/CARA-MENJALANKAN.md` — setup, workflow harian, troubleshooting
- `docs/CHECKPOINT.md` — status verifikasi terkini
- `docs/GO-LIVE-CHECKLIST.md` — checklist rilis: prasyarat pihak ketiga, urutan deploy, bukti verifikasi, rilis mobile
- `docs/BRD_LaundryOS_MVP.docx` — kebutuhan bisnis
- `docs/PRD_LaundryOS_MVP.docx` — produk, persona, release plan
- `docs/FRD_LaundryOS_MVP.docx` — requirement fungsional + QA cases
- `docs/superpowers/plans/` — implementation plans per fase
- `docs/security/REPORT-2026-09-04.md` — laporan security testing
- `apps/api/API.md` — kontrak API v1
