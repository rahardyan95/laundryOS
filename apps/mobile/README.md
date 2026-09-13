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
├── main.dart               # bootstrap + AppDependencies
└── src/
    ├── app.dart            # MaterialApp + AuthGate + providers
    ├── app_dependencies.dart
    ├── api/                # ApiTransport (interface), HttpApiTransport, ApiClient
    ├── config/             # AppConfig (API_BASE via dart-define)
    ├── domain/             # OrderMachine, TaskMachine, Format
    ├── models/             # Order, OrderStatus, DeliveryTask, Customer, Service, dst.
    ├── repositories/       # Auth, Order, DeliveryTask, Catalog, Notification, Dashboard
    ├── state/              # Auth/Order/DeliveryTask/Catalog/Notification/Dashboard controllers
    ├── widgets/            # LogoutButton
    └── screens/            # login, home_shell, dashboard, orders, new_order, tasks, notifications
```

Arsitektur mengikuti R1 (OOP): transport & session store di balik interface, repository
per domain, controller sebagai state, widget hanya UI. Dependency dikomposisikan di
`AppDependencies` sehingga dapat diuji dengan fake.

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
flutter test        # 22 test (unit + widget, fake transport & cache)
flutter build apk --debug   # build/app/outputs/flutter-apk/app-debug.apk
```

## Offline & observability

- **Offline baca-saja**: `CachingApiTransport` menyimpan respons GET sukses ke
  `shared_preferences`; saat `NetworkException`, respons terakhir dipakai. Banner offline
  muncul via `ConnectivityController` (connectivity_plus).
- **Sentry**: aktif bila `--dart-define=SENTRY_DSN=...` diisi (default no-op).
- **Signing**: sediakan `android/key.properties` (lihat `key.properties.example`); build
  release memakai keystore itu, fallback debug bila tidak ada.

## Belum (butuh kredensial/infra eksternal)

- **Push FCM**: butuh Firebase project + `google-services.json`/`GoogleService-Info.plist`
  dan endpoint simpan device token di backend.
- **Antrean tulis offline**: butuh idempotency key di backend agar mutasi aman di-retry.
- **Rilis toko**: butuh akun Play Console/App Store + signing produksi.

## Roadmap (R4)

1. ~~Fondasi DI/OOP + auth token aman + paginasi~~ (selesai).
2. ~~Fitur per peran: dashboard, POS, operator, kurir + bukti~~ (selesai).
3. ~~Offline baca + banner + Sentry + signing scaffold~~ (selesai); antrean tulis menyusul.
4. Push notification (FCM) untuk order siap & tugas pickup.
5. Rilis Play Store/App Store.
