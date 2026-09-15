# Implementation Plan — Backend API Laravel (Release 0 + Release 1)

**Tanggal:** 2026-09-04
**Basis:** PRD Release 0 (Foundation) + Release 1 (Core laundry); FR-001…008, FR-014; QA-01, QA-02, QA-03, QA-06.
**Strategi:** TDD penuh dengan PHPUnit 12 via `php artisan test` (Red-Green-Refactor per skill `test-driven-development`; Pest dilepas karena konflik dependency dengan `laravel/pao` bawaan skeleton — diputuskan 2026-09-04, disiplin dependency skill code-review). OOP strict: backed enums, Action classes, Policies, FormRequests, Resources, global scope class. Modular monolith di `app/Domains/*`.

> Skill pengatur: `superpowers/writing-plans` (struktur), `test-driven-development` (TDD), `api-and-interface-design` (kontrak), `security-and-hardening` (batas), `verification-before-completion` (gate).

## Prinsip Non-Negotiable

1. **TDD Iron Law:** tidak ada production code tanpa failing test dulu. Satu perilaku per test, nama jelas, kode nyata (tanpa mock kecuali tak terhindarkan).
2. **Tenant isolation:** `TenantScope` (`#[ScopedBy]`) di semua model transaksional. Setiap test list/detail menyertakan kasus cross-tenant → 404 (QA-03). Scope fail-closed untuk HTTP guest (`1=0`); console (seeder/job) dikecualikan agar konteks tanpa-auth yang sah tetap bisa bekerja — endpoint HTTP tetap dilindungi `auth:sanctum` (401 dulu). Tidak ada `withoutGlobalScope` di production code.
3. **State machine order:** satu sumber kebenaran `TransitionOrderStatus` — transisi invalid → 422, tercatat di `order_status_histories` + audit (QA-02).
4. **Harga snapshot:** `order_items.unit_price` disalin dari katalog saat create; perubahan katalog tidak mengubah transaksi lama (FRD §6).
5. **Ticket unik per tenant:** format `{OUTLET_CODE}-{YYYYMMDD}-{SEQ3}` via `TicketNumberGenerator` (row lock `lockForUpdate` pada counter harian).
6. **Kontrak API v1** (`/api/v1`, snake_case — frontend `LaravelApiClient` memetakan ke camelCase):
   - Error konsisten: `{ "message": string, "errors"?: object }` (Laravel default, dipertahankan).
   - List: `?status=&q=` untuk orders (pagination ditunda hingga R2/pascal-MVP? — TIDAK: skill mewajibkan pagination dari awal → `?page=&per_page=` di semua list).
7. **Bahasa:** pesan error validasi Bahasa Indonesia (lang/id custom).

## File Structure

```
apps/api/                              # Laravel 13 (php:8.4, pgsql, predis)
├── app/Domains/
│   ├── Identity/                      # tenant, outlet, user, auth
│   │   ├── Enums/{Role,PlanTier,TenantStatus}.php
│   │   ├── Models/{Tenant,Outlet,User}.php
│   │   ├── Scopes/TenantScope.php
│   │   ├── Policies/{OutletPolicy,UserPolicy}.php
│   │   └── Http/{Requests/LoginRequest, Resources/{UserResource,OutletResource}, Controllers/AuthController}
│   ├── Catalog/                       # customer, service
│   │   ├── Models/{Customer,Service}.php
│   │   ├── Policies/{CustomerPolicy,ServicePolicy}.php
│   │   └── Http/{Requests/*, Resources/*, Controllers/*}
│   ├── Ordering/                      # order + items + history
│   │   ├── Enums/{OrderStatus,PaymentStatus,PaymentMethod}.php
│   │   ├── Models/{Order,OrderItem,OrderStatusHistory}.php
│   │   ├── Actions/{CreateOrder,TransitionOrderStatus,CancelOrder}.php
│   │   ├── Support/TicketNumberGenerator.php
│   │   ├── Policies/OrderPolicy.php
│   │   └── Http/{Requests/*, Resources/*, Controllers/*}
│   └── Support/                       # audit log, dashboard
│       ├── Models/ActivityLog.php
│       ├── Actions/RecordActivity.php
│       └── Http/Controllers/DashboardController.php
├── database/{migrations,factories,seeders}   # per-domain factories (TenantFactory, ...)
├── routes/api.php                     # grup v1 + auth:sanctum
├── tests/Feature/{Identity,Catalog,Ordering,Support}/*.php  # Pest
└── Dockerfile + ../infra/docker-compose.yml (pgsql, redis, mailpit, api)
```

**Endpoints R1** (mirror `ApiClient` frontend + FRD §5):

| Method | Endpoint | Aksi |
|---|---|---|
| POST | /v1/auth/login | Sanctum token (abilities per role) |
| POST | /v1/auth/logout | revoke token aktif |
| GET | /v1/auth/me | user + tenant + outlets |
| GET | /v1/outlets | outlet milik tenant |
| GET/POST | /v1/customers | list (page,q) / create |
| GET/PATCH | /v1/customers/{id} | detail / update |
| GET/POST | /v1/services | list / create |
| GET/PATCH | /v1/services/{id} | detail / update |
| GET/POST | /v1/orders | list (page,status,q) / create |
| GET | /v1/orders/{id} | detail + items + history |
| POST | /v1/orders/{id}/status | advance satu tahap |
| POST | /v1/orders/{id}/cancel | batal (hanya dari received) |
| GET | /v1/dashboard/summary | ordersToday, salesToday, outstanding, cashBalance, workload, readyWaiting |

## Task List (TDD tiap task: RED → verify fail → GREEN → verify pass → refactor)

### B0 — Docker infra + scaffold
- `infra/docker-compose.yml`: pgsql:16 (db `laundry`, test `laundry_test`), redis:7, mailpit.
- `apps/api/Dockerfile`: php:8.4-cli + pdo_pgsql, mbstring, bcmath, pcntl, zip, intl + composer + `php artisan serve 0.0.0.0:8000`.
- `composer create-project laravel/laravel` via container; `php artisan install:api`; `statefulApi()` di bootstrap/app.php; Pest (`composer require pestphp/pest --dev`, `pest:install`); `predis/predis` + REDIS_CLIENT=predis.
- phpunit.xml: koneksi pgsql `laundry_test`.
- Test pertama (RED): `GET /api/v1/health` → 200 `{status: ok}` — lalu route + controller minimal.
- **Verifikasi:** `docker compose up -d` + `./vendor/bin/pest` hijau + `curl /api/v1/health`.

### B1 — Identity: tenant/outlet scope + auth
- RED: login valid → 200 + `token`; login salah → 422; `GET /me` tanpa token → 401 (QA-06 spirit).
- GREEN: migration tenants/outlets/users (role enum, outlet_id, tenant_id, index), model + `TenantScope` (tenant dari `auth()->user()`; tanpa auth → scope tidak memfilter? Aturan: model bertenant SELALU diakses authed; testизоляasi di B5), `LoginRequest`, `AuthController@login/logout/me` (token abilities = `[role]`).
- RED: outlet milik tenant A tak terlihat user tenant B → 404 (QA-03).
- **Verifikasi:** pest `tests/Feature/Identity` hijau.

### B2 — RBAC policies
- RED: unit test matriks peran per policy (tanpa HTTP).
- GREEN: `Role` enum + `OrderPolicy/CustomerPolicy/ServicePolicy/OutletPolicy` + `#[UsePolicy]` + `authorize()` di controller.
- HTTP-level 403 diuji di task pemilik endpoint (B3/B4/B5) agar RED-GREEN tetap per perilaku.
- **Verifikasi:** `php artisan test` hijau.

### B3 — Customer CRUD
- RED: create valid → 201 + struktur JSON; tanpa nama → 422; cross-tenant detail → 404; list pagination (`meta`) + `q` filter.
- GREEN: migration/model/factory/Request/Resource/Controller.
- **Verifikasi:** pest hijau.

### B4 — Service catalog
- RED/GREEN sama pola B3 + field unit/price/estimated/active. Test: update harga tidak mengubah order lama (butuh B5? — tulis di B5 sebagai integrasi).
- **Verifikasi:** pest hijau.

### B5 — Order + state machine (inti)
- RED QA-01: create valid → 201, total = Σ snapshot, status `received`, history 1 baris, ticket format regex `/^[A-Z]+-\d{8}-\d{3}$/` unik.
- RED QA-02: `POST status` dari completed → 422 + status tetap; lompat tahap (received→drying) → 422.
- RED QA-03: order tenant A diakses user tenant B → 404 (list, detail, status).
- RED: `paid_amount >= total` → payment `paid`; `>0` → `partial`; `0` → `unpaid`; paid > total → 422.
- RED: update harga service → order lama utuh (snapshot).
- GREEN: `OrderStatus` enum + `TRANSITIONS` map di `TransitionOrderStatus` (+ `CancelOrder` guard), `CreateOrder` action (DB transaction + lock counter ticket), `OrderResource` (items + history), controller tipis.
- **Verifikasi:** pest `tests/Feature/Ordering` hijau, seluruh suite hijau.

### B6 — Dashboard + audit
- RED: summary angka = agregat order seed (ordersToday, salesToday, outstanding, workload per status, readyWaiting ≥12 jam); tanpa auth → 401.
- RED: setiap create/transition/cancel menulis `activity_logs` (actor + timestamp); cross-tenant tak bocor.
- GREEN: `DashboardController` (query agregat, scope outlet opsional `?outlet_id=`), `RecordActivity` dipanggil dari Actions.
- **Verifikasi:** pest hijau.

### B7 — Seeder demo + CI + gate
- `DatabaseSeeder`: 1 tenant, 2 outlet, 5 user (1/role utama), 8 customer, 6 service, 12 order tersebar (cermin mock frontend) — untuk dev & demo.
- `.github/workflows/api.yml`: php 8.4 + pgsql service + composer + pint --test + pest.
- Gate akhir: `pest` (semua hijau), `pint --test`, `curl` tiap endpoint R1 via seeder, catat di plan (audit section).
- **Batas:** R2 (pickup/delivery, cash, notifikasi, reports) & R3 (subscription) TIDAK dikerjakan — dicatat sebagai plan berikut.

## Handoff Eksekusi
Eksekusi inline sesi ini. Setelah B7, tulis `LaravelApiClient`? TIDAK — itu plan frontend terpisah. Backend selesai = kontrak R1 hidup & teruji.

## Catatan Audit 2026-09-04 (pasca-B7)

- **Hasil akhir: 44 tests passed, 142 assertions, 0 gagal** (`php artisan test` di pgsql `laundry_test`); `pint --test` PASS; seeder demo (1 tenant, 2 outlet, 5 user, 8 customer, 6 service, 11 order) termigrasi bersih; verifikasi live via curl: login→token, me, outlets, customers, services, orders?status, dashboard summary — semua 200 dengan angka konsisten.
- **Insiden serve-env (diperbaiki):** proses `php -S` yang di-spawn `artisan serve` TIDAK mewarisi environment container (terbukti: `getenv()=False` via HTTP vs `=pgsql` via exec) → login 422 + 500 massal. Solusi: `infra/api-entrypoint.sh` menyinkronkan env container ke `.env` saat boot (idempoten; `.env` di-gitignore).
- **Keputusan arsitektur:** Pest dilepas (konflik `laravel/pao` skeleton) → PHPUnit 12; `TenantScope` fail-closed untuk HTTP guest, dikecualikan untuk console (seeder/job); `cash_balance` R1 = Σ `paid_amount` order aktif (modul kas R2 akan menggantikan); tanpa `laravel/boost` & tanpa PHP lokal (kontra AGENTS.md skeleton — diputuskan: Docker-only sesuai FRD infra).
- **Batas R1 (dicatat untuk plan berikut):** pickup/delivery, kas & tutup kas, notifikasi, laporan/export (R2); subscription & plan limit (R3); `LaravelApiClient` frontend (snake_case→camelCase).
