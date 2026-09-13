# CHECKPOINT — LaundryOS

**Terakhir diverifikasi:** 2026-09-13 · **Status: SEMUA GATE HIJAU** ✅
Plan aktif menuju produksi: [`docs/superpowers/plans/2026-09-13-production-100.md`](superpowers/plans/2026-09-13-production-100.md) (M0–M9 selesai; M10 menunggu VPS).

## Progres M0–M9 (2026-09-13)

| Gate | Hasil |
|---|---|
| Backend `php artisan test` | 121 passed, 407 assertions |
| `pint --test` | PASS, 166 files |
| `phpstan analyse` (Larastan L5) | 0 errors (baseline) |
| Backend coverage (pcov) | 92.2% (gate min 90) |
| Frontend `vitest run` | 51 passed (11 files) |
| `tsc --noEmit` / `eslint src` | 0 error / 0 error |
| `next build` | exit 0 (manifest/robots/sitemap/icon) |
| Playwright E2E (Chromium, mock) | 18 passed |
| Playwright E2E (Laravel nyata) | 2 passed (cookie httpOnly) |
| Visual regression (win32, opt-in) | baseline tersimpan |
| `docker build` api & web prod | exit 0 (web serve HTTP 200 + CSP) |
| Astro `astro check` / build | 0 error / 3 halaman |
| Flutter `analyze` / `test` | 0 issue / 25 test |
| Flutter `build apk --debug` | exit 0 (app-debug.apk) |
| `docker compose -f infra/docker-compose.prod.yml config` | valid |

Perubahan utama: housekeeping produksi, role gate `/settings`, error boundary, interceptor 401, rate limit, paritas mock↔Laravel, auth httpOnly cookie Sanctum SPA, refactor OOP, image prod api+web, deep health + index DB, security CI + Dependabot, artifact deploy VPS, apps/site Astro, password reset, factory 7 model, Larastan, Sentry, coverage gate, E2E Laravel nyata, k6, visual regression, idempotency key + device token/push, **mobile Flutter M9a–M9c** (platform, DI/OOP, fitur per peran, offline baca+tulis, Sentry, signing).


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
