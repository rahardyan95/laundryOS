# Plan — Integrasi Web & Mobile LaundryOS

**Tanggal:** 2026-09-14 · **Status:** Fase A–D selesai & terverifikasi; 1 tugas data demo tersisa (§5)
**Scope:** `infra/` (Docker), `apps/api` (Laravel 13), `apps/web` (Next 16), `apps/mobile` (Flutter)
**Skill dipakai:** `skill/superpowers-main` (writing-plans, verification-before-completion), `skill/agent-skills-main`,
`skill/DevOps-Security-Agent-Skills-main`, `skill/ui-ux-pro-max-skill-main` (stacks Next/Flutter)
**Context7:** `/laravel/sanctum`, `/websites/laravel_13_x` (Sanctum SPA stateful + CORS credentials)

> **Untuk agentic workers:** plan ini self-contained. Setiap fase punya langkah perintah + ekspektasi hasil.
> Jangan menandai sebuah fase selesai tanpa menjalankan perintah verifikasinya di §4.

**Goal:** web (`:3000`) dan mobile (Android emulator/device) berjalan normal terhadap **satu** API Laravel
yang sama di Docker, dengan skema auth per platform — cookie Sanctum SPA untuk web, bearer token untuk mobile.

**Architecture:** tiga klien → satu API. Web memakai Sanctum *stateful* (`/sanctum/csrf-cookie` → cookie
`laravel-session` httpOnly + `XSRF-TOKEN`), mobile memakai `POST /auth/login` tanpa `Origin` sehingga
mendapat `{token, user}`. Keduanya berbagi kontrak `apps/api/API.md` dan aturan status order yang sama.

**Tech Stack:** Laravel 13 + Sanctum 4 + PostgreSQL 16 + Redis 7 + Mailpit · Next 16 + React 19 + TS 5
+ Tailwind 4 · Flutter 3.47.4 / Dart 3.13.3 · Playwright 1.62 · Vitest 4.

**Spec:** `docs/CHECKPOINT.md`, `apps/api/API.md`, `docs/CARA-MENJALANKAN.md`, `AGENTS.md` (R1 OOP, R2 gate verifikasi).

---

## Global Constraints

- **R1 OOP** — semua logika non-UI di `class` (web: `src/lib/`, mobile: `src/api|domain|state|repositories/`). UI React/Flutter tetap function component/widget.
- **R2 Gate verifikasi** — perubahan wajib lolos: `tsc`, `eslint`, `vitest`, `next build`, `php artisan test`, `pint --test`, Playwright E2E.
- **Port kanonik** — web `3000` (dev), `3100` (Playwright), api `8000`, pgsql `5432`, redis `6379`, mailpit `8025`/`1025`.
- **Mobile base URL** — `--dart-define=API_BASE=http://10.0.2.2:8000/api/v1` (emulator Android; `10.0.2.2` = loopback host).
- **Frontend origin hanya boleh satu nilai** untuk `FRONTEND_URL` (dipakai tautan reset kata sandi); daftar origin CORS dipisah di `CORS_ALLOWED_ORIGINS`.
- **DB dev** — jangan `migrate:fresh` tanpa alasan; data demo sudah ada. Test backend memakai DB terpisah `laundry_test` (`phpunit.xml`).

---

## 1. Kondisi awal (audit 2026-09-14)

| Item | Kondisi terukur |
|---|---|
| Docker Desktop | aktif — engine `29.7.2`, **belum ada container** yang jalan |
| Port | `3000/8000/5432/6379/8025/1025` **tertutup** |
| Toolchain | node `v24.19.0`, pnpm `11.24.0`, Flutter `3.47.4` / Dart `3.13.3`; PHP tidak lokal (via Docker) |
| Device | emulator `Pixel_7_Pro` (Android 14/API 34) + Chrome/Edge web + Windows desktop |
| Playwright | Chromium `1234` terpasang di cache |
| `apps/api/.env` | ada, tapi `FRONTEND_URL=http://localhost:3100` dan 4 kunci duplikat |
| `apps/web/.env.local` | tidak ada → web default **mode mock** |
| DB `laundry` | sudah terisi data demo: 6 user, 2 outlet, 11 order, 8 customer, 6 service |
| `apps/mobile` | platform hanya `android/` + `ios/`; `test/` 10 file |

**Konsekuensi:** tidak perlu `migrate:fresh --seed`; cukup `migrate --force` (2 migrasi tertunda diterapkan).

---

## 2. Temuan audit

| # | Severity | Temuan | Bukti | Status |
|---|---|---|---|---|
| **F1** | 🔴 blocker | `FRONTEND_URL=http://localhost:3100` → `config('cors.allowed_origins')` hanya berisi `:3100`. Web di `:3000` (port dev kanonik) **diblokir CORS** — browser menolak karena `Access-Control-Allow-Origin: http://localhost:3100` ≠ origin `:3000`. | preflight `OPTIONS /api/v1/auth/login` `Origin: http://localhost:3000` → ACAO `:3100` | ✅ diperbaiki |
| **F2** | 🔴 blocker (regresi dari perbaikan F1) | `FRONTEND_URL` dipakai ganda: CORS *daftar* origin **dan** tautan reset kata sandi (`ResetPasswordNotification::resetUrl()` memakai `config('app.frontend_url')`). Menjadikannya daftar koma membuat URL reset rusak: `http://localhost:3000,http://localhost:3100/reset-password?...` | `apps/api/app/Domains/Identity/Notifications/ResetPasswordNotification.php:12`, `config/app.php:57` | ✅ dipisah (`CORS_ALLOWED_ORIGINS`) |
| **F3** | 🟡 minor | `apps/api/.env` punya kunci duplikat: `DB_DATABASE`, `DB_USERNAME`, `QUEUE_CONNECTION`, `REDIS_CLIENT` (baris terakhir menang, tapi rawan salah baca) | `apps/api/.env:64-81` | ✅ dirapikan |
| **F4** | 🔴 blocker mobile | `Format.dateTime()` memakai `DateFormat("d MMM yyyy, HH:mm", "id_ID")` **tanpa** `initializeDateFormatting()` → `LocaleDataException` saat runtime; kartu Tugas dan baris Notifikasi digantikan `ErrorWidget` (layar kosong tanpa pesan) | `flutter run` dump widget: `_TaskCard` → `ErrorWidget(message: LocaleDataException: Locale data has not been initialized…)` | ✅ diperbaiki |
| **F5** | 🔴 blocker mobile | `ApiClient.listCustomers/listServices/listNotifications` memanggil `_ensure(response).asMap["data"]` (bertipe `dynamic`) lalu `.whereType().map().toList()` → hasil `List<dynamic>` → `_TypeError: type 'List<dynamic>' is not a subtype of type 'FutureOr<List<T>>'`. Karena `NotificationController.refresh()` menelan semua error (`catch (_)`), gejalanya **daftar kosong senyap**. | diagnostik `flutter test`: `NOTIF THREW _TypeError … api_client.dart:175`; setelah fix `NOTIF items=1`, `customers rows=8`, `services rows=6` | ✅ diperbaiki |
| **F6** | 🟠 data | Seeder demo tidak membuat `delivery_tasks`, `cash_entries`, `cash_closings`, atau notifikasi — sehingga tab **Tugas** (kurir) & **Kas** kosong di instalasi bersih. | `DatabaseSeeder.php` hanya order/customer/service/user/outlet | ⏳ §5 T1 |
| **F7** | 🟡 distribusi | `.dart_tool/hooks_runner` yang basi membuat `flutter build apk` gagal: `Flutter failed to write to a file at …\hooks_runner\objective_c\<hash>\stdout.txt`. Muncul setelah sebuah proses flutter dibunuh di tengah build. | dua kali `flutter build apk --debug` gagal identik; `rm -rf .dart_tool/hooks_runner` → build sukses 26.6s | ✅ didokumentasikan (§6) |
| **F8** | 🟡 docs | `docs/CARA-MENJALANKAN.md` belum menyebut `CORS_ALLOWED_ORIGINS`, port `3100`, langkah `flutter pub get`, dan perintah emulator. | — | ✅ diperbarui |

---

## 3. Perubahan yang diterapkan

### 3.1 API — origin terpisah dari URL kanonik

- `apps/api/config/cors.php` — `allowed_origins` membaca `CORS_ALLOWED_ORIGINS` (daftar, dipisah koma), fallback ke `FRONTEND_URL`:
  ```php
  'allowed_origins' => array_filter(array_map(
      'trim',
      explode(',', env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', 'http://localhost:3000')))
  )),
  ```
- `apps/api/.env` — `FRONTEND_URL=http://localhost:3000` (satu origin, untuk tautan reset) + `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100`; kunci duplikat dihapus.
- `apps/api/.env.example` — idem + komentar eksplisit peran masing-masing variabel.

### 3.2 Mobile — locale & pemetaan koleksi

- `apps/mobile/lib/src/domain/format.dart` — `Format.initialize()` memanggil `initializeDateFormatting("id_ID")`; kelas yang membutuhkan data locale yang memilikinya.
- `apps/mobile/lib/main.dart` — `await Format.initialize();` sebelum `AppDependencies()` (dan sebelum `runApp`).
- `apps/mobile/lib/src/api/api_client.dart` — helper bertipe `List<T> _collection<T>(ApiResponse, T Function(Map<String, dynamic>))`; dipakai `listCustomers`, `listServices`, `listNotifications`.

### 3.3 Docs

- `docs/CARA-MENJALANKAN.md` — bagian CORS/port, langkah mobile + emulator, troubleshooting `hooks_runner`.
- `docs/CHECKPOINT.md` — tabel gate 2026-09-14.

---

## 4. Verifikasi (bukti eksekusi 2026-09-14)

### 4.1 Infrastruktur

```bash
cd infra && docker compose up -d          # build image api/worker/scheduler + 6 service
docker compose ps                          # 6/6 Up
docker compose run --rm -T api php artisan migrate --force   # 2 migrasi diterapkan
curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/health   # 200
```

Isi DB setelah verifikasi: `orders=11, customers=8, services=6, users=6, outlets=2, notifications=35,
activity_logs=37, delivery_tasks=1*, cash_entries=0, cash_closings=0` (*dibuat lewat API saat uji integrasi).

### 4.2 CORS (setelah fix, tiga origin)

| Origin | `Access-Control-Allow-Origin` |
|---|---|
| `http://localhost:3000` | `http://localhost:3000` ✅ |
| `http://localhost:3100` | `http://localhost:3100` ✅ |
| `http://evil.example` | *(tidak ada header)* ✅ |

`php artisan tinker`: `frontend_url=http://localhost:3000` · `cors=http://localhost:3000|http://localhost:3100`.

### 4.3 Gate otomatis

| Gate | Perintah | Hasil |
|---|---|---|
| Backend test | `docker compose run --rm -T api php artisan test` | **121 passed, 407 assertions** |
| Backend style | `… php vendor/bin/pint --test` | **PASS, 166 files** |
| Web types | `pnpm --filter web exec tsc --noEmit` | 0 error |
| Web lint | `pnpm --filter web exec eslint src` | 0 error |
| Web unit | `pnpm --filter web exec vitest run` | **51 passed (11 file)** |
| Web build | `pnpm --filter web build` | exit 0 — 19 route |
| Web E2E mock | `pnpm --filter web test:e2e` | **19 passed** |
| Web E2E API nyata | `pnpm --filter web test:e2e:laravel` | **2 passed** |
| Mobile analyze | `flutter analyze` | **0 issue** |
| Mobile unit | `flutter test` | **25 passed** |
| Mobile build | `flutter build apk --debug` | exit 0 — `build/app/outputs/flutter-apk/app-debug.apk` |

### 4.4 Integrasi silang (bukti perilaku, bukan test)

**Web `:3000` mode Laravel** (Chromium betulan, `NEXT_PUBLIC_API_MODE=laravel`):
`POST /auth/login` 200 → cookie `laravel-session(httpOnly=true)` + `XSRF-TOKEN`, `localStorage` token `null`,
`/dashboard` menampilkan data DB nyata (`Laundry Segar Nusantara`, `Budi Santoso`),
`/orders` 7 baris (`KMG-20260913-004 …`), `/tasks` memanggil `/delivery-tasks` + `/users?role=driver`,
**0 console error**.

**Mobile di emulator Android 14** (`API_BASE=http://10.0.2.2:8000/api/v1`):
login kurir → tab **Tugas** menampilkan kartu `Pickup · KMG-20260913-001 / Jl. Kemang Raya 1 / Jadwal: 15 Sep 2026, 17:00`
+ chip `Ditugaskan` + tombol `Mulai`; tab **Notifikasi** menampilkan `Tugas Pickup baru / Order KMG-20260913-001 · jadwal 15 Sep 10:00 / 14 Sep 2026, 11:02`.
Login owner → Dashboard KPI DB nyata (`Piutang Rp98.000`, `Kas masuk Rp177.700`, beban kerja per status).

**Alur lintas klien:** task dibuat owner lewat `POST /api/v1/delivery-tasks` → muncul di daftar kurir
(`driver_id=5`, terfilter per driver) dan dirender kartu di app mobile.

---

## 5. Sisa tugas

### T1 — Seed data demo untuk kurir & kas (belum)

**Files:** modify `apps/api/database/seeders/DatabaseSeeder.php`
**Kenapa:** tanpa ini, instalasi bersih menampilkan tab Tugas/Kas kosong sehingga peran kurir & kasir tidak bisa dinilai.

- [ ] Tambah `delivery_tasks` untuk `outlet Kemang` & `tebet` dengan driver `kurir@laundryos.test` (status `pending`/`assigned`/`done`).
- [ ] Tambah `cash_entries` (masuk/keluar) + satu `cash_closings` terkunci pada tanggal lampau.
- [ ] Verifikasi: `docker compose run --rm -T api php artisan migrate:fresh --seed` lalu
      `psql -c "select count(*) from delivery_tasks"` > 0 dan `flutter run` menampilkan kartu tugas.
- [ ] Jalankan ulang gate §4.3 (backend) karena fixture test memakai factory, bukan seeder.

### T2 — Push FCM native (butuh kredensial Google)
Backend siap (`/auth/device-token` + `PushNotifier`); mobile perlu `firebase_messaging` + `google-services.json`.

### T3 — Rilis Play/App Store (butuh akun + signing produksi)

### T4 — CI: cache `hooks_runner`
Tambahkan langkah pembersihan/ caching `.dart_tool/hooks_runner` di `.github/workflows/mobile.yml` bila build runner pernah gagal (F7).

---

## 6. Runbook

### 6.1 Backend + DB (sekali per sesi)

```bash
cd infra
docker compose up -d
docker compose ps                                   # 6/6 Up
docker compose run --rm -T api php artisan migrate --force
```

- API: http://localhost:8000/api/v1/health · Mailpit: http://localhost:8025
- Akun demo (password `password`): `owner@` `manager@` `kasir@` `operator@` `kurir@laundryos.test`

### 6.2 Web

```bash
pnpm install
# Mode API nyata (disarankan untuk integrasi) — cukup env proses, tidak perlu file:
NEXT_PUBLIC_API_MODE=laravel NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 pnpm --filter web dev --port 3000
# Mode mock (tanpa backend):
pnpm --filter web dev
```

Bila memakai `apps/web/.env.local`, pastikan origin-nya ada di `CORS_ALLOWED_ORIGINS` (default sudah memuat `3000` & `3100`).

### 6.3 Mobile (emulator Android)

```bash
cd apps/mobile
flutter pub get                                        # WAJIB setelah pull / ganti SDK
flutter emulators --launch Pixel_7_Pro                 # atau: flutter devices
flutter run -d emulator-5554 --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

Perangkat fisik: ganti `10.0.2.2` dengan IP LAN host (mis. `http://192.168.0.10:8000/api/v1`) dan
tambahkan origin tersebut ke `SANCTUM_STATEFUL_DOMAINS` bila memakai cookie; mobile memakai bearer token
sehingga hanya perlu API terjangkau.

### 6.4 Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Web login gagal / `CORS` di console | origin tidak ada di `CORS_ALLOWED_ORIGINS` | tambahkan origin, `docker compose restart api` tidak perlu — `.env` dibaca per request |
| Tautan reset kata sandi rusak | `FRONTEND_URL` diisi daftar koma | `FRONTEND_URL` **satu** origin; daftar ke `CORS_ALLOWED_ORIGINS` |
| Mobile: kartu/daftar kosong tanpa pesan | exception ditelan `catch (_)` di controller | cek struktur JSON vs model; jangan lewatkan nilai `dynamic` ke `whereType().map().toList()` |
| `LocaleDataException` | `initializeDateFormatting` belum dipanggil | `await Format.initialize()` di `main()` |
| `flutter build apk` gagal menulis `hooks_runner\...\stdout.txt` | cache native-assets basi | `rm -rf apps/mobile/.dart_tool/hooks_runner` lalu build ulang |
| `flutter test` error `expect/test isn't defined` (747 issues) | `.dart_tool` basi setelah ganti SDK | `flutter pub get` lalu ulangi |
| `docker compose run` me-recreate pgsql/redis | perilaku compose untuk service dependen | data aman (volume `pgdata`), atau pakai `docker compose exec` untuk query |

---

## 7. Risiko

- **Perubahan `.env` tidak otomatis ter-propagasi** ke container yang sudah jalan bila variabel ikut disinkronkan `infra/api-entrypoint.sh`; variabel di luar daftar itu (termasuk `CORS_ALLOWED_ORIGINS`) tetap dibaca langsung dari `.env` bind-mount.
- **`docker compose run`** me-recreate `pgsql`/`redis`; jangan dijalankan bersamaan dengan uji E2E API nyata.
- **Next 16 / Laravel 13 / Flutter 3.47** sangat baru — verifikasi perilaku library lewat Context7, jangan asumsi training data.
