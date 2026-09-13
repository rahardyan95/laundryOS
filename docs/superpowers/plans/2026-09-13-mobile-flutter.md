# Plan — apps/mobile (Flutter) [M9]

**Status:** scaffold ada di `apps/mobile` (belum diverifikasi — Flutter SDK tidak terpasang).
**Tujuan:** owner, staf, dan kurir dapat menjalankan operasional inti dari ponsel.

## 1. Fondasi

1. Pasang Flutter stable + Android SDK; `flutter create` bila perlu regenerasi platform dirs.
2. `flutter analyze` + `flutter test` hijau; CI job `mobile.yml` (`flutter pub get`, analyze, test, build apk debug).
3. Arsitektur OOP (R1): `ApiClient`, `SessionManager`, `OrderRepository` sebagai class; state via Provider/Riverpod.

## 2. Auth & sesi

- Login bearer ke `/auth/login` (non-Origin) → simpan token di `flutter_secure_storage`.
- Refresh token/rotasi (butuh penambahan backend; lihat backlog M2).
- Logout revoke token + clear storage.

## 3. Fitur per peran

| Peran | Layar |
|---|---|
| Owner | Dashboard ringkas, laporan, langganan (baca) |
| Staf/Kasir | Buat order, cari pelanggan, terima pembayaran, kas |
| Operator | Daftar order + maju status, notifikasi siap |
| Kurir | Tugas antar-jemput, navigasi peta, unggah bukti foto + lokasi |

## 4. Offline-first (wajib untuk outlet/kurir)

- SQLite (`drift`) sebagai cache read + antrean write.
- Sinkronisasi dengan idempotency key (perlu penambahan header di backend).
- Indikator online/offline, retry backoff, konflik diselesaikan server-side (last-write + audit).

## 5. Notifikasi & media

- FCM push (butuh service account + endpoint simpan device token di backend).
- Kamera (image_picker) + kompresi sebelum unggah; unggah ke S3 via presigned URL atau API.

## 6. Rilis

- Signing Android (keystore) + App Store (profil provisioning).
- Play Store internal testing → produksi; TestFlight → App Store.
- Crash reporting (Sentry Flutter), analytics minimal.
- Perizinan & kebijakan privasi (kamera, lokasi, notifikasi).

## 7. Prasyarat backend (backlog)

- Endpoint device token push, presigned upload, idempotency key, refresh token.
- Semua di luar scope MVP web dan dicatat di plan produksi utama.
