import "package:flutter/material.dart";
import "package:sentry_flutter/sentry_flutter.dart";

import "src/app.dart";
import "src/app_dependencies.dart";
import "src/config/app_config.dart";
import "src/domain/format.dart";

Future<void> main() async {
  // Pagar rilis: build rilis/profil dengan API_BASE kelas dev harus gagal
  // sekarang, bukan saat pengguna pertama membuka aplikasi.
  AppConfig.assertReleaseReady();
  WidgetsFlutterBinding.ensureInitialized();
  await Format.initialize();
  final dependencies = AppDependencies();

  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment("SENTRY_DSN");
      options.tracesSampleRate = 0.1;
      options.environment =
          const String.fromEnvironment("APP_ENV", defaultValue: "dev");
    },
    appRunner: () => runApp(LaundryOsApp(dependencies: dependencies)),
  );
}
