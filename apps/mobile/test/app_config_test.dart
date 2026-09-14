import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/config/app_config.dart";

void main() {
  group("isReleaseUrl", () {
    test("menerima https ke host nyata", () {
      expect(
          AppConfig.isReleaseUrl("https://laundryos.example/api/v1"), isTrue);
      expect(
          AppConfig.isReleaseUrl("https://api.laundryos.co.id/api/v1"), isTrue);
    });

    test("menolak http, loopback, dan emulator", () {
      expect(
          AppConfig.isReleaseUrl("http://laundryos.example/api/v1"), isFalse);
      expect(AppConfig.isReleaseUrl("http://10.0.2.2:8000/api/v1"), isFalse);
      expect(AppConfig.isReleaseUrl("https://localhost/api/v1"), isFalse);
      expect(AppConfig.isReleaseUrl("https://127.0.0.1/api/v1"), isFalse);
      expect(AppConfig.isReleaseUrl("bukan url"), isFalse);
    });
  });

  group("assertReleaseReady", () {
    test("tidak menghalangi build debug/profil", () {
      expect(() => AppConfig.assertReleaseReady(isReleaseBuild: false),
          returnsNormally);
    });

    test("menghalangi build rilis dengan API_BASE default emulator", () {
      // Default `API_BASE` adalah loopback emulator, jadi build rilis harus
      // berhenti dengan pesan yang menunjuk penyebabnya.
      expect(
        () => AppConfig.assertReleaseReady(isReleaseBuild: true),
        throwsA(isA<StateError>().having(
          (error) => error.message,
          "message",
          contains(AppConfig.apiBaseUrl),
        )),
      );
    });
  });
}
