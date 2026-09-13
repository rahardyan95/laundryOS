# LaundryOS Mobile (Flutter)

Aplikasi mobile untuk **owner, staf, dan kurir**. Status fase: **scaffold** — kode di sini
belum dijalankan/diverifikasi karena Flutter SDK belum terpasang di lingkungan build.
Jalankan `flutter analyze` + `flutter test` sebelum dianggap siap.

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
├── main.dart
└── src/
    ├── api/          ApiClient (OOP singleton), SessionManager (secure storage)
    ├── config/       AppConfig (API_BASE via dart-define)
    ├── models/       Order, SessionPayload
    └── screens/      login_screen, home_screen
```

## Roadmap (R4)

1. Offline-first: SQLite + antrean sinkronisasi + indikator konflik.
2. Peran: dashboard owner, kasir POS, operator status, kurir tugas + foto GPS.
3. Push notification (FCM) untuk order siap & tugas pickup.
4. Kamera/lokasi izin, unggah bukti ke S3.
5. Rilis Play Store/App Store, signing, crash reporting (Sentry), CI `flutter build`.
