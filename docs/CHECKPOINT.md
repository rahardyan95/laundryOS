# CHECKPOINT — LaundryOS

**Terakhir diverifikasi:** 2026-09-13 · **Status: SEMUA GATE HIJAU** ✅
Plan aktif menuju produksi: [`docs/superpowers/plans/2026-09-13-production-100.md`](superpowers/plans/2026-09-13-production-100.md) (M0 & M1 & M2 selesai).

## Progres M0–M2 (2026-09-13)

| Gate | Hasil |
|---|---|
| Backend `php artisan test` | 110 passed, 370 assertions |
| `pint --test` | PASS, 143 files |
| Frontend `vitest run` | 40 passed (9 files) |
| `tsc --noEmit` / `eslint src` | 0 error / 0 error |
| `next build` | exit 0 |
| Playwright E2E (Chromium, mock) | 16 passed |

Perubahan utama: `.gitignore` produksi (skill/backups/vendor), root `package.json`, `.dockerignore`, role gate `/settings`, error/not-found/loading boundary, interceptor 401 global, pesan error asli di list page, global API rate limit 60/mnt, paritas mock↔Laravel, `phpunit.xml` hermetis, **auth httpOnly cookie Sanctum SPA** (login stateful → cookie sesi; non-browser → token), refactor OOP logic layer (`TaskMachine`, `PaymentPolicy`, `ApiClientFactory`).


## Verifikasi baseline (2026-09-04)

## Bukti verifikasi (fresh run)

| Gate | Hasil |
|---|---|
| Backend `php artisan test` | 109 passed, 363 assertions |
| `pint --test` | PASS, 143 files |
| Frontend `vitest run` | 41 passed (9 files) |
| `tsc --noEmit` / `eslint src` | 0 error / 0 error |
| `next build` | exit 0 |
| Playwright E2E (Chromium) | 6 passed, console 0 error |
| Infra `docker compose ps` | 6/6 Up (api, worker, scheduler, pgsql healthy, redis, mailpit healthy) |

## Scope selesai

- **R0 Foundation**: auth Sanctum (cookie SPA + token), tenant/outlet + global scope isolasi, RBAC 5 peran.
- **R1 Core**: customer, katalog, order + state machine + ticket unik + snapshot harga, receipt/struk, audit log, dashboard.
- **R2 Operations**: pickup/delivery + bukti foto, kas + tutup-kas terkunci, notifikasi queue (mail+in-app) + reminder terjadwal, laporan + CSV.
- **R3 SaaS**: paket Starter/Growth/Multi-Outlet, enforcement limit, status gate past_due, invite staf, tambah outlet.
- **Integrasi**: `LaravelApiClient` (mock default; `NEXT_PUBLIC_API_MODE=laravel` untuk backend nyata).
- **Keamanan**: 103+ asersi security (abuse, IDOR, throttle login 10/mnt + track 10/mnt, per_page cap 100, guest→401, id-aneh→404); `composer audit` + `pnpm audit` bersih; Trivy diremediasi (git dibuang); laporan `docs/security/REPORT-2026-09-04.md`.
- **Operasional**: worker + scheduler jalan; `infra/backup.sh`/`restore.sh` teruji; CI `api.yml` + `web.yml`; `apps/api/API.md`.

## Cara jalan (dev)

```bash
cd infra && docker compose up -d        # pgsql, redis, mailpit, api(:8000), worker, scheduler
cd ../apps/web && pnpm install && pnpm dev   # :3000 (mock mode default)
```

Demo: `owner@laundryos.test` / `password` (kasir/operator/kurir sejenis). Mailpit: `:8025`.

## Ditunda sadar (luar MVP)

R4 Flutter/Astro, payment gateway, WhatsApp, printer thermal, scheduler pickup lanjutan, cookie httpOnly + refresh-token rotation, CSP/HSTS, enkripsi PII at-rest, base image alpine, WAF/pen-test eksternal.

## Housekeeping

Git: **0 commit** — seluruh tree untracked (keputusan user: skip commit). `.env` & `node_modules` & `vendor` gitignored.
