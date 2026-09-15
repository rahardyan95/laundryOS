# Implementation Plan — Release 3 SaaS (FR-015, BR-06)

**Tanggal:** 2026-09-04
**Basis:** PRD Release 3; FR-015 menegakkan plan, outlet limit, user limit, status subscription; billing manual (keputusan user).
**Strategi:** Backend TDD, lalu frontend settings, gate ganda.

> Skill: `writing-plans`, `test-driven-development`, `verification-before-completion`.

## Prinsip

1. **Paket sebagai config** (`config/plans.php`): starter {outlets 1, users 3, orders_per_month 500}, growth {3, 10, 2000}, multi_outlet {10, 50, 10000}. Label Indonesia.
2. **Enforcement di boundary:** outlet-limit saat `POST /outlets`, user-limit saat `POST /users`, volume bulanan saat `POST /orders` (via `PlanLimits` action; 422 bila tercapai).
3. **Status gate:** middleware `EnsureSubscriptionActive` — tenant `past_due`/`cancelled` → tulis (POST/PATCH/PUT/DELETE) 403 kecuali `auth/*`; baca tetap 200 (akun read-only, bukan terkunci total).
4. **Billing manual:** owner ganti paket via `PATCH /subscription` (tercatat audit `subscription.plan_changed`); invoice formal di luar sistem (keputusan).
5. **RBAC:** subscription/outlets-create/users-invite = owner only (FR-003); usage boleh owner+manajer.

## Backend (TDD)

| Task | RED | GREEN |
|---|---|---|
| R3.1 Subscription | GET usage angka benar (dipakai X dari limit Y); PATCH ganti plan (owner) + tercatat; kasir PATCH 403 | `PlanLimits` action (usage() + checkOutlet/checkUser/checkOrderVolume), `SubscriptionController` (show/update), routes |
| R3.2 Outlet create | POST outlet 201; outlet ke-2 di starter → 422; cross-tenant n/a (dibuat di tenant sendiri) | `StoreOutletRequest`, `OutletController@store` (authorize owner + limit check), route |
| R3.3 User invite | POST user 201 + login bisa dipakai; user ke-4 di starter → 422; email duplikat → 422; non-owner 403 | `StoreUserRequest` (name/email/password/role/outlet tenant-scoped), `UserController@store`, route |
| R3.4 Status gate | tenant past_due: POST order 403 + GET 200; POST /auth/logout tetap 200 | `EnsureSubscriptionActive` middleware, daftar di auth group |

Endpoints: `GET /subscription`, `PATCH /subscription`, `POST /outlets`, `POST /users`.

## Frontend

- `ApiClient`: `getSubscription()`, `updateSubscription(plan)`, `createOutlet(input)`, `inviteUser(input)` + mock & laravel + mappers (`Subscription {plan, planLabel, status, limits, usage}`).
- Settings: kartu paket (limit vs dipakai + ubah paket select owner), daftar outlet + dialog tambah, daftar staff + dialog invite.
- Verifikasi: skrip tsx sementara (limit enforcement E2E di tenant trial: buat outlet ke-2 → 422 dst.), `tsc`/`eslint`/`build`, hapus skrip.

## Gate Akhir R3
Suite hijau + frontend hijau + audit di plan ini. R4 (Flutter/Astro) di luar MVP — tidak dikerjakan.

## Catatan Audit 2026-09-04 (pasca-R3)

- **Backend: 81 passed, 282 assertions** (SubscriptionTest 10 baru); `pint --test` PASS 134 files.
- **Frontend: 11/11 asersi R3 HIJAU** vs API live (usage, ganti paket, limit outlet/user 422, invite, email duplikat); `tsc`/`eslint`/`next build` hijau; skrip dihapus; DB dev di-seed ulang bersih.
- **Pola lint React 19** (`set-state-in-effect` sebagai error) kini jadi konvensi: state async hanya di callback promise + cleanup `cancelled`, tanpa `setLoading(true)` sinkron di effect.
- **Batas MVP tercapai:** R0–R3 selesai. Sisa: R4 expansion, cookie httpOnly, scheduler pickup, gateway pembayaran, thermal print — semua tercatat di luar MVP.
