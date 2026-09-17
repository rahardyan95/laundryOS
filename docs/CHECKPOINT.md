# CHECKPOINT — LaundryOS

**Terakhir diverifikasi:** 2026-09-14 · **Status: semua gate hijau, seluruh pekerjaan go-live yang bisa
dikerjakan di repo sudah selesai** (sisa hanya prasyarat pihak ketiga, lihat §7).

Dokumen pendamping:

| Dokumen | Untuk apa |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | aturan kode (R1 OOP, R2 bukti verifikasi, R3 sistem UI mobile) — wajib dibaca sebelum menulis kode |
| [`docs/CARA-MENJALANKAN.md`](CARA-MENJALANKAN.md) | setup + workflow harian + troubleshooting panjang |
| [`docs/GO-LIVE-CHECKLIST.md`](GO-LIVE-CHECKLIST.md) | rilis ke pelanggan: prasyarat pihak ketiga, urutan deploy, bukti verifikasi, rilis mobile |
| [`infra/DEPLOY.md`](../infra/DEPLOY.md) | runbook VPS salin-tempel (TLS, backup/restore, rollback) |
| [`apps/mobile/README.md`](../apps/mobile/README.md) | rilis Android (keystore, appbundle, guard `API_BASE`), push FCM, golden |
| [`apps/web/DESIGN.md`](../apps/web/DESIGN.md) | identitas visual web (sumber palet "Pine & Lime") |

---

## 0. Status per area

| Area | Status | Catatan |
|---|---|---|
| `apps/api` | ✅ | Laravel 13 modular monolith; 6 domain (Identity, Ordering, Operations, Catalog, Billing, Support); 141 test |
| `apps/web` | ✅ | Next 16, dua mode (`mock` dan `laravel`) dengan paritas mapper; 51 unit + 19 E2E mock + 2 E2E API nyata |
| `apps/mobile` | ✅ | Flutter 3.47.4; peran owner/manajer, kasir, operator, kurir; offline baca+tulis; 81 test + 4 golden |
| `apps/site` | ✅ | Astro statis + sitemap + robots; ikut ter-deploy di compose prod (`site`) |
| `infra` | ✅ | Dev 6/6 container; prod: TLS siap-aktif, backup/restore aman, image bertag, `deploy-prod.sh` |
| CI | ✅ | Gate gaya/tipe/test + E2E API nyata + build image produksi + validasi compose prod |
| Push FCM, rilis Play, VPS | ⏳ pihak ketiga | Wiring sudah ada; butuh akun/berkas eksternal (lihat §7) |

Riwayat commit terakhir (setiap pesan commit memuat bukti per item):

```
652827d docs: checklist go-live dan status tiga batch perbaikan
75d6eac feat(api): tegakkan langganan pada baca, jalur operator untuk paket, dan seeder demo kas/tugas
eb83f97 ci: tangkap regresi integrasi (E2E API nyata, image produksi) dan pin Flutter
5c9ae18 feat(infra): TLS siap pakai, restore/rollback aman, dan deploy situs pemasaran
b525e2d chore(mobile): adopsi dart format di lib/ dan test/
7a355ff feat(mobile): guard rilis, cache/antrean offline ber-identitas, wiring device token, golden test
2539a65 feat(api): provisi tenant, isolasi foto bukti, dan pelacakan publik yang aman
45f7f45 feat(mobile): tema Pine & Lime + widget bersama; fix: keamanan, bootstrap, dan unggah bukti
```

---

## 1. Mulai cepat

```bash
cd infra && docker compose up -d                                   # pgsql, redis, mailpit, api(:8000), worker, scheduler
docker compose run --rm -T api composer install --no-interaction    # vendor/ (hanya klon bersih)
docker compose run --rm -T api php artisan migrate:fresh --seed     # skema + data demo (kas & tugas ikut terisi)
cd .. && pnpm install

# web: mode API nyata (integrasi penuh)
NEXT_PUBLIC_API_MODE=laravel NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 pnpm --filter web dev --port 3000

# mobile di emulator Android
cd apps/mobile && flutter pub get
flutter run -d emulator-5554 --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

- `apps/api/.env` + `APP_KEY` dibuat otomatis oleh `infra/api-entrypoint.sh` — tidak ada langkah manual.
- Akun demo (password `password`): `owner@` · `manager@` · `kasir@` · `operator@` · `kurir@laundryos.test`.
- Mailpit `:8025` · lacak pelanggan tanpa login: `http://localhost:3000/lacak` · web default mode `mock` (tanpa backend).
- Reset data demo kapan saja: `docker compose run --rm -T api php artisan migrate:fresh --seed`.
- Perintah operator (tidak dipakai di dev sehari-hari): `php artisan tenant:provision …` (buat tenant+outlet+owner)
  dan `php artisan tenant:plan {id|email} {plan}` (ubah paket).

---

## 2. Gate verifikasi (definition of done)

Dijalankan dari root kecuali disebut lain; jalankan **semua** sebelum menyatakan selesai (AGENTS.md R2).

| Gate | Perintah | Hasil terakhir |
|---|---|---|
| Backend test | `cd infra && docker compose run --rm -T api php artisan test` | **145 passed, 508 assertions** (2026-09-17, komit 64c6aef) |
| Backend gaya | `… php vendor/bin/pint --test` | PASS, 171 file |
| Backend analisis | `… composer analyse` (Larastan L5) | 0 error |
| Coverage | `… composer test:coverage` | 92,3% (gate 90) |
| Web tipe/lint | `pnpm --filter web exec tsc --noEmit` · `pnpm --filter web exec eslint src` | 0 · 0 |
| Web unit | `pnpm --filter web exec vitest run` | 62 passed (2026-09-17, komit 64c6aef) |
| Web build | `pnpm --filter web build` | exit 0 |
| Web E2E mock | `pnpm --filter web test:e2e` | 19 passed |
| Web E2E API nyata | `pnpm --filter web test:e2e:laravel` | 2 passed |
| Mobile analisis | `cd apps/mobile && flutter analyze` | 0 issue |
| Mobile test | `flutter test` | 81 passed (4 berkas golden) |
| Mobile build | `flutter build apk --debug` | exit 0 |
| Site | `pnpm --filter site build` | 3 halaman + sitemap |
| Infra prod | `cd infra && cp .env.prod.example .env.prod && docker compose -f docker-compose.prod.yml config --quiet` | valid |
| Nginx | `docker run --rm --add-host api:127.0.0.1 --add-host web:127.0.0.1 --add-host site:127.0.0.1 -v "$PWD/infra/nginx/laundryos.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.27-alpine nginx -t` | successful |

Menjalankan sebagian saja (hemat waktu saat iterasi):

```bash
docker compose run --rm -T api php artisan test --filter=SubscriptionTest          # satu kelas
docker compose run --rm -T api php artisan test --filter=nama_test_satu_metode
pnpm --filter web exec vitest run -t "nama test" ; pnpm --filter web exec playwright test -g "judul"
cd apps/mobile && flutter test test/offline_identity_test.dart
cd apps/mobile && flutter test --update-goldens test/golden_test.dart              # regenerasi golden
```

Catatan: perintah analisis/coverage yang benar adalah `composer analyse` dan `composer test:coverage`
(bukan `php composer …`). Klon bersih tidak butuh `.env` manual: entrypoint menyalin `.env.example`
dan membuat `APP_KEY` (dan melewati pembuatan kunci bila `vendor/` belum ada — jalankan `composer install` dulu).

---

## 3. Peta kode & "mau mengubah X, sentuh di mana"

| Path | Isi |
|---|---|
| `apps/api/app/Domains/<Domain>/` | `Models`, `Http/{Controllers,Requests,Resources}`, `Actions`, `Enums`, `Policies` |
| `apps/api/routes/api.php` | seluruh permukaan API v1 (throttle, group auth, route publik) |
| `apps/web/src/{app,components,lib}` | App Router, komponen, logika (`lib/api/mock` + `lib/api/laravel` + mappers) |
| `apps/mobile/lib/src/{theme,widgets,screens,state,domain,api,repositories}` | arah ketergantungan satu arah: `screens/widgets → state → repositories → api` |
| `apps/site/src` | halaman Astro + config situs (sitemap/robots/URL publik) |
| `infra/` | compose dev & prod, nginx (+`nginx/tls`), certbot, `backup-prod.sh`, `restore.sh`, `deploy-prod.sh`, `DEPLOY.md` |
| `.github/workflows/` | `api.yml`, `web.yml`, `mobile.yml` |

Indeks tugas yang paling sering muncul:

| Mau apa | Sentuh apa |
|---|---|
| Tambah/ubah endpoint API | `Domains/<Domain>/Http/Controllers` + `routes/api.php` + `Requests`/`Resources` + `Policies`, lalu test di `tests/Feature/<Domain>` |
| Ubah status order / tugas | `Ordering/Enums/OrderStatus`, `Ordering/Actions/TransitionOrderStatus`, mobile `domain/order_machine.dart` + `domain/status_kind.dart` (jaga paritas enum API ↔ mobile) |
| Tambah layar mobile | `screens/` (bungkus `AppScaffold` + `AsyncSection`), widget bersama di `widgets/`, warna/jarak dari `theme/`; tambah test widget |
| Ubah tampilan web | `src/app/**` + `src/components/**`; kalau menyentuh data: perbarui **mock dan laravel** (`lib/api/mock`, `lib/api/laravel/mappers.ts`) supaya paritas tetap |
| Ubah skema database | migration baru di `database/migrations` (jangan edit migrasi lama), sesuaikan `Models` + `Factories` + `Seeders` + test |
| Ubah warna/typography mobile | `lib/src/theme/` saja; kontras dijaga `test/theme_test.dart`, bentuk/jarak `test/small_screen_layout_test.dart` + golden |
| Foto bukti antar-jemput | `Operations/Http/Controllers/DeliveryTaskController` (`proof`, `showProof`), `DeliveryTaskResource` (URL bertanda tangan), `config/filesystems.php` (`proof_disk`) |
| Aturan langganan/limit | `Identity/Http/Middleware/EnsureSubscriptionActive`, `Billing/Actions/PlanLimits`, `config/plans.php`, command `tenant:plan` |
| Pelacakan publik `/track` | `Ordering/Http/Controllers/TrackController` + `Ordering/Support/TicketNumberGenerator` |
| Deploy / ops | `infra/DEPLOY.md` (runbook), `deploy-prod.sh`, `backup-prod.sh`, `restore.sh` |
| CI | `.github/workflows/*.yml` (job `images` juga memvalidasi compose prod) |

Invarian yang mudah dilanggar (pernah menjadi bug):

1. **Tenant scope fail-closed** — `TenantScope` menutup query saat tidak ada konteks; jangan lepas kecuali
   untuk endpoint publik yang diautentikasi faktor lain (mis. `/track`, penyaji bukti bertanda tangan).
2. **Paritas mock ↔ Laravel** — perubahan bentuk data harus diterapkan di dua tempat + `mappers.ts`.
3. **Identitas pada data offline mobile** — cache & antrean terikat `userId`; jangan menulis cache saat belum masuk.
4. **URL berkas tidak boleh publik** — bukti foto disajikan lewat URL bertanda tangan kedaluwarsa 30 menit,
   disk default `local` (privat).
5. **`X-Forwarded-For` hanya boleh dipercaya dari proxy sendiri** — `TRUSTED_PROXIES` diisi subnet proxy
   (prod `172.28.0.0/16`), nginx menimpa header; kalau tidak, rate limit bisa dipalsukan.
6. **Nilai `NEXT_PUBLIC_*` / `PUBLIC_*` dikompilasi saat build**, bukan runtime: mengubahnya butuh deploy ulang.

---

## 4. Konfigurasi & environment

| Variabel | Efek | Dev | Prod |
|---|---|---|---|
| `APP_KEY` | kunci enkripsi cookie/sesi; tanpa ini login 500 | dibuat otomatis entrypoint | wajib diisi `base64:…` (prod-entrypoint gagal cepat) |
| `TRUSTED_PROXIES` | siapa yang boleh menentukan IP klien | kosong (tanpa proxy) | `172.28.0.0/16` (subnet nginx) |
| `FRONTEND_URL` vs `CORS_ALLOWED_ORIGINS` | tautan reset (satu origin) vs daftar origin CORS (boleh banyak) | compose dev: `:3000` + `:3100` | host aplikasi |
| `SANCTUM_STATEFUL_DOMAINS` | domain yang memakai sesi cookie SPA | compose dev | host aplikasi |
| `SESSION_SECURE_COOKIE` | cookie hanya lewat HTTPS | tidak diset | `true` — **login web gagal sampai TLS aktif** |
| `FILESYSTEM_PROOF_DISK` | lokasi foto bukti | default `local` (privat) | `s3` (bucket privat) |
| `PUBLIC_SITE_URL` / `PUBLIC_APP_URL` / `PUBLIC_API_URL` | di-*bake* ke HTML saat build image web/site | — | wajib (`:?` di compose prod) |
| `NEXT_PUBLIC_API_MODE` / `NEXT_PUBLIC_API_URL` | web memakai mock atau API nyata | `.env.local` | build arg |
| `API_BASE` (dart-define) | alamat API di APK; rilis **wajib** `https://…` non-loopback | `http://10.0.2.2:8000/api/v1` | `https://app.<domain>/api/v1` |

---

## 5. Sistem UI mobile (ringkas; rinci di `AGENTS.md` R3)

- Dial **ENERGY 1 / RHYTHM 2 / MOTION 1**; identitas "Pine & Lime" sama dengan web.
- Warna/jarak/radius/durasi hanya dari `src/theme/`; warna status lewat `StatusKind` (domain) → `StatusTones` (tema).
- Keadaan data wajib lewat `AsyncSection`; keadaan kosong menyebut sebab + langkah berikutnya.
- Kontras teks ≥ 4.5:1 dijaga `test/theme_test.dart`; tata letak 375×667 + mode gelap dijaga
  `test/small_screen_layout_test.dart` dan 4 golden di `test/goldens/`.
- Golden bersifat per-platform/renderer: regenerasi dengan `flutter test --update-goldens test/golden_test.dart`.
- `dart format` sudah diadopsi (gaya Dart 3.7): jalankan `dart format lib test` **menyeluruh**, jangan per berkas.

---

## 6. Jebakan yang sudah diketahui

| Gejala | Sebab | Solusi |
|---|---|---|
| `flutter build apk` gagal menulis `hooks_runner\...\stdout.txt` | cache native-assets basi setelah proses flutter dibunuh | `rm -rf apps/mobile/.dart_tool/hooks_runner` lalu build ulang |
| `flutter test` error `test`/`expect` isn't defined (ratusan issue) | `.dart_tool` basi setelah ganti SDK | `flutter pub get` lalu ulangi |
| Web di port lain gagal login (CORS di console) | origin tidak ada di `CORS_ALLOWED_ORIGINS` | tambahkan origin di `apps/api/.env`; `.env` dibaca per request (tanpa restart) |
| Tautan reset kata sandi rusak | `FRONTEND_URL` diisi daftar koma | satu origin di `FRONTEND_URL`; daftar hanya di `CORS_ALLOWED_ORIGINS` |
| `docker compose run` me-recreate pgsql/redis | perilaku compose untuk service dependen | data aman di volume `pgdata`; pakai `docker compose exec` untuk query |
| Daftar di aplikasi kosong tanpa pesan | exception ditelan `catch (_)` | cek bentuk JSON vs model; jangan lewatkan `dynamic` ke `whereType(...).map(...).toList()` |
| `flutter run` ditutup, aplikasi ikut mati | `flutter run` mematikan aplikasi saat keluar | `adb shell am start -n com.laundryos.laundryos_mobile/.MainActivity` (API_BASE sudah ter-*bake*) |
| `phpstan` gagal `ignore.unmatched` | entri baseline menutupi cacat yang sudah diperbaiki | hapus entri itu dari `apps/api/phpstan-baseline.neon`; baseline bukan tempat menutup temuan nyata |
| Skrip `.sh` gagal `bash: /bin/bash: No such file` | `bash` di PATH mesin ini menunjuk WSL yang tidak lengkap | jalankan dengan `sh <skrip>`; `sh -n` untuk cek sintaks |
| `[ -f /tmp/... ]` bernilai salah walau berkas ada | `/tmp` Git Bash tidak konsisten untuk builtin shell | pakai path relatif di dalam repo untuk berkas sementara |
| Backup "sukses" tapi arsip 0 byte | pipeline `pg_dump` → `gzip` menyembunyikan status `pg_dump` | sudah diperbaiki di `infra/backup-prod.sh`; jangan kembali ke bentuk pipeline |
| `nginx -t` gagal `host not found in upstream "site"` | config prod menyebut upstream yang tidak ada di luar compose | tambahkan `--add-host api:127.0.0.1 --add-host web:127.0.0.1 --add-host site:127.0.0.1` |
| Login web produksi "tidak terjadi apa-apa" | `SESSION_SECURE_COOKIE=true` tapi belum ada HTTPS | selesaikan TLS dulu (`DEPLOY.md` §5) |
| `pnpm install --frozen-lockfile` gagal setelah menambah dependency | `pnpm-lock.yaml` root belum diperbarui | jalankan `pnpm install` di root, commit lockfile-nya |
| Worker produksi tidak memakai image baru | `worker`/`scheduler` memakai `${API_IMAGE:-…}` | deploy lewat `deploy-prod.sh` supaya semua service ikut tag yang sama |
| `exec /entrypoint.sh: no such file or directory`, api/worker/scheduler `Exited (255)` di klon Windows | skrip `infra/*.sh` ber-line-ending CRLF (`core.autocrlf=true`) | konversi ke LF + kunci via `.gitattributes` (`*.sh text eol=lf`); diverifikasi live 2026-09-17 |

---

## 7. Pekerjaan berikutnya

Yang bisa dikerjakan di dalam repo sudah selesai; sisanya butuh pihak ketiga/akun berbayar:

| # | Pekerjaan | Blokirnya | Mulai dari |
|---|---|---|---|
| 1 | Push FCM benar-benar terkirim | butuh proyek Firebase + `google-services.json` | `docs/GO-LIVE-CHECKLIST.md` §4 langkah 5 |
| 2 | AAB bertanda tangan + listing Play Store | butuh keystore produksi + akun Google Play | `docs/GO-LIVE-CHECKLIST.md` §4 langkah 1–4 |
| 3 | Deploy ke VPS/domain | butuh VPS + DNS + SMTP + bucket S3 | `docs/GO-LIVE-CHECKLIST.md` §1–§3 |
| 4 | Drill restore bulanan & alert eksternal | operasional berjalan | `docs/GO-LIVE-CHECKLIST.md` §5 |

Backlog fitur (pasca-MVP, butuh vendor): payment gateway, WhatsApp Business, printer thermal ESC/POS,
rotasi refresh token, enkripsi PII at-rest, WAF/pen-test eksternal.

---

## 8. Riwayat

### Milestone

- **M0** housekeeping produksi · **M1** koreksi & paritas · **M2** auth cookie Sanctum SPA + refactor OOP logika ·
  **M3** backend prod (php-fpm+opcache, deep health, TrustProxies) · **M4** frontend prod (standalone, CSP,
  robots/sitemap) · **M5** security (Dependabot, gitleaks/Trivy, `SECURITY.md`) · **M6** artifact deploy VPS
  (compose prod, nginx, certbot, backup + offsite, `DEPLOY.md`) · **M7** QA (unit logika, E2E security/404,
  E2E Laravel, k6, coverage gate) · **M8** `apps/site` Astro · **M9** `apps/mobile` (platform + DI, fitur per peran,
  offline, Sentry, signing, device token).
- Scope aplikasi: **R0** fondasi (auth, tenant/outlet, RBAC 5 peran) · **R1** inti (customer, katalog, order +
  state machine + tiket + snapshot harga, receipt, audit log, dashboard) · **R2** operasi (pickup/delivery + bukti
  foto, kas + tutup kas, notifikasi + reminder, laporan + CSV) · **R3** SaaS (paket + limit + gate `past_due`,
  invite staf) · **R4** web/mobile/site.

### Perbaikan go-live 2026-09-14 (tiga batch)

| Batch | Isi ringkas | Commit | Bukti inti |
|---|---|---|---|
| 1 | rate limit tidak bisa dipalsukan (`TRUSTED_PROXIES` + nginx), hash password tidak lagi terserialisasi, backup produksi memverifikasi isi, `APP_KEY` dibuat otomatis untuk klon bersih, unggah bukti mobile mengirim `filename` | `45f7f45` | 14 login XFF berotasi: 14×422 → 10×422 lalu 429; `/api/user` tanpa `password`; backup DB salah → exit 1 tanpa berkas baru; `.env` dihapus → login 200; transport nyata → unggah 200 |
| 2 | provisi tenant pertama (`tenant:provision`), foto bukti ter-scope tenant + URL bertanda tangan, `/track` aman dari tabrakan tiket lintas tenant | `2539a65` | owner hasil provisi bisa login; GET URL bertanda tangan 200 tanpa auth, tanpa/palsu tanda tangan 403; tiket sama di 2 tenant tidak tertukar, ambigu → 404 |
| 3 | baca ditutup untuk tenant non-aktif + paket hanya via operator (`tenant:plan`), lifecycle cache/antrean offline ber-identitas, guard rilis mobile, TLS siap-aktif, CI E2E nyata + image prod, `restore.sh`/rollback, deploy `apps/site`, seeder kas+tugas, wiring device token, dokumen rilis store, `dart format`, golden test | `7a355ff` `b525e2d` `5c9ae18` `eb83f97` `75d6eac` `652827d` | rincian per item ada di pesan commit masing-masing dan di `docs/GO-LIVE-CHECKLIST.md` |

### Arsip verifikasi

| Tanggal | Catatan | Hasil inti |
|---|---|---|
| 2026-09-17 | OOP enforcement + Docker live + refaktor penuh web/mobile | backend 145/508 · pint 172 · tsc 0 · eslint 0 · vitest 62/62 · next build exit 0 · E2E mock 20 (1 skip) + laravel 2 · mobile analyze 0 + test 81 · 7/7 container Up · login owner + Order Baru diverifikasi browser |
| 2026-09-14 | Audit go-live + tiga batch perbaikan | 141 test backend · pint 171 file · phpstan 0 · coverage 92,3% · web 51 unit + 19/2 E2E · mobile 0 issue + 81 test · apk debug |
| 2026-09-14 | Integrasi web↔mobile + UI mobile baru | login cookie httpOnly, `/orders` dari PostgreSQL, kurir melihat tugas nyata; cacat CORS, `_TypeError` typed collection, dan locale `id_ID` ditemukan lewat menjalankan aplikasi (bukan test) |
| 2026-09-13 | Plan produksi M0–M9 | backend 121 test · web 51 unit + 18 E2E mock + 2 E2E Laravel · Flutter 25 test · coverage 92,2% |
| 2026-09-04 | Baseline sebelum plan produksi | backend 109 test · web 41 unit · `next build` exit 0 · 6 E2E · 6/6 container |

Housekeeping: `.env`, `node_modules`, `vendor`, `skill/`, `infra/backups/` gitignored.
