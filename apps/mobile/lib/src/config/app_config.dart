import "package:flutter/foundation.dart";

/// Konfigurasi build. Satu sumber untuk `API_BASE` supaya tidak ada URL kedua
/// yang bisa menyimpang dari yang dipakai transport.
class AppConfig {
  const AppConfig._();

  /// Default sengaja menunjuk loopback emulator: build debug yang paling
  /// sering dipakai adalah `flutter run` ke emulator tanpa dart-define.
  static const String apiBaseUrl = String.fromEnvironment(
    "API_BASE",
    defaultValue: "http://10.0.2.2:8000/api/v1",
  );

  /// Host yang hanya bermakna di mesin dev: emulator Android dan loopback.
  /// Berangkat ke salah satunya di build rilis berarti aplikasi tidak akan
  /// pernah bisa menghubungi server.
  static const Set<String> loopbackHosts = {
    "10.0.2.2",
    "localhost",
    "127.0.0.1",
    "::1",
  };

  /// True bila [url] layak untuk build rilis: skema `https` ke host
  /// non-loopback. Dipisah dari [assertReleaseReady] agar bisa diuji tanpa
  /// benar-benar berada di mode rilis.
  static bool isReleaseUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || uri.scheme != "https") return false;
    final host = uri.host.toLowerCase();
    return host.isNotEmpty && !loopbackHosts.contains(host);
  }

  /// Pagar rilis: dipanggil dari `main()` sebelum inisialisasi lain. Build
  /// rilis/profil dengan `API_BASE` yang bukan `https` ke host nyata berhenti
  /// di sini, bukan diam-diam mengarah ke emulator. [isReleaseBuild] hanya
  /// dipakai test supaya logika pagar dapat diuji tanpa mode rilis.
  static void assertReleaseReady({bool? isReleaseBuild}) {
    final release = isReleaseBuild ?? (kReleaseMode || kProfileMode);
    if (!release) return;
    if (isReleaseUrl(apiBaseUrl)) return;
    throw StateError(
      "API_BASE tidak siap rilis: \"$apiBaseUrl\". Build rilis/profil wajib "
      "memakai https ke host non-loopback, mis. "
      "--dart-define=API_BASE=https://laundryos.example/api/v1.",
    );
  }
}
