# LaundryOS Mobile (Flutter)

Aplikasi mobile untuk **owner, staf, dan kurir**. Status fase: **analyze + test hijau**
(Flutter stable 3.47.4 / Dart 3.13.3). Build APK/IPA dan rilis toko belum dilakukan
(butuh Android SDK/Xcode + akun store).

## Prasyarat

- Flutter SDK stable (≥ 3.5) + Android SDK / Xcode.
- Backend API jalan (lihat `infra/`).

## Menjalankan

```bash
cd apps/mobile
flutter pub get
# Android emulator: 10.0.2.2 = localhost host
flutter run --dart-define=API_BASE=http://10.0.2.2:8000/api/v1
```

Login memakai token bearer (bukan cookie) — endpoint `/auth/login` mengembalikan `token`
saat request tanpa `Origin` (lihat `apps/api/API.md`).

## Struktur

```
lib/
├── main.dart               # bootstrap + Format.initialize + AppDependencies
└── src/
    ├── app.dart            # MaterialApp (AppTheme light/dark) + AuthGate + providers
    ├── app_dependencies.dart
    ├── api/                # ApiTransport (interface), HttpApiTransport, ApiClient
    ├── config/             # AppConfig (API_BASE via dart-define)
    ├── domain/             # Dart murni: OrderMachine, TaskMachine, StatusKind, Format
    ├── models/             # Order, OrderStatus, DeliveryTask, Customer, Service, dst.
    ├── push/               # PushRegistrar (token perangkat) + NoopPushRegistrar
    ├── repositories/       # Auth, Order, DeliveryTask, Catalog, Notification, Dashboard
    ├── state/              # Auth/Order/DeliveryTask/Catalog/Notification/Dashboard controllers
    ├── theme/              # AppPalette, AppSpacing/AppRadii/AppMotion, AppTypography, AppStatusTones, AppTheme
    ├── widgets/            # AppScaffold, AsyncSection, EmptyState, ErrorNotice, StatusChip, SurfaceCard,
    │                       # StatTile, SectionHeader, ConnectivityBanner, BrandMark, LogoutButton
    └── screens/            # login, home_shell, dashboard, orders, new_order, tasks, notifications
```

Arsitektur mengikuti R1 (OOP): transport & session store di balik interface, repository
per domain, controller sebagai state, widget hanya UI. Dependency dikomposisikan di
`AppDependencies` sehingga dapat diuji dengan fake.

Sistem visual (palet, tipografi, jarak, warna status) tinggal di `lib/src/theme/` dan
diuraikan di `AGENTS.md` R3. Layar tidak menulis warna atau jarak sendiri.

Font: Plus Jakarta Sans (variable, `assets/fonts/PlusJakartaSans-Variable.ttf`, lisensi OFL 1.1)
dipakai bersama web; berat huruf dipilih lewat `fontWeight`.

## Fitur per peran (bottom nav)

| Peran | Tab |
|---|---|
| Pemilik / Manajer | Dashboard, Order, Notifikasi |
| Kasir | Order (+ tombol Order Baru), Notifikasi |
| Operator | Order (maju status), Notifikasi |
| Kurir | Tugas antar-jemput (+ unggah bukti), Notifikasi |

## Verifikasi

```bash
flutter analyze     # 0 issue
flutter test        # 79 test: unit domain, controller, widget, kontras tema, tata letak 375x667, identity offline, push, golden
flutter build apk --debug   # build/app/outputs/flutter-apk/app-debug.apk
```

Uji yang menjaga sistem visual: `test/theme_test.dart` (rasio kontras ≥ 4.5:1 di kedua mode,
tipografi, sasaran sentuh 48dp, warna `StatusChip`) dan `test/small_screen_layout_test.dart`
(layar utama tidak meluber pada 375x667, terang dan gelap).

### Golden

`test/golden_test.dart` menyimpan 4 snapshot di `test/goldens/`: komposisi `StatusChip` +
`StatTile`, dan layar dashboard 375x667 pada mode terang dan gelap. Snapshot **bergantung pada
renderer dan platform** (versi Flutter/Skia, DPI, font), jadi gambar berbeda antar mesin dan
versi. Setelah perubahan visual yang disengaja, regenerasi di lingkungan yang sama:

```bash
flutter test --update-goldens test/golden_test.dart
```

Sengaja hanya sedikit dan hanya widget deterministik: tanpa animasi, tanpa riak tinta, tanpa
waktu relatif.

## Rilis

```bash
cd apps/mobile
flutter build appbundle --release \
  --dart-define=API_BASE=https://<domain>/api/v1 \
  [--dart-define=SENTRY_DSN=…]
```

Prasyarat dan pagar rilis:

- **Keystore**: sediakan `android/key.properties` (lihat `android/key.properties.example`) berisi
  `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. Build Release tanpa berkas ini
  **gagal** di Gradle — bukan diam-diam memakai kunci debug.
- **Escape hatch CI/emulator**: `flutter build apk --release -PallowDebugSigning=true` melewati
  pagar keystore dan memakai kunci debug. Hanya untuk CI/emulator; jangan dipakai untuk artifact
  yang naik ke toko.
- **API_BASE**: `AppConfig.assertReleaseReady()` dipanggil paling awal di `main()`. Build rilis
  dan profil wajib memakai `https://` ke host non-loopback; `http://`, `10.0.2.2`, `localhost`,
  `127.0.0.1`, dan `::1` membuat aplikasi gagal start dengan pesan yang menyebut penyebabnya.
  Default `API_BASE` tetap loopback emulator supaya `flutter run` debug tidak perlu dart-define.
- **Manifest**: `android:allowBackup="false"` — token sesi ada di EncryptedSharedPreferences dan
  cache offline memuat data pelanggan, jadi keduanya tidak boleh ikut auto-backup. Izin lokasi
  tidak diminta karena tidak ada kode lokasi.

## Offline & observability

- **Offline baca**: `CachingApiTransport` menyimpan respons GET sukses ke `shared_preferences`;
  saat `NetworkException`, respons terakhir dipakai. Kunci cache memuat **identitas pengguna**
  (`SessionStore.userId`), jadi data satu pengguna tidak pernah tampil untuk pengguna lain di
  perangkat yang sama. Saat belum masuk, tidak ada yang ditulis maupun dibaca dari cache.
- **Offline tulis**: `OfflineApiTransport` menyimpan mutasi gagal ke `MutationQueue`
  (dengan `Idempotency-Key` + id pengguna) dan mengirim ulang saat online (`SyncController.flush`
  / `SyncController.start`). Mutasi hanya dikirim ulang dengan token identitas yang membuatnya;
  mutasi identitas lain dibuang, dan saat belum masuk flush tidak berjalan. Server memakai key itu
  agar tidak dobel.
- **Keluar**: `AuthController.logout()` menghapus token perangkat (best-effort) lalu mengosongkan
  sesi, cache offline, dan antrean mutasi, supaya shift berikutnya mulai bersih.
- **Banner**: status offline / jumlah perubahan menunggu / sedang menyinkronkan.
- **Sentry**: aktif bila `--dart-define=SENTRY_DSN=...` diisi (default no-op).
- **Signing**: `android/key.properties` (lihat `key.properties.example`) — pagar rilis di atas
  memastikan tidak ada artifact release yang diam-diam memakai kunci debug.

## Push notification (FCM)

Backend sudah punya `POST/DELETE /auth/device-token` (`DeviceTokenController`) dan `PushNotifier`.
Sisi mobile sudah menyiapkan seluruh jalurnya tanpa paket Firebase:

- `PushRegistrar` (`lib/src/push/push_registrar.dart`) sebagai sumber token perangkat;
  `NoopPushRegistrar` adalah default yang selalu mengembalikan null.
- `AuthController` mendaftarkan token setelah `login()` berhasil dan setelah `bootstrap()`
  memulihkan sesi, serta menghapusnya sebelum sesi dibuang saat `logout()`.

Menyalakan FCM (butuh project Firebase + akun Play):

1. Tambahkan `firebase_core` dan `firebase_messaging` ke `pubspec.yaml`.
2. Taruh `google-services.json` dari Firebase project di `android/app/`, dan daftarkan plugin
   `com.google.gms.google-services` di Gradle.
3. Buat implementasi `PushRegistrar` yang memakai `FirebaseMessaging.instance.getToken()`
   (mis. `lib/src/push/firebase_push_registrar.dart`).
4. Rangkit di `AppDependencies`: ganti `NoopPushRegistrar()` dengan implementasi itu.

## Belum (butuh kredensial/infra eksternal)

- **Push FCM**: kode jalur token sudah siap (lihat bagian di atas); tinggal paket
  `firebase_messaging` + `google-services.json`/`GoogleService-Info.plist` dari Firebase project.
- **Rilis toko**: butuh akun Play Console/App Store + keystore produksi.

## Roadmap (R4)

1. ~~Fondasi DI/OOP + auth token aman + paginasi~~ (selesai).
2. ~~Fitur per peran: dashboard, POS, operator, kurir + bukti~~ (selesai).
3. ~~Offline baca+tulis (per identitas), Sentry, pagar rilis + signing~~ (selesai).
4. Push notification (FCM) — jalur token siap; menunggu paket + `google-services.json`.
5. Rilis Play Store/App Store.
