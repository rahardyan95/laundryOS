# CHECKPOINT — LaundryOS

**Terakhir diverifikasi:** 2026-09-14 · **Status: semua gate hijau**
Dokumen pendamping: [`AGENTS.md`](../AGENTS.md) (aturan kode) · [`docs/CARA-MENJALANKAN.md`](CARA-MENJALANKAN.md) (runbook lengkap) ·
[`apps/web/DESIGN.md`](../apps/web/DESIGN.md) (identitas visual) · [`docs/superpowers/plans/2026-09-14-integrasi-web-mobile.md`](superpowers/plans/2026-09-14-integrasi-web-mobile.md) (plan integrasi terakhir).

---

## 0. Mulai di sini (kontributor berikutnya)

```bash
cd infra && docker compose up -d                     # pgsql, redis, mailpit, api(:8000), worker, scheduler
docker compose run --rm -T api composer install --no-interaction   # vendor/ (hanya klon bersih)
docker compose run --rm -T api php artisan migrate --force
cd .. && pnpm install

# web, mode API nyata (integrai penuh)
NEXT_PUBLIC_API_MODE=laravel NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 pnpm --filter web dev --port 3000

# mobile di emulator Android
cd apps/mobile && flutter pub get
flutter run -d emulator-5554 --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

`apps/api/.env` beserta `APP_KEY` dibuat otomatis oleh `infra/api-entrypoint.sh` saat container `api` pertama
kali jalan — tidak ada langkah manual.

Akun demo (semua password `password`): `owner@` · `manager@` · `kasir@` · `operator@` · `kurir@laundryos.test`.
Mailpit `:8025` · pelacakan pelanggan tanpa login: `http://localhost:3000/lacak`.

### Peta repo

| Path | Isi | Status |
|---|---|---|
| `apps/api` | Laravel 13 (modular monolith: Identity, Ordering, Operations, Catalog, Billing, Support) | ✅ R0–R3 + hardening |
| `apps/web` | Dashboard/POS Next 16 (mock + API nyata) | ✅ selesai |
| `apps/mobile` | Flutter: owner/manajer, kasir, operator, kurir | ✅ fitur lengkap, UI diperbarui 2026-09-14 |
| `apps/site` | Astro marketing/SEO | ✅ 3 halaman |
| `infra` | Docker dev + prod, nginx, backup, runbook deploy | ✅ dev jalan, prod siap dieksekusi |
| `docs/` | BRD/PRD/FRD, plan per fase, laporan keamanan, checkpoint ini | ✅ |

---

## 1. Gate verifikasi

Dijalankan dari root, kecuali disebut lain. Hasil terakhir 2026-09-14 (stack Docker hidup, 6/6 service Up).

| Gate | Perintah | Hasil |
|---|---|---|
| Backend test | `cd infra && docker compose run --rm -T api php artisan test` | **125 passed, 428 assertions** |
| Backend gaya | `… php vendor/bin/pint --test` | **PASS, 167 files** |
| Backend analisis | `… composer analyse` (Larastan L5) | 0 error (baseline ada) |
| Coverage | `… composer test:coverage` | 92,2% (gate 90) |
| Web tipe/lint | `pnpm --filter web exec tsc --noEmit` · `pnpm --filter web exec eslint src` | 0 · 0 |
| Web unit | `pnpm --filter web exec vitest run` | **51 passed** |
| Web build | `pnpm --filter web build` | exit 0, 19 route |
| Web E2E mock | `pnpm --filter web test:e2e` | **19 passed** |
| Web E2E API nyata | `pnpm --filter web test:e2e:laravel` | **2 passed** |
| Mobile analisis | `cd apps/mobile && flutter analyze` | **0 issue** |
| Mobile test | `flutter test` | **62 passed** |
| Mobile build | `flutter build apk --debug` | exit 0 |
| Mobile di perangkat | `flutter run -d emulator-5554 --dart-define=API_BASE=…` | render + data API nyata |
| Site | `pnpm --filter site build` | 3 halaman |
| Infra prod | `docker compose -f infra/docker-compose.prod.yml config` | valid (butuh `infra/.env.prod`) |

> Klon bersih tidak lagi butuh langkah manual `.env`: `infra/api-entrypoint.sh` menyalin `.env.example`
> dan membuat `APP_KEY` sendiri (bukti di §9). Commands yang benar untuk analisis/coverage adalah
> `composer analyse` / `composer test:coverage` (bukan `php composer …`).

---

## 2. Peta kode

**Mobile (`apps/mobile/lib/`)** — arah ketergantungan satu arah: `screens`/`widgets` → `state` → `repositories` → `api`.

| Folder | Isi |
|---|---|
| `src/theme/` | `AppPalette`, `AppSpacing`/`AppRadii`/`AppMotion`, `AppTypography`, `AppStatusTones`, `AppTheme` |
| `src/widgets/` | `AppScaffold`, `AsyncSection`, `EmptyState`, `ErrorNotice`, `StatusChip`, `SurfaceCard`, `StatTile`, `SectionHeader`, `ConnectivityBanner`, `BrandMark`, `LogoutButton` |
| `src/screens/` | `login`, `home_shell` (navigasi per peran), `dashboard`, `orders`, `new_order`, `tasks`, `notifications` |
| `src/state/` | `ChangeNotifier` per domain: auth, order, delivery task, catalog, notification, dashboard, connectivity, sync |
| `src/domain/` | Dart murni: `OrderMachine`, `TaskMachine`, `StatusKind`, `Format`, `Role` |
| `src/api/` | `ApiTransport` + `HttpApiTransport`, dekorator `CachingApiTransport` (offline baca) dan `OfflineApiTransport` (offline tulis + antrean idempotensi) |
| `assets/fonts/` | Plus Jakarta Sans variable + `OFL.txt` |

**Web (`apps/web/src/`)** — `lib/` (logika + `api/mock` dan `api/laravel`), `app/` (App Router), `e2e/` (mock) dan `e2e-laravel/` (API nyata).

**API (`apps/api/app/Domains/`)** — tiap domain punya `Models`, `Http/{Controllers,Requests,Resources}`, `Actions`, `Enums`, `Policies`.

---

## 3. Sistem UI mobile (ringkas, rinci di `AGENTS.md` R3)

- Dial **ENERGY 1 / RHYTHM 2 / MOTION 1**; identitas "Pine & Lime" sama dengan web.
- Semua warna/jarak/radius/durasi dari `src/theme/`; warna status lewat `StatusKind` (domain) → `StatusTones` (tema).
- Keadaan data wajib lewat `AsyncSection`; keadaan kosong menyebut sebab + tindakan.
- Kontras teks ≥ 4.5:1 dijaga otomatis oleh `test/theme_test.dart` (sudah diverifikasi bisa gagal).
- Mode gelap ikut sistem; keduanya diuji di `test/small_screen_layout_test.dart` pada 375x667.

---

## 4. Verifikasi 2026-09-14 (integrasi + UI mobile)

**Integrasi web ↔ mobile ↔ API** (stack nyata, web `:3000` mode Laravel, mobile di emulator Android 14):
login web memakai cookie httpOnly (token di storage `null`), `/orders` 7 baris dari PostgreSQL, `/tasks` memanggil
`/delivery-tasks` + `/users?role=driver`, 0 console error; mobile kurir menampilkan kartu tugas nyata dan notifikasi
`Tugas Pickup baru`, owner menampilkan KPI nyata (`Piutang Rp98.000`, `Kas masuk Rp177.700`).

**Cacat yang ditemukan & diperbaiki:**

1. **CORS salah origin** — `FRONTEND_URL` dipakai ganda (daftar CORS dan tautan reset). Daftar dipindah ke
   `CORS_ALLOWED_ORIGINS` (`config/cors.php`); `FRONTEND_URL` kembali satu origin.
2. **`_TypeError` di `ApiClient`** — `listCustomers`/`listServices`/`listNotifications` merantai
   `.whereType().map().toList()` dari nilai `dynamic` → `List<dynamic>` gagal type-check runtime, errornya ditelan
   `catch (_)` sehingga daftar tampak kosong. Diperbaiki dengan helper bertipe `_collection<T>()`.
3. **`LocaleDataException`** — kartu tugas dan baris notifikasi dirender `ErrorWidget` karena simbol tanggal `id_ID`
   belum dimuat. Sekarang `Format` punya jalur cadangan tanpa locale sehingga tidak pernah gagal, dan `main()`
   memanggil `Format.initialize()`.
4. **Permukaan UI mobile** — sebelumnya `ColorScheme.fromSeed` default, tanpa mode gelap, warna/ukuran tersebar di
   layar. Sekarang satu tema kelas + widget bersama (lihat §3).

Cacat nomor 2 dan 3 hanya terlihat dari menjalankan aplikasi di perangkat, bukan dari test: itulah alasan R2 mewajibkan
bukti perilaku, bukan hanya test hijau.

---

## 5. Pekerjaan berikutnya (urut prioritas)

Sisa dari audit go-live 2026-09-14 (yang sudah dikerjakan ada di §9).

| # | Pekerjaan | Kenapa | Mulai dari |
|---|---|---|---|
| 1 | Perintah provisi tenant pertama + DEPLOY.md | Tanpa ini instalasi produksi tidak punya owner; `DEPLOY.md` §4 hanya menyuruh tinker | `apps/api/app/Console/Commands/`, `infra/DEPLOY.md` §4 |
| 2 | Bukti foto: path ber-scope tenant, disk privat/URL bertanda tangan | `store('proofs', …)` datar; disk default `public` dan `prod-entrypoint` menjalankan `storage:link`, jadi `proof_url` bisa dibaca tanpa auth | `DeliveryTaskController@proof`, `DeliveryTaskResource`, `config/filesystems.php` |
| 3 | `/track`: entropi tiket + pencarian ber-scope | Tiket `{kode outlet}-{Ymd}-{seq}` (±999/hari) dengan telepon sebagai satu-satunya sekret; kode outlet bisa sama antar tenant dan query memakai `first()` tanpa scope | `TicketNumberGenerator`, `TrackController` |
| 4 | Tegakkan status langganan pada operasi baca + larang naik paket sendiri | `EnsureSubscriptionActive` hanya menahan tulis dan mengecualikan `api/v1/auth/*`; `PATCH /subscription` menulis `PlanTier` langsung | `EnsureSubscriptionActive`, `SubscriptionController` |
| 5 | Mobile offline: identitas pada cache + pembersihan saat logout | Cache GET tidak memuat identitas user dan tidak dibersihkan; antrean tulis di-flush memakai token siapa pun yang sedang login | `caching_api_transport.dart`, `session_store.dart`, `sync_controller.dart` |
| 6 | Rilis mobile: guard `API_BASE` + signing rilis + manifest | `apk --release` sukses tanpa keystore (debug signing — terbukti `CN=Android Debug`) dan default `API_BASE` menunjuk loopback emulator; izin lokasi tak terpakai, `allowBackup` belum diset | `app_config.dart`, `android/app/build.gradle.kts`, `AndroidManifest.xml` |
| 7 | TLS produksi + cookie aman | nginx produksi masih HTTP-only sementara `SESSION_SECURE_COOKIE=true` → login web gagal sampai 443 aktif | `infra/nginx/laundryos.conf`, `infra/DEPLOY.md` |
| 8 | CI: job E2E API nyata + build image produksi + pin Flutter | E2E Laravel hanya ada di mesin developer, jadi dua bug integrasi terakhir tidak bisa tertangkap CI | `.github/workflows/{api,web,mobile}.yml` |
| 9 | `restore.sh` + jalur rollback | Masker kegagalan yang sama seperti backup (tanpa `ON_ERROR_STOP`, user/DB hardcoded); tidak ada image berversi atau backup pra-migrasi | `infra/restore.sh`, `infra/docker-compose.prod.yml` |
| 10 | Deploy `apps/site` | Tidak ada service compose/blok nginx untuk situs; `robots.txt` menjanjikan sitemap yang tidak digenerate | `infra/docker-compose.prod.yml`, `apps/site/astro.config.mjs` |
| 11 | Seeder demo: `delivery_tasks`, `cash_entries`, `cash_closings` | Instalasi bersih membuat tab Tugas (kurir) dan Kas kosong, jadi peran itu tidak bisa dinilai | `apps/api/database/seeders/DatabaseSeeder.php` |
| 12 | FCM native mobile | Backend sudah siap (`/auth/device-token`, `PushNotifier`); mobile belum memanggilnya dan belum punya `firebase_messaging` | `apps/mobile/pubspec.yaml`, `apps/mobile/lib/src/app_dependencies.dart` |
| 13 | Rilis Play/App Store | Butuh akun + signing produksi | `apps/mobile/README.md` §Belum |
| 14 | Go-live M10 | Butuh VPS/domain | `infra/DEPLOY.md` |
| 15 | Adopsi `dart format` sekali saja | Menjalankan `dart format` sekarang menulis ulang seluruh `lib/`+`test/` (gaya baru Dart 3.7), jadi jangan dijalankan setengah jalan | commit terpisah, tanpa perubahan logika |
| 16 | Golden test visual mobile | Kontras dan tata letak sudah diuji teks; regresi piksel belum dijaga | `apps/mobile/test/` (`matchesGoldenFile`) |

Backlog fitur (pasca-MVP, butuh pihak ketiga): payment gateway, WhatsApp Business, printer thermal ESC/POS,
rotasi refresh token, enkripsi PII at-rest, WAF/pen-test eksternal.

---

## 6. Jebakan yang sudah diketahui

| Gejala | Sebab | Solusi |
|---|---|---|
| `flutter build apk` gagal menulis `hooks_runner\...\stdout.txt` | Cache native-assets basi setelah proses flutter dibunuh | `rm -rf apps/mobile/.dart_tool/hooks_runner` lalu build ulang |
| `flutter test` error `test`/`expect` isn't defined (ratusan issue) | `.dart_tool` basi setelah ganti SDK | `flutter pub get` lalu ulangi |
| Web di port lain gagal login (CORS di console) | Origin tidak ada di `CORS_ALLOWED_ORIGINS` | Tambahkan origin di `apps/api/.env`; `.env` dibaca per request, tanpa restart |
| Tautan reset kata sandi rusak | `FRONTEND_URL` diisi daftar koma | Isi satu origin; daftar hanya di `CORS_ALLOWED_ORIGINS` |
| `docker compose run` me-recreate pgsql/redis | Perilaku compose untuk service dependen | Data aman di volume `pgdata`; pakai `docker compose exec` untuk query |
| Daftar di aplikasi kosong tanpa pesan | Exception ditelan `catch (_)` | Cek bentuk JSON vs model; jangan lewatkan `dynamic` ke `whereType(...).map(...).toList()` |
| `flutter run` ditutup, aplikasi ikut mati | `flutter run` mematikan aplikasi saat keluar | `adb shell am start -n com.laundryos.laundryos_mobile/.MainActivity` (API_BASE sudah ter-bake di APK debug) |
| `phpstan` gagal `ignore.unmatched` | Entri baseline yang menutupi cacat yang sudah diperbaiki | Hapus entri itu dari `apps/api/phpstan-baseline.neon`; baseline bukan tempat menutup temuan nyata (lihat §9 butir 2) |
| Skrip `.sh` gagal `bash: /bin/bash: No such file` | `bash` di PATH mesin ini menunjuk WSL yang tidak lengkap | Jalankan dengan `sh <skrip>` (Git Bash) atau `sh -n` untuk cek sintaks |
| `[ -f /tmp/... ]` bernilai salah walau berkas ada | `/tmp` Git Bash tidak konsisten untuk builtin shell | Pakai path relatif di dalam repo (mis. `./backups/…`) untuk berkas sementara |
| Backup "sukses" tapi arsip 0 byte | Pipeline `pg_dump` → `gzip` menyembunyikan status `pg_dump` | Sudah diperbaiki di `infra/backup-prod.sh` (dump ke berkas mentah, cek ukuran + `gzip -t`); jangan kembali ke bentuk pipeline |

---

## 7. Riwayat milestone (M0–M9) dan scope selesai

- **M0** Housekeeping produksi (git baseline, `.gitignore`, root `package.json`, `.dockerignore`).
- **M1** Koreksi & paritas: role gate `/settings`, error boundary, interceptor 401, pesan error asli, rate limit global, paritas mock↔Laravel, `phpunit.xml` hermetis.
- **M2** Auth httpOnly cookie Sanctum SPA (stateful→sesi, non-browser→token), CORS credentials, refactor OOP logic layer (`TaskMachine`, `PaymentPolicy`, `ApiClientFactory`).
- **M3** Backend prod: `Dockerfile.prod` php-fpm+opcache non-root, deep health, index performa, storage disk configurable, TrustProxies, log harian, nginx `api.conf`.
- **M4** Frontend prod: `output: standalone`, CSP + security headers, robots/sitemap/manifest/icon, `Dockerfile.prod`.
- **M5** Security: Dependabot, workflow gitleaks/Trivy/audit, `SECURITY.md`, CORS methods eksplisit.
- **M6** Artifact deploy VPS: compose prod, nginx reverse proxy, certbot, backup + offsite, `DEPLOY.md`, `.env.prod.example`.
- **M7** QA: unit test logika, E2E security/404, E2E Laravel nyata, k6 load, visual regression, coverage gate.
- **M8** `apps/site` Astro (landing, harga, 404, SEO, CI).
- **M9** `apps/mobile` Flutter: M9a platform + DI/OOP + auth aman, M9b fitur per peran, M9c offline baca+tulis + Sentry + signing + device token/push.

Scope aplikasi selesai: **R0** fondasi (auth, tenant/outlet, RBAC 5 peran) · **R1** inti (customer, katalog, order +
state machine + tiket + snapshot harga, receipt, audit log, dashboard) · **R2** operasi (pickup/delivery + bukti foto,
kas + tutup kas, notifikasi + reminder, laporan + CSV) · **R3** SaaS (paket Starter/Growth/Multi-Outlet, limit,
status gate `past_due`, invite staf) · **R4** web/mobile/site.

---

## 8. Arsip verifikasi

| Tanggal | Catatan | Hasil inti |
|---|---|---|
| 2026-09-14 | Audit go-live + batch perbaikan pertama | lihat §9 (125 test backend · pint 167 file · phpstan 0 · coverage 92,2% · web 51 unit/19+2 E2E · mobile 0 issue/62 test/apk debug) |
| 2026-09-14 | Integrasi web↔mobile + UI mobile baru | lihat §1 dan §4 |
| 2026-09-13 | Plan produksi M0–M9 | Backend 121 test · web 51 unit + 18 E2E mock + 2 E2E Laravel · Flutter 25 test · coverage 92,2% |
| 2026-09-04 | Baseline sebelum plan produksi | Backend 109 test · web 41 unit · `next build` exit 0 · 6 E2E + 6/6 container Up |

Housekeeping: `.env`, `node_modules`, `vendor`, `skill/`, `infra/backups/` gitignored.

---

## 9. Batch perbaikan go-live (2026-09-14)

Audit penuh (backend, web, mobile, infra, keamanan) menemukan 8 blocker; lima yang paling murah dan berdampak
sudah diperbaiki **dengan bukti perilaku**, bukan hanya test hijau.

| # | Cacat | Perbaikan | Bukti |
|---|---|---|---|
| 1 | Rate limit bisa dilewati: `TRUSTED_PROXIES=*` + nginx meneruskan `X-Forwarded-For` klien | `bootstrap/app.php` tidak lagi memakai `*` (kosong = tanpa proxy); nginx menimpa header dengan `$remote_addr`; produksi memakai subnet tetap `172.28.0.0/16` (`docker-compose.prod.yml`) | Sebelum: 14 login dengan XFF berotasi → 14×422 (nol 429). Sesudah: 10×422 lalu 429. Test regresi `AuthTest::test_login_tidak_bisa_melewati_rate_limit_dengan_header_x_forwarded_for` |
| 2 | `GET /api/user` mengembalikan hash password + `remember_token` (`#[Hidden]` tertulis di `$fillable`, padahal atribut itu `TARGET_CLASS`; tanpa `$hidden`) | `#[Hidden([...])]` dipindah ke kelas `User`; entri baseline phpstan yang menutupi temuan ini dihapus | Sebelum: `password`+`remember_token` ada di respons. Sesudah: tidak ada. Test `UserExposureTest` (login, `/auth/me`, `/api/user`) |
| 3 | Backup produksi melaporkan sukses untuk arsip kosong (`pg_dump → gzip` menyembunyikan status) | `infra/backup-prod.sh`: `bash` + `set -euo pipefail`, dump ke berkas mentah, cek kosong + header "PostgreSQL database dump", `gzip -t`, `mv` setelah valid, `trap` membersihkan berkas antara | Kasus sukses: 18.993 byte, `gzip -t` utuh, exit 0. Kasus nama DB salah: exit 1, tidak ada berkas baru, tidak ada sisa `.part`/`.raw` |
| 4 | Klon bersih tidak bisa boot: tidak ada `APP_KEY` (entrypoint tidak membuat, compose tidak menyetel, CI tidak `key:generate`) | `infra/api-entrypoint.sh` menyalin `.env.example` → `.env`, menyinkronkan variabel dev, dan membuat `APP_KEY` saat `vendor/` sudah ada; compose dev menyetel `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS`/`SANCTUM_STATEFUL_DOMAINS`; `prod-entrypoint.sh` gagal cepat bila `APP_KEY` bukan `base64:…`; `phpunit.xml` memakai kunci tetap (test hermetis); CI punya langkah bootstrap | `.env` dihapus → container dijalankan ulang → login `200` (sebelumnya 500 `No application encryption key has been specified`), `.env` terisi `APP_KEY=base64:…` + tiga variabel dev; preflight CORS `:3100` dijawab tanpa `.env` lokal |
| 5 | Unggah bukti dari mobile selalu gagal: `MultipartFile.fromBytes` tanpa `filename`, jadi PHP membacanya sebagai field biasa | Tipe nilai `UploadFile` (nama + isi) diteruskan lewat `ApiTransport.postMultipart` → `HttpApiTransport` mengirim `filename` | Dengan `filename` hilang: HTTP 422 "Berkas harus berupa gambar." Sesudah perbaikan, skrip sementara memakai `HttpApiTransport` nyata: **HTTP 200** + `proof_url` |

Gate setelah perbaikan: backend 125 test / 428 assertion · `pint --test` PASS 167 file · `phpstan` 0 error ·
coverage 92,2% · web `tsc`/`eslint` 0 · vitest 51 · `next build` 19 route · E2E mock 19 + Laravel 2 ·
mobile `analyze` 0 issue, 62 test, `apk --debug` exit 0.

Belum dikerjakan (masih blocker, rinci di §5): provisi tenant pertama, scope/disk bukti foto, `/track`,
status langganan, lifecycle cache offline, guard rilis mobile, TLS produksi, CI, `restore.sh`, deploy situs.
