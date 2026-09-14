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
Untuk rilis ke pelanggan: [`docs/GO-LIVE-CHECKLIST.md`](GO-LIVE-CHECKLIST.md) (prasyarat pihak ketiga,
urutan deploy, bukti verifikasi, rilis mobile).

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
| Backend test | `cd infra && docker compose run --rm -T api php artisan test` | **141 passed, 484 assertions** |
| Backend gaya | `… php vendor/bin/pint --test` | **PASS, 171 files** |
| Backend analisis | `… composer analyse` (Larastan L5) | 0 error (baseline ada) |
| Coverage | `… composer test:coverage` | 92,3% (gate 90) |
| Web tipe/lint | `pnpm --filter web exec tsc --noEmit` · `pnpm --filter web exec eslint src` | 0 · 0 |
| Web unit | `pnpm --filter web exec vitest run` | **51 passed** |
| Web build | `pnpm --filter web build` | exit 0, 19 route |
| Web E2E mock | `pnpm --filter web test:e2e` | **19 passed** |
| Web E2E API nyata | `pnpm --filter web test:e2e:laravel` | **2 passed** |
| Mobile analisis | `cd apps/mobile && flutter analyze` | **0 issue** |
| Mobile test | `flutter test` | **81 passed** (termasuk 4 golden) |
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

Sisa dari audit go-live 2026-09-14. Semua pekerjaan yang bisa dikerjakan di repo sudah selesai
(§9–§11); yang tersisa butuh pihak ketiga atau akun berbayar.

| # | Pekerjaan | Kenapa | Mulai dari |
|---|---|---|---|
| 1 | Push FCM benar-benar terkirim | Wiring server ↔ aplikasi sudah ada dan teruji; butuh proyek Firebase + `google-services.json` lalu `firebase_messaging` | `docs/GO-LIVE-CHECKLIST.md` §4 langkah 5 |
| 2 | AAB bertanda tangan + listing Play Store | Butuh keystore produksi + akun Google Play | `docs/GO-LIVE-CHECKLIST.md` §4 langkah 1–4 |
| 3 | Deploy ke VPS/domain | Butuh VPS + DNS + SMTP + bucket S3 | `docs/GO-LIVE-CHECKLIST.md` §1–§3 |
| 4 | Drill restore bulanan & alert eksternal | Operasional berjalan | `docs/GO-LIVE-CHECKLIST.md` §5 |

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
| 2026-09-14 | Audit go-live + tiga batch perbaikan | lihat §9–§11 (141 test backend · pint 171 file · phpstan 0 · coverage 92,3% · web 51 unit/19+2 E2E · mobile 0 issue/81 test/apk debug) |
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

Belum dikerjakan setelah batch pertama (dikerjakan di §10): provisi tenant pertama, scope/disk bukti foto,
`/track`. Sisanya masih blocker dan rinci di §5.

---

## 10. Batch perbaikan go-live kedua (2026-09-14)

Tiga blocker berikutnya: jalur produksi nyata (provisioning, foto bukti, pelacakan publik).

| # | Cacat | Perbaikan | Bukti |
|---|---|---|---|
| 6 | Tidak ada jalan membuat tenant pertama di produksi — `DEPLOY.md` §4 menyuruh `tinker` manual | Command `tenant:provision {--name} {--outlet} {--email} {--password} {--plan}` (membuat tenant aktif + outlet + owner, kode outlet 3 huruf unik per tenant, idempoten by email); `DEPLOY.md` §4 memuat perintah yang bisa disalin | Live di stack dev: perintah pertama → `Tenant #2 "Uji Provisi" (starter)` + `Outlet #3 … kode TEB` + `Owner #7`, exit 0; owner hasil provisi bisa login (`role: owner`); dijalankan ulang dengan email sama → exit 1 tanpa baris baru; data uji lalu dibersihkan. Test `ProvisionTenantTest` (5 kasus: sukses, email duplikat, opsi kosong, paket salah, kata sandi pendek) |
| 7 | Foto bukti tersimpan di prefix datar pada disk `public` dan disajikan tanpa autentikasi | `proof()` menyimpan ke `proofs/{tenant_id}/{outlet_id}`; disk default `local` (privat); `proof_url` menjadi URL bertanda tangan + kedaluwarsa 30 menit ke route baru `GET /delivery-tasks/{task}/proof` (`signed`, throttle 60/menit) yang menyajikan berkas dari disk apa pun | Live: unggah sebagai kurir → `proof_path = proofs/1/1/<hash>.png`, berkas ada di `storage/app/private/…`; `proof_url` = `…/proof?expires=…&signature=…`; GET tanpa auth → **200, 66 byte, image/png**; GET tanpa signature → **403**; signature palsu → **403**. Test: scope path + URL bertanda tangan bisa dibuka, tanpa/ dengan tanda tangan palsu 403, task tanpa berkas 404 |
| 8 | `/track` mencocokkan satu kandidat `first()` lintas tenant dan membandingkan telepon dengan normalisasi longgar | Semua kandidat ticket diperiksa, pembandingan memakai `hash_equals` setelah normalisasi digit, dan hanya diterima bila **tepat satu** cocok; nomor tanpa digit ditolak lebih awal | Test: tiket sama di dua tenant tidak tertukar (masing-masing telepon menerima total miliknya), tiket ambigu dengan telepon sama → 404, telepon tanpa digit → 404, spasi → 422. Live: ticket+telepon benar 200, telepon salah 404 |

Gate setelah batch kedua: backend **135 test / 463 assertion** · `pint --test` PASS **169 file** ·
`phpstan` **0 error** (tanpa menambah entri baseline) · coverage **92,5%** · web `tsc`/`eslint` 0 ·
vitest 51 · `next build` 19 route · E2E mock 19 + Laravel 2 · mobile `analyze` 0 issue + 62 test.

---

## 11. Batch perbaikan go-live ketiga (2026-09-14)

Sisa dua belas item audit, dikerjakan paralel per area (API+web, mobile, infra+situs, CI).

| # | Item | Perbaikan | Bukti |
|---|---|---|---|
| 1 | Status langganan & naik paket sendiri | Baca **dan** tulis ditutup untuk tenant non-aktif (kecuali auth + `GET /subscription`), respons membawa `code: subscription_inactive`; endpoint `PATCH /subscription` dihapus (route, controller, policy, UI web, mock) dan diganti command operator `tenant:plan {tenant|email} {plan}` yang mencatat ActivityLog | Live: `PATCH` → 405; `past_due`: `/orders`,`/customers`,`/reports/sales.csv`,`/dashboard/summary` → 403 ber-`code`, `/subscription`+`/auth/me` → 200; kembali `active` → 200. `tenant:plan` lewat id & email, idempoten, 2 entri log |
| 2 | Lifecycle cache/antrean offline mobile | Cache GET dikunci identitas user (`u<id>\|path`); `PendingMutation` menyimpan `userId` dan hanya diputar ulang untuk sesi yang sama; logout mengosongkan cache + antrean (juga saat offline); cold start yang sudah online mem-flush sekali; `catch (_)` yang menelan kegagalan simpan dihapus | `flutter test` 81/81 termasuk 8 test baru (a–d + logout offline + kegagalan simpan tidak dilaporkan aman) |
| 3 | Guard rilis mobile | `AppConfig.assertReleaseReady()` (https + host non-loopback) dipanggil di `main()`; `build.gradle.kts` gagal saat tugas Release tanpa `key.properties` (+ opsi `-PallowDebugSigning`); izin lokasi dihapus; `allowBackup=false`; README §Rilis | `flutter build apk --release` → BUILD FAILED dengan pesan guard; dengan `-PallowDebugSigning=true --dart-define=API_BASE=https://…` → `app-release.apk`; string guard ada di ketiga ABI `libapp.so` |
| 4 | TLS produksi | `nginx/tls/laundryos-ssl.conf.example` (443 + HSTS, XFF ditimpa `$remote_addr`), `include …/tls/*.conf`, redirect HTTP→HTTPS yang **tidak** merampas `/.well-known/acme-challenge/`, service `site` di port 80, image certbot + deploy hook reload nginx | `nginx -t` OK (dengan & tanpa direktori tls); redirect diuji: halaman 301, ACME tetap 200; HTTPS self-signed 200 + HSTS; DEPLOY.md §5 jadi 6 langkah salin-tempel |
| 5 | CI | `web.yml` job `e2e-laravel` (stack Laravel nyata + Playwright), `api.yml` job `images` (4 image produksi + validasi compose prod), `mobile.yml` pin Flutter 3.47.4 | YAML tervalidasi skema; setiap perintah dijalankan lokal; E2E Laravel 2 passed |
| 6 | Restore & rollback | `restore.sh` diperkuat (gzip + header dump dicek sebelum DB disentuh, `ON_ERROR_STOP` + satu transaksi, wajib `--force`, DB/user dari `ENV_FILE`); image bertag `${API_IMAGE:-…}`; `deploy-prod.sh` = backup → build bertag → up → verifikasi → rollback otomatis | Jalur tolak & jalur sukses dijalankan; DEPLOY.md §7 memuat perintah rollback (`--no-build`) |
| 7 | Deploy `apps/site` | Service `site` (image nginx + hasil build Astro), host publik di edge nginx, sitemap via `@astrojs/sitemap`, `robots.txt` dinamis dari `PUBLIC_SITE_URL`, CTA tanpa default localhost | `pnpm --filter site build` → 3 halaman + `sitemap-index.xml` + `robots.txt`; routing diuji dengan container + edge nginx (situs 200, 404 benar, dashboard terpisah) |
| 8 | Seeder demo tugas & kas | Seeder mengisi `delivery_tasks` (assigned/in_progress/done), `cash_entries` (4 pemasukan tertaut order + 3 pengeluaran), `cash_closings` (kemarin, Kemang) | Live: tugas kurir 3 status; ringkasan kas hari ini `income 89500 / expense 0 / balance 89500`, kemarin `closed=true`; entri pada tanggal terkunci → 422. Test `DemoSeederTest` |
| 9 | Device token / push | `ApiTransport.delete`, `ApiClient.registerDeviceToken`/`deleteDeviceToken`, `PushRegistrar` + `NoopPushRegistrar`, pendaftaran setelah login/bootstrap dan penghapusan sebelum sesi dibuang | `flutter test test/push_registrar_test.dart` 3/3 (POST saat login, DELETE sebelum logout, tanpa token tidak ada panggilan). Pengiriman FCM nyata BLOCKED (tanpa Firebase) |
| 10 | Kesiapan rilis store | Langkah keystore, penomoran versi, build appbundle, dan checklist Play Console (Data safety: tanpa izin lokasi, `allowBackup=false`) didokumentasikan | `docs/GO-LIVE-CHECKLIST.md` §4; build rilis terbukti gagal tanpa keystore |
| 11 | Go-live M10 | `docs/GO-LIVE-CHECKLIST.md`: prasyarat pihak ketiga, urutan deploy, 11 bukti verifikasi, operasional pasca-rilis, dan daftar hal yang memang butuh vendor | Dokumen ini; ditautkan dari README + CHECKPOINT §0 |
| 12 | Adopsi `dart format` | Dijalankan sekali di `lib/` + `test/` (42 berkas diformat), 5 `if` tanpa kurung kurawal yang jadi pelanggaran lint diperbaiki manual | `dart format --set-exit-if-changed` → 0 berkas berubah (stabil); `flutter analyze` 0 issue; `flutter test` 81/81 |
| 13 | Golden test visual mobile | 4 golden (`StatusChip`+`SectionHeader`+`StatTile`, dan layar dashboard 375×667; terang & gelap) memakai font asli | `flutter test --update-goldens` lalu `flutter test` hijau; README mencatat golden bersifat per-platform |

Gate setelah batch ketiga ada di §1; seluruh gate dijalankan ulang setelah semua perubahan.
