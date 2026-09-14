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
flutter test        # 62 test: unit domain, controller, widget, kontras tema, tata letak 375x667
flutter build apk --debug   # build/app/outputs/flutter-apk/app-debug.apk
```

Uji yang menjaga sistem visual: `test/theme_test.dart` (rasio kontras ≥ 4.5:1 di kedua mode,
tipografi, sasaran sentuh 48dp, warna `StatusChip`) dan `test/small_screen_layout_test.dart`
(layar utama tidak meluber pada 375x667, terang dan gelap).

## Offline & observability

- **Offline baca**: `CachingApiTransport` menyimpan respons GET sukses ke `shared_preferences`;
  saat `NetworkException`, respons terakhir dipakai.
- **Offline tulis**: `OfflineApiTransport` menyimpan mutasi gagal ke `MutationQueue`
  (dengan `Idempotency-Key`) dan mengirim ulang saat online (`SyncController.flush`).
  Server memakai key itu agar tidak dobel.
- **Banner**: status offline / jumlah perubahan menunggu / sedang menyinkronkan.
- **Sentry**: aktif bila `--dart-define=SENTRY_DSN=...` diisi (default no-op).
- **Signing**: sediakan `android/key.properties` (lihat `key.properties.example`); build
  release memakai keystore itu, fallback debug bila tidak ada.

## Belum (butuh kredensial/infra eksternal)

- **Push FCM**: backend punya endpoint `/auth/device-token` + `PushNotifier`; sisi mobile
  masih perlu paket `firebase_messaging` + `google-services.json`/`GoogleService-Info.plist`
  dari Firebase project, lalu panggil endpoint saat token tersedia.
- **Rilis toko**: butuh akun Play Console/App Store + signing produksi.

## Roadmap (R4)

1. ~~Fondasi DI/OOP + auth token aman + paginasi~~ (selesai).
2. ~~Fitur per peran: dashboard, POS, operator, kurir + bukti~~ (selesai).
3. ~~Offline baca+tulis, Sentry, signing scaffold~~ (selesai).
4. Push notification (FCM) — backend siap, sisi mobile menunggu Firebase project.
5. Rilis Play Store/App Store.
