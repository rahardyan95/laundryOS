# CHECKPOINT — LaundryOS

**Terakhir diverifikasi:** 2026-09-13 · **Status: SEMUA GATE HIJAU** ✅
Plan aktif menuju produksi: [`docs/superpowers/plans/2026-09-13-production-100.md`](superpowers/plans/2026-09-13-production-100.md) — **M0–M9 selesai**, **M10 (go-live) menunggu VPS/domain**.

## Gate verifikasi terkini (2026-09-13)

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
| Visual regression (win32, opt-in `VISUAL=1`) | baseline tersimpan |
| `docker build` image prod api & web | exit 0 (web serve HTTP 200 + CSP) |
| Astro `astro check` / `build` | 0 error / 3 halaman |
| Flutter `analyze` / `test` | 0 issue / 25 test |
| Flutter `build apk --debug` | exit 0 (`app-debug.apk`) |
| `docker compose -f infra/docker-compose.prod.yml config` | valid |

## Progres milestone M0–M9

- **M0** — Housekeeping produksi: git baseline, `.gitignore` (skill/backups/vendor), root `package.json`, `.dockerignore`.
- **M1** — Koreksi & paritas: role gate `/settings`, error boundary (`error`/`not-found`/`loading`), interceptor 401, pesan error asli, global API rate limit, paritas mock↔Laravel, `phpunit.xml` hermetis.
- **M2** — Auth httpOnly cookie Sanctum SPA (login stateful→sesi, non-browser→token), CORS credentials, refactor OOP logic layer (`TaskMachine`, `PaymentPolicy`, `ApiClientFactory`).
- **M3** — Backend prod: `Dockerfile.prod` (php-fpm+opcache, non-root), deep health (DB+cache), migrasi index performa, storage disk configurable, TrustProxies, log harian, nginx `api.conf`.
- **M4** — Frontend prod: `output: standalone`, CSP + security headers, robots/sitemap/manifest/icon, `apps/web/Dockerfile.prod`.
- **M5** — Security: Dependabot, workflow gitleaks/Trivy/audit, `SECURITY.md`, CORS methods eksplisit.
- **M6** — Deploy VPS artifact: `docker-compose.prod.yml`, nginx reverse proxy, certbot, `backup-prod.sh` (+offsite), `DEPLOY.md`, `.env.prod.example`.
- **M7** — QA: unit test logic, E2E security/404, E2E **Laravel nyata**, k6 load, visual regression, coverage gate.
- **M8** — `apps/site` (Astro): landing + harga + 404, SEO, CI `site.yml`.
- **M9** — `apps/mobile` (Flutter): M9a platform+DI/OOP+auth aman, M9b fitur per peran, M9c offline baca+tulis + Sentry + signing + push backend/device token.
- **Backlog (a)/(b)** — password reset, factory 7 model, Larastan, Sentry (backend), coverage gate, idempotency key, device token/push.

Rincian tiap milestone ada di changelog commit di bawah dan di plan produksi.

## Scope selesai (aplikasi)

- **R0 Foundation**: auth Sanctum (cookie SPA + token mobile), tenant/outlet + global scope isolasi, RBAC 5 peran.
- **R1 Core**: customer, katalog, order + state machine + ticket unik + snapshot harga, receipt, audit log, dashboard.
- **R2 Operations**: pickup/delivery + bukti foto, kas + tutup-kas terkunci, notifikasi (mail+in-app) + reminder terjadwal, laporan + CSV.
- **R3 SaaS**: paket Starter/Growth/Multi-Outlet, enforcement limit, status gate past_due, invite staf, tambah outlet.
- **R4 Web/Mobile/Site**: `apps/web` (Next 16), `apps/site` (Astro), `apps/mobile` (Flutter owner/staf/operator/kurir).
- **Integrasi**: `LaravelApiClient` (mock default; `NEXT_PUBLIC_API_MODE=laravel`) + mobile bearer token.
- **Keamanan**: abuse/IDOR/isolation tests, throttle, per_page cap, Trivy/audit bersih, CSP/HSTS, cookie httpOnly.
- **Operasional**: worker + scheduler, backup/restore, CI `api.yml`/`web.yml`/`site.yml`/`mobile.yml`/`security.yml`, `apps/api/API.md`.

## Cara jalan (dev)

```bash
cd infra && docker compose up -d        # pgsql, redis, mailpit, api(:8000), worker, scheduler
cd ../apps/web && pnpm install && pnpm dev   # :3000 (mock default)
cd ../apps/mobile && flutter run --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

Demo: `owner@laundryos.test` / `password` (kasir/operator/kurir sejenis). Mailpit: `:8025`.

## Ditunda sadar (butuh eksternal / pasca-MVP)

- **FCM native mobile**: backend siap (`/auth/device-token` + `PushNotifier`); perlu paket `firebase_messaging` + Google config.
- **Rilis Play/App Store**: butuh akun + signing produksi.
- **M10 go-live**: butuh VPS/domain (runbook `infra/DEPLOY.md`).
- Payment gateway, WhatsApp, printer thermal, refresh-token rotation, enkripsi PII at-rest, WAF/pen-test eksternal.

## Housekeeping

- Git: **13 commit** sejak baseline. Terbaru:
  - `325e426` offline write queue + idempotency keys + device token/push (M9c)
  - `482ad3c` mobile M9a · `d93455b` mobile M9b · `6dd0b15` mobile M9c
  - `a69dae2` site Astro (M8) · `c94c6ea` M4–M7 · `47601fa` M3 · `58de587` M2 · `7b2695b` baseline M0/M1
- `.env`, `node_modules`, `vendor`, `skill/`, `infra/backups/` gitignored.

## Arsip — Verifikasi baseline (2026-09-04, sebelum plan produksi)

| Gate | Hasil |
|---|---|
| Backend `php artisan test` | 109 passed, 363 assertions |
| `pint --test` | PASS, 143 files |
| Frontend `vitest run` | 41 passed (9 files) |
| `tsc --noEmit` / `eslint src` | 0 error / 0 error |
| `next build` | exit 0 |
| Playwright E2E (Chromium) | 6 passed, console 0 error |
| Infra `docker compose ps` | 6/6 Up (api, worker, scheduler, pgsql, redis, mailpit) |
