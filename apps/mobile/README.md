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
flutter test        # 20 test (unit + widget, fake transport)
flutter build apk --debug   # terverifikasi: build/app/outputs/flutter-apk/app-debug.apk
```

## Roadmap (R4)

1. ~~Fondasi DI/OOP + auth token aman + paginasi~~ (selesai).
2. ~~Fitur per peran: dashboard, POS, operator, kurir + bukti~~ (selesai).
3. Offline-first: SQLite + antrean sinkronisasi + indikator konflik.
4. Push notification (FCM) untuk order siap & tugas pickup.
5. Rilis Play Store/App Store, signing, crash reporting (Sentry).
