/// Sumber token perangkat (FCM/APNs).
///
/// Antarmuka ini ada supaya pendaftaran token bisa dirangkai di
/// `AppDependencies` tanpa memaksa paket `firebase_messaging` hadir di build
/// (lihat README: implementasi Firebase menyusul saat `google-services.json`
/// tersedia). [currentToken] mengembalikan null bila token belum tersedia.
abstract class PushRegistrar {
  Future<String?> currentToken();
}

/// Implementasi default: tidak ada push. Selalu null, tidak menyentuh
/// jaringan, sehingga build dan test tidak butuh Firebase.
class NoopPushRegistrar implements PushRegistrar {
  const NoopPushRegistrar();

  @override
  Future<String?> currentToken() async => null;
}
